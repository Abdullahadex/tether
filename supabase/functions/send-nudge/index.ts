import * as WebPush from "npm:web-push-browser";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    const senderName = senderProfile?.name || 'someone';

    const { data: tether } = await supabaseClient
      .from('tethers')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (!tether) throw new Error("No tether found");

    const partnerId = tether.user1_id === user.id ? tether.user2_id : tether.user1_id;

    const { data: partnerProfile } = await supabaseClient
      .from('profiles')
      .select('push_subscription')
      .eq('user_id', partnerId)
      .single();

    if (!partnerProfile?.push_subscription) {
       return new Response(JSON.stringify({ error: 'Partner has not enabled notifications' }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 400,
       });
    }

    // 1. Get the Web Push function
    const sendPush = WebPush.sendPushNotification || WebPush.sendNotification;

    // 2. Deserialize VAPID keys into a modern Web Crypto KeyPair
    const keyPair = await WebPush.deserializeVapidKeys({
      publicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    });

    const sub = partnerProfile.push_subscription;

    // 3. Send the notification directly to Apple using Deno's native Web Crypto!
    const res = await sendPush(
      keyPair,
      {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys.auth,
          p256dh: sub.keys.p256dh
        }
      },
      "mailto:hello@tether.app", 
      JSON.stringify({
        title: 'You got a nudge ✨',
        body: `${senderName.toLowerCase()} is thinking about you...`, 
      })
    );

    if (!res.ok) {
        throw new Error(`Push service failed with status: ${res.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Push Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});