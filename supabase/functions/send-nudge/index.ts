import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as WebPush from "npm:web-push-browser"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FALLBACK_VAPID_PUBLIC_KEY = "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs"

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

    let tetherId: string | null = null
    try {
      const body = await req.json()
      tetherId = body?.tetherId ?? null
    } catch {
      tetherId = null
    }

    let tether: { user1_id: string; user2_id: string | null } | null = null

    if (tetherId) {
      const { data: tetherById } = await supabaseClient
        .from('tethers')
        .select('user1_id, user2_id')
        .eq('id', tetherId)
        .maybeSingle()

      if (tetherById && (tetherById.user1_id === user.id || tetherById.user2_id === user.id)) {
        tether = tetherById
      }
    }

    if (!tether) {
      const { data: tetherRows } = await supabaseClient
        .from('tethers')
        .select('user1_id, user2_id, created_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20)

      const rows = tetherRows ?? []
      tether = rows.find((row) => row.user2_id) ?? rows[0] ?? null
    }

    if (!tether || !tether.user2_id) {
      return new Response(JSON.stringify({ success: false, delivered: false, reason: 'No paired partner' }), {
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
      try {
        const sendPush = WebPush.sendPushNotification || WebPush.sendNotification
        const keyPair = await WebPush.deserializeVapidKeys({
          publicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? FALLBACK_VAPID_PUBLIC_KEY,
          privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
        })

        const subscription = partnerProfile.push_subscription as Record<string, unknown> | null
        const endpoint = typeof subscription?.endpoint === "string" ? subscription.endpoint : null
        const keys = (subscription?.keys as Record<string, unknown> | undefined) ?? undefined
        const auth = typeof keys?.auth === "string" ? keys.auth : null
        const p256dh = typeof keys?.p256dh === "string" ? keys.p256dh : null

        if (!endpoint || !auth || !p256dh) {
          await supabaseClient
            .from('profiles')
            .update({ push_subscription: null })
            .eq('user_id', partnerUserId)

          return new Response(JSON.stringify({ success: false, delivered: false, reason: 'Invalid partner subscription removed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const response = await sendPush(
          keyPair,
          {
            endpoint,
            keys: { auth, p256dh }
          },
          "mailto:support@tether.app",
          JSON.stringify({ title: "Tether", body: "I miss you! ❤️" })
        )

        if (!response?.ok) {
          const statusCode = response?.status
          if (statusCode === 404 || statusCode === 410) {
            await supabaseClient
              .from('profiles')
              .update({ push_subscription: null })
              .eq('user_id', partnerUserId)
            return new Response(JSON.stringify({ success: false, delivered: false, reason: 'Expired partner subscription removed' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          throw new Error(`Push service failed with status ${statusCode}`)
        }
      } catch (pushError: unknown) {
        const errorWithStatus = pushError as { statusCode?: number; status_code?: number }
        const statusCode = errorWithStatus?.statusCode ?? errorWithStatus?.status_code
        if (statusCode === 404 || statusCode === 410) {
          await supabaseClient
            .from('profiles')
            .update({ push_subscription: null })
            .eq('user_id', partnerUserId)
          return new Response(JSON.stringify({ success: false, delivered: false, reason: 'Expired partner subscription removed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          throw pushError
        }
      }

      return new Response(JSON.stringify({ success: true, delivered: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ success: false, delivered: false, reason: 'Partner has not enabled notifications' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})