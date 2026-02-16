import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import WebPush from 'https://esm.sh/web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests for the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user who triggered the nudge
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) throw new Error('Unauthorized')

    // 1. Find the partner's ID from your profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .single()

    if (!profile?.partner_id) throw new Error('No partner paired')

    // 2. Get the partner's push subscription from the DB
    const { data: partner } = await supabaseClient
      .from('profiles')
      .select('push_subscription')
      .eq('id', profile.partner_id)
      .single()

    if (partner?.push_subscription) {
      WebPush.setVapidDetails(
        'mailto:support@tether.app',
        "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs",
        Deno.env.get('VAPID_PRIVATE_KEY')!
      )

      await WebPush.sendNotification(
        partner.push_subscription,
        JSON.stringify({ 
          title: "Tether", 
          body: "Your partner is thinking of you! ❤️" 
        })
      )
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})