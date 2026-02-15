import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useTether = () => {
  const { user } = useAuth();
  const [tether, setTether] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setMyProfile(data);
    return data;
  }, [user]);

  const fetchPartnerProfile = useCallback(async (tether: any) => {
    if (!user || !tether) return;
    const partnerId = tether.user1_id === user.id ? tether.user2_id : tether.user1_id;
    if (!partnerId) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", partnerId)
      .maybeSingle();
    setPartnerProfile(data);
  }, [user]);

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

  const createTether = async () => {
    if (!user) return null;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from("tethers")
      .insert({ user1_id: user.id, pair_code: code })
      .select()
      .single();
    if (!error && data) setTether(data);
    return data;
  };

  const joinTether = async (code: string) => {
    if (!user) return { error: "Not authenticated" };
    // Find tether by code
    const { data: existing } = await supabase
      .from("tethers")
      .select("*")
      .eq("pair_code", code.toUpperCase())
      .is("user2_id", null)
      .maybeSingle();
    if (!existing) return { error: "Invalid or already used code" };
    if (existing.user1_id === user.id) return { error: "Can't pair with yourself" };

    const { data, error } = await supabase
      .from("tethers")
      .update({ user2_id: user.id })
      .eq("id", existing.id)
      .select()
      .single();
    if (!error && data) {
      setTether(data);
      await fetchPartnerProfile(data);
    }
    return { error: error?.message };
  };

  const updateSignatureColor = async (color: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ signature_color: color }).eq("user_id", user.id);
    await fetchMyProfile();
  };

  const updateStatus = async (status: string) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ current_status: status || null, status_set_at: status ? new Date().toISOString() : null })
      .eq("user_id", user.id);
    await fetchMyProfile();
  };

  const isPaired = tether && tether.user1_id && tether.user2_id;

  return {
    tether,
    myProfile,
    partnerProfile,
    loading,
    isPaired,
    createTether,
    joinTether,
    updateSignatureColor,
    updateStatus,
    fetchPartnerProfile,
    fetchTether,
  };
};
