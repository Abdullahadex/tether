import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs";

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const ensureServiceWorkerRegistration = async () => {
    const existing = await navigator.serviceWorker.getRegistration("/");
    return existing ?? navigator.serviceWorker.register("/sw.js");
  };

  useEffect(() => {
    const checkExistingSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSubscribed(false);
        return;
      }

      const registration = await ensureServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    };

    checkExistingSubscription();
  }, []);

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

  const saveSubscriptionForCurrentUser = async (subscriptionJson: object) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ push_subscription: subscriptionJson })
      .eq('user_id', user.id);

    if (error) throw error;
  };

  useEffect(() => {
    const syncExistingSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      try {
        const registration = await ensureServiceWorkerRegistration();
        const existingSubscription = await registration.pushManager.getSubscription();
        if (!existingSubscription) return;
        await saveSubscriptionForCurrentUser(existingSubscription.toJSON());
      } catch (error) {
        console.error("Failed to sync push subscription:", error);
      }
    };

    syncExistingSubscription();
  }, []);

  const subscribeToPush = async () => {
    try {
      if (!('Notification' in window)) {
        toast.error("Notifications are not supported in this browser.");
        return;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error("Push notifications are not supported on this device.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("Permission denied.");
        return;
      }

      const registration = await ensureServiceWorkerRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await saveSubscriptionForCurrentUser(subscription.toJSON());

      setIsSubscribed(true);
      toast.success("Nudges enabled!");
    } catch (err) {
      console.error(err);
      toast.error("Could not enable notifications. Please try again.");
    }
  };

  return { subscribeToPush, isSubscribed };
};