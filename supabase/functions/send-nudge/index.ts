import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import WebPush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized')

    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) throw new Error('Unauthorized')

    const { data: tether } = await supabaseClient
      .from('tethers')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle()

    if (!tether || !tether.user2_id) {
      return new Response(JSON.stringify({ success: true, reason: 'No paired partner' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const partnerUserId = tether.user1_id === user.id ? tether.user2_id : tether.user1_id

    const { data: partnerProfile } = await supabaseClient
      .from('profiles')
      .select('push_subscription')
      .eq('user_id', partnerUserId)
      .maybeSingle()

    if (partnerProfile?.push_subscription) {
      WebPush.setVapidDetails(
        'mailto:support@tether.app',
        "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs",
        Deno.env.get('VAPID_PRIVATE_KEY')!
      )

      await WebPush.sendNotification(
        partnerProfile.push_subscription as any,
        JSON.stringify({ title: "Tether", body: "I miss you! ❤️" })
      )
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})