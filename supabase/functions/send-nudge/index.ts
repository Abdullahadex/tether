import webPush from "https://esm.sh/web-push@3.6.7";
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

    // NEW: Fetch the sender's name from their profile
    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    // If they don't have a name set, default to "someone"
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

    webPush.setVapidDetails(
      'mailto:hello@tether.app', 
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    );

    // NEW: Inject the name into the notification body!
    const payload = JSON.stringify({
      title: 'You got a nudge ✨',
      body: `${senderName.toLowerCase()} is thinking about you...`, 
    });

    await webPush.sendNotification(partnerProfile.push_subscription, payload);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});