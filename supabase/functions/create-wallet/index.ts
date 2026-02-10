import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TATUM_API_KEY = Deno.env.get("TATUM_API_KEY");
    if (!TATUM_API_KEY) throw new Error("TATUM_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Check if wallet already exists
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingWallet } = await supabaseAdmin
      .from("wallets")
      .select("id, address")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingWallet) {
      return new Response(
        JSON.stringify({ address: existingWallet.address, exists: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Solana wallet via Tatum
    const tatumRes = await fetch("https://api.tatum.io/v3/solana/wallet", {
      headers: { "x-api-key": TATUM_API_KEY },
    });

    if (!tatumRes.ok) {
      const errBody = await tatumRes.text();
      throw new Error(`Tatum API failed [${tatumRes.status}]: ${errBody}`);
    }

    const wallet = await tatumRes.json();
    // wallet = { address, privateKey, mnemonic }

    // Store wallet address (never store private key in DB — return to user once)
    const { error: insertError } = await supabaseAdmin
      .from("wallets")
      .insert({
        user_id: user.id,
        address: wallet.address,
        balance: 0,
        network: "solana",
        currency: "USDC",
      });

    if (insertError) throw new Error(`Failed to save wallet: ${insertError.message}`);

    return new Response(
      JSON.stringify({
        address: wallet.address,
        mnemonic: wallet.mnemonic,
        privateKey: wallet.privateKey,
        exists: false,
        warning: "Save your mnemonic and private key securely. They will NOT be shown again.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-wallet error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
