import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSub = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkSub();
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!user) return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Add to Home Screen first.");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      
      if (perm !== "granted") {
        toast.error("Allow notifications to receive nudges.");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await supabase.from("profiles").update({
        push_subscription: JSON.parse(JSON.stringify(sub)),
      }).eq("user_id", user.id);

      setIsSubscribed(true);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  return { subscribeToPush, isSubscribed };
};