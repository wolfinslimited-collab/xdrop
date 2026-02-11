import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500 });
    }

    const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        return new Response(JSON.stringify({ received: true, action: "skipped" }), { status: 200 });
      }

      const userId = session.metadata?.user_id;
      const creditsStr = session.metadata?.credits;

      if (!userId || !creditsStr) {
        console.error("Missing metadata in session", session.id);
        return new Response(JSON.stringify({ error: "Missing metadata" }), { status: 400 });
      }

      const credits = parseInt(creditsStr, 10);

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data, error } = await supabaseAdmin.rpc("add_credits", {
        p_user_id: userId,
        p_amount: credits,
        p_type: "purchase",
        p_description: `Purchased ${credits} credits via Stripe`,
        p_metadata: { stripe_session_id: session.id, stripe_event_id: event.id },
      });

      if (error) {
        console.error("Failed to add credits:", error);
        return new Response(JSON.stringify({ error: "Failed to add credits" }), { status: 500 });
      }

      console.log(`Added ${credits} credits to user ${userId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
