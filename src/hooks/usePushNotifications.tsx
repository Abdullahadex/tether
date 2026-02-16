import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs";

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Helper to convert VAPID key for browser security
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save to your 'profiles' table in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ push_subscription: subscription })
        .eq('id', user.id);

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Nudges enabled!");
    } catch (err) {
      console.error("Subscription failed:", err);
      toast.error("Failed to enable nudges. Make sure Tether is added to your Home Screen.");
    }
  };

  return { subscribeToPush, isSubscribed };
};