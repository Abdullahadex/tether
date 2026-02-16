import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from "sonner"; 

const VAPID_PUBLIC_KEY = "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
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
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setIsSubscribed(true); 
          }
        }
      } catch (error) {
        console.error("Error checking existing push subscription:", error);
      }
    };
    
    checkSubscription();
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!user) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("To enable nudges on iPhone, tap the Share button and select 'Add to Home Screen' first.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast.error("You need to allow notifications to receive nudges.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

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