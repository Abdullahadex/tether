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
    const { data, error } = await supabase
      .from("tethers")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("Failed to fetch tether:", error);
      setTether(null);
      return null;
    }

    const rows = data ?? [];
    const selectedTether =
      rows.find((row) => row.user2_id && (row.user1_id === user.id || row.user2_id === user.id)) ??
      rows[0] ??
      null;

    setTether(selectedTether);
    return selectedTether;
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

  useEffect(() => {
    if (!user) return;

    const tetherChannel = supabase
      .channel(`tether-updates:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tethers",
          filter: `user1_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setTether(null);
            setPartnerProfile(null);
            return;
          }

          const nextTether = payload.new as any;
          setTether(nextTether);
          await fetchPartnerProfile(nextTether);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tethers",
          filter: `user2_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setTether(null);
            setPartnerProfile(null);
            return;
          }

          const nextTether = payload.new as any;
          setTether(nextTether);
          await fetchPartnerProfile(nextTether);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tetherChannel);
    };
  }, [user, fetchPartnerProfile]);

  useEffect(() => {
    if (!user || !tether) {
      setIsPartnerOnline(false);
      setIsPartnerHolding(false);
      return;
    }
    const partnerUserId = tether.user1_id === user.id ? tether.user2_id : tether.user1_id;
    if (!partnerUserId) {
      setIsPartnerOnline(false);
      return;
    }

    const updatePartnerOnlineFromPresence = (channel: any) => {
      const state = channel.presenceState();
      setIsPartnerOnline(Boolean(state?.[partnerUserId]?.length));
    };

    const channel = supabase.channel(`tether:${tether.id}`, {
      config: { 
        presence: { key: user.id },
        broadcast: { self: false, ack: false } 
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        updatePartnerOnlineFromPresence(channel);
      })
      .on('presence', { event: 'join' }, () => {
        updatePartnerOnlineFromPresence(channel);
      })
      .on('presence', { event: 'leave' }, () => {
        updatePartnerOnlineFromPresence(channel);
      })
      .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
        setIsPartnerHolding(payload.isHolding);

        if (payload.isHolding && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]); 
        }
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles', 
        filter: `user_id=eq.${partnerUserId}` 
      }, (payload) => {
        setPartnerProfile(payload.new);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
          updatePartnerOnlineFromPresence(channel);
        }
      });

    channelRef.current = channel;
    
    return () => { 
      setIsPartnerOnline(false);
      setIsPartnerHolding(false);
      supabase.removeChannel(channel); 
    };
  }, [user, tether]);

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

  useEffect(() => {
    if (!user || !tether || tether.user2_id) return;

    const interval = window.setInterval(async () => {
      const latestTether = await fetchTether();
      if (latestTether?.user2_id) {
        await fetchPartnerProfile(latestTether);
      }
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [user, tether, fetchTether, fetchPartnerProfile]);

  const sendHeartbeat = (isHolding: boolean) => {
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
    const limited = status.slice(0, 20);
    const nextStatus = limited || null;
    const nextStatusSetAt = limited ? new Date().toISOString() : null;

    setMyProfile((prev: any) =>
      prev
        ? { ...prev, current_status: nextStatus, status_set_at: nextStatusSetAt }
        : prev
    );

    const { error } = await supabase.from("profiles").update({
      current_status: nextStatus,
      status_set_at: nextStatusSetAt
    }).eq("user_id", user.id);

    if (error) {
      console.error("Failed to update status:", error);
    }

    await fetchMyProfile();
  };

  const updateSignatureColor = async (color: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ 
      signature_color: color 
    }).eq("user_id", user.id);
    await fetchMyProfile();
  };

  return {
    tether, 
    myProfile, 
    partnerProfile, 
    loading, 
    updateStatus,
    updateSignatureColor,
    isPaired: !!(tether?.user1_id && tether?.user2_id),
    isPartnerOnline, 
    isPartnerHolding, 
    sendHeartbeat,
    createTether: async () => {
        const { data: existingPending } = await supabase
          .from("tethers")
          .select("*")
          .eq("user1_id", user.id)
          .is("user2_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingPending) {
          setTether(existingPending);
          return existingPending;
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data } = await supabase.from("tethers").insert({ user1_id: user.id, pair_code: code }).select().single();
        if (data) {
          setTether(data);
          await fetchPartnerProfile(data);
        }
        return data;
    },
    joinTether: async (code: string) => {
        const { data: ex } = await supabase.from("tethers").select("*").eq("pair_code", code.toUpperCase()).is("user2_id", null).maybeSingle();
        if (!ex) return { error: "Invalid code" };
        const { data } = await supabase.from("tethers").update({ user2_id: user.id }).eq("id", ex.id).select().single();
        if (data) {
          await supabase
            .from("tethers")
            .delete()
            .eq("user1_id", user.id)
            .is("user2_id", null)
            .neq("id", data.id);

          setTether(data);
          await fetchPartnerProfile(data);
        }
        return { error: null };
    }
  };
};