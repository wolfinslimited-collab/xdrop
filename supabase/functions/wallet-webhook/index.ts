import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-event, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const signature = req.headers.get("x-webhook-signature");
    const event = req.headers.get("x-webhook-event") || "unknown";
    const rawBody = await req.text();

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC-SHA256 signature
    const webhookSecret = Deno.env.get("WOLFINS_WEBHOOK_SECRET");
    if (webhookSecret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
      const expected = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expected !== signature) {
        console.error("Webhook signature mismatch");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    const { data } = payload;

    console.log(`Webhook received: ${event}`, JSON.stringify(data));

    // Use service role to update wallet balances
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event === "deposit" || event === "withdrawal") {
      const address = event === "deposit" ? data.to_address : data.from_address;
      const chain = data.chain;
      const amount = parseFloat(data.amount || "0");

      // Find the wallet by address
      const { data: wallet, error: walletErr } = await supabase
        .from("wallets")
        .select("id, user_id, balance, currency")
        .eq("address", address)
        .maybeSingle();

      if (walletErr) {
        console.error("Error looking up wallet:", walletErr);
      }

      if (wallet) {
        // Update balance
        const newBalance = event === "deposit"
          ? wallet.balance + amount
          : Math.max(0, wallet.balance - amount);

        await supabase
          .from("wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", wallet.id);

        console.log(`Updated wallet ${wallet.id} balance: ${wallet.balance} -> ${newBalance}`);
      } else {
        console.log(`No wallet found for address ${address} on chain ${chain}`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, event, timestamp: new Date().toISOString() }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
