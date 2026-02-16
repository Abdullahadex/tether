import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import WebPush from 'https://esm.sh/web-push'

const VAPID_PUBLIC_KEY = "BHYKN1hf9If62947vIO1K6K5pORWJ2kQMr2CbD-bHrMlvLjJ7zMA6jeBoRS3LO2LW7S51vgSOZJ-nPyarz9-Fjs";
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY'); // Should be KLWPWlWT6Lv3fqVWvWu06l83KXqD-zndAc1z5EnFeDU

WebPush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const authHeader = req.headers.get('Authorization')!
  const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('partner_id')
    .eq('id', user?.id)
    .single()

  const { data: partner } = await supabaseClient
    .from('profiles')
    .select('push_subscription')
    .eq('id', profile.partner_id)
    .single()

  if (partner?.push_subscription) {
    try {
      await WebPush.sendNotification(
        partner.push_subscription,
        JSON.stringify({ title: "Tether", body: "I miss you! ❤️" })
      )
    } catch (error) {
      console.error("Error sending push:", error);
    }
  }

  return new Response(JSON.stringify({ success: true }), { 
    headers: { 'Content-Type': 'application/json' } 
  })
})