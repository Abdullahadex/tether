import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PresenceState {
  partnerOnline: boolean;
  bothOnline: boolean;
}

export const usePresence = (tetherPairCode: string | null) => {
  const { user } = useAuth();
  const [state, setState] = useState<PresenceState>({ partnerOnline: false, bothOnline: false });
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!tetherPairCode || !user) return;

    const channel = supabase.channel(`tether:${tetherPairCode}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState();
        const userIds = Object.keys(presenceState);
        const mePresent = userIds.includes(user.id);
        const otherPresent = userIds.some((id) => id !== user.id);
        setState({
          partnerOnline: otherPresent,
          bothOnline: mePresent && otherPresent,
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tetherPairCode, user]);

  return state;
};
