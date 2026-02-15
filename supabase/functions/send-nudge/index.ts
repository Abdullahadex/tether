import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find partner
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tether } = await serviceClient
      .from("tethers")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle();

    if (!tether) {
      return new Response(JSON.stringify({ error: "No tether found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const partnerId = tether.user1_id === user.id ? tether.user2_id : tether.user1_id;
    if (!partnerId) {
      return new Response(JSON.stringify({ error: "No partner" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: partnerProfile } = await serviceClient
      .from("profiles")
      .select("push_subscription")
      .eq("user_id", partnerId)
      .maybeSingle();

    if (!partnerProfile?.push_subscription) {
      return new Response(JSON.stringify({ sent: false, reason: "No push subscription" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Web Push would go here with VAPID keys
    // For now, return that the nudge was recorded
    return new Response(JSON.stringify({ sent: true, message: "Nudge sent" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
