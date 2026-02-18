import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useHeartbeat = (tetherPairCode: string | null) => {
  const { user } = useAuth();
  const [partnerHolding, setPartnerHolding] = useState(false);
  const [iHold, setIHold] = useState(false);
  const [synced, setSynced] = useState(false);
  const channelRef = useRef<any>(null);
  const vibrateIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!tetherPairCode || !user) return;

    const channel = supabase.channel(`heartbeat:${tetherPairCode}`);

    channel
      .on("broadcast", { event: "pulse" }, (payload) => {
        if (payload.payload.user_id !== user.id) {
          setPartnerHolding(payload.payload.holding);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tetherPairCode, user]);

  useEffect(() => {
    const bothHolding = iHold && partnerHolding;
    setSynced(bothHolding);

    if (bothHolding && navigator.vibrate) {
      const pattern = [100, 80, 100, 400];
      navigator.vibrate(pattern);
      vibrateIntervalRef.current = setInterval(() => {
        navigator.vibrate(pattern);
      }, 680);
    } else {
      if (vibrateIntervalRef.current) {
        clearInterval(vibrateIntervalRef.current);
        vibrateIntervalRef.current = null;
      }
      navigator.vibrate?.(0);
    }

    return () => {
      if (vibrateIntervalRef.current) clearInterval(vibrateIntervalRef.current);
    };
  }, [iHold, partnerHolding]);

  const startHold = useCallback(() => {
    setIHold(true);
    channelRef.current?.send({
      type: "broadcast",
      event: "pulse",
      payload: { user_id: user?.id, holding: true },
    });
  }, [user]);

  const endHold = useCallback(() => {
    setIHold(false);
    channelRef.current?.send({
      type: "broadcast",
      event: "pulse",
      payload: { user_id: user?.id, holding: false },
    });
  }, [user]);

  return { startHold, endHold, synced, partnerHolding, iHold };
};
