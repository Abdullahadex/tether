import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useTether = () => {
  const { user } = useAuth();
  const [tether, setTether] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isPartnerHolding, setIsPartnerHolding] = useState(false);
  const channelRef = useRef<any>(null);

  const fetchTether = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tethers")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle();
    setTether(data);
    return data;
  }, [user]);

  const fetchMyProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    setMyProfile(data);
    return data;
  }, [user]);

  const fetchPartnerProfile = useCallback(async (tData: any) => {
    if (!user || !tData) return;
    const pId = tData.user1_id === user.id ? tData.user2_id : tData.user1_id;
    if (!pId) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", pId).maybeSingle();
    setPartnerProfile(data);
  }, [user]);

  // Realtime Subscription Effect
  useEffect(() => {
    if (!user || !tether) return;
    const pId = tether.user1_id === user.id ? tether.user2_id : tether.user1_id;
    if (!pId) return;

    const channel = supabase.channel(`tether:${tether.id}`, {
      config: { 
        presence: { key: user.id },
        broadcast: { self: false, ack: false } 
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setIsPartnerOnline(!!state[pId]);
      })
      .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
        setIsPartnerHolding(payload.isHolding);
        
        // HAPTICS FOR RECEIVER: Double-pulse "Heartbeat" when partner presses
        if (payload.isHolding && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]); 
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `user_id=eq.${pId}` 
      }, (payload) => {
        setPartnerProfile(payload.new);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;
    
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [user, tether]);

  // Initial Load Effect
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      await fetchMyProfile();
      const t = await fetchTether();
      if (t) await fetchPartnerProfile(t);
      setLoading(false);
    };
    init();
  }, [user, fetchTether, fetchMyProfile, fetchPartnerProfile]);

  const sendHeartbeat = (isHolding: boolean) => {
    // HAPTICS FOR SENDER: A quick single tap on your own phone when you press
    if (isHolding && "vibrate" in navigator) {
      navigator.vibrate([50]); 
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'heartbeat',
        payload: { isHolding }
      });
    }
  };

  const updateStatus = async (status: string) => {
    if (!user) return;
    const limited = status.slice(0, 20); // 20 character limit
    await supabase.from("profiles").update({ 
      current_status: limited || null, 
      status_set_at: limited ? new Date().toISOString() : null 
    }).eq("user_id", user.id);
    await fetchMyProfile();
  };

  return {
    tether, 
    myProfile, 
    partnerProfile, 
    loading, 
    updateStatus,
    isPaired: !!(tether?.user1_id && tether?.user2_id),
    isPartnerOnline, 
    isPartnerHolding, 
    sendHeartbeat,
    createTether: async () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data } = await supabase.from("tethers").insert({ user1_id: user.id, pair_code: code }).select().single();
        if (data) setTether(data);
        return data;
    },
    joinTether: async (code: string) => {
        const { data: ex } = await supabase.from("tethers").select("*").eq("pair_code", code.toUpperCase()).is("user2_id", null).maybeSingle();
        if (!ex) return { error: "Invalid code" };
        const { data } = await supabase.from("tethers").update({ user2_id: user.id }).eq("id", ex.id).select().single();
        if (data) setTether(data);
        return { error: null };
    }
  };
};