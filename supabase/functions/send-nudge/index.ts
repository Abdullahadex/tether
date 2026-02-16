import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as WebPush from "npm:web-push-browser";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the sender's info from the Auth token
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (!user) throw new Error("Unauthorized");

    // 1. Find the Tether and the Partner's ID
    const { data: tether } = await supabase
      .from("tethers")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    const partnerId = tether.user1_id === user.id ? tether.user2_id : tether.user1_id;

    // 2. Get Partner's Push Subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("push_subscription, display_name")
      .eq("id", partnerId)
      .single();

    if (!profile?.push_subscription) {
      return new Response(JSON.stringify({ error: "Partner not subscribed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Configure WebPush
    WebPush.setVapidDetails(
      "mailto:your-email@example.com",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!
    );

    // 4. Send the Notification
    await WebPush.sendNotification(
      profile.push_subscription,
      JSON.stringify({
        title: "Tether",
        body: `${profile.display_name || "Your partner"} is thinking of you ❤️`,
        tag: "nudge",
      })
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});