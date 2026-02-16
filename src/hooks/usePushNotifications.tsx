import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from "sonner"; 

// Your newly generated VAPID Public Key
const VAPID_PUBLIC_KEY = "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs";

// Helper function required by web push protocols
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
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

  const subscribeToPush = useCallback(async () => {
    if (!user) return;

    // 1. Check if the browser supports Push (Fails if not added to iOS Home Screen)
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("To enable nudges on iPhone, tap the Share button and select 'Add to Home Screen' first.");
      return;
    }

    try {
      // 2. Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // 3. Request permission from Apple
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast.error("You need to allow notifications to receive nudges.");
        return;
      }

      // 4. Subscribe the device to the push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 5. Save the iPhone's token to your database
      const { error } = await supabase.from('profiles').update({
        push_subscription: JSON.parse(JSON.stringify(subscription))
      }).eq('user_id', user.id);

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Notifications enabled! You will now receive nudges.");

    } catch (error) {
      console.error("Push setup error:", error);
      toast.error("Failed to enable notifications.");
    }
  }, [user]);

  return { subscribeToPush, isSubscribed };
};
