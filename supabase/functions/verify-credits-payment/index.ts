import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_PACKS: Record<string, { base: number; bonus: number; total: number }> = {
  "price_1Sze7MDlHg9BacxzHcvgf1no": { base: 500, bonus: 100, total: 600 },
  "price_1Sze7uDlHg9Bacxzfb8GbnuD": { base: 1500, bonus: 525, total: 2025 },
  "price_1Sze8FDlHg9Bacxz8woqdTgr": { base: 5000, bonus: 2500, total: 7500 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("No signature");

    // For simplicity, verify via session ID from query param
    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("No session ID");

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const userId = session.metadata?.user_id;
    const creditsStr = session.metadata?.credits;
    if (!userId || !creditsStr) throw new Error("Missing metadata");

    const credits = parseInt(creditsStr, 10);

    // Use service role to add credits
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabaseAdmin.rpc("add_credits", {
      p_user_id: userId,
      p_amount: credits,
      p_type: "purchase",
      p_description: `Purchased ${credits} credits`,
      p_metadata: { stripe_session_id: sessionId },
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, credits: (data as any)?.credits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
