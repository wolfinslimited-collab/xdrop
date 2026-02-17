import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WOLFINS_BASE_URL = "https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api";

async function wolfinsApi(action: string, params: Record<string, string> = {}, body: Record<string, unknown> | null = null) {
  const WOLFINS_ANON_KEY = Deno.env.get("WOLFINS_ANON_KEY")!;
  const WOLFINS_API_KEY = Deno.env.get("WOLFINS_API_KEY")!;

  const qp = new URLSearchParams({ action, ...params });
  const options: RequestInit = {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "apikey": WOLFINS_ANON_KEY,
      "x-api-key": WOLFINS_API_KEY,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${WOLFINS_BASE_URL}?${qp}`, options);
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Wolfins API failed [${res.status}]: ${errBody}`);
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WOLFINS_API_KEY = Deno.env.get("WOLFINS_API_KEY");
    if (!WOLFINS_API_KEY) throw new Error("WOLFINS_API_KEY is not configured");

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

    // Get next derivation index atomically
    const { data: derivationIndex } = await supabaseAdmin.rpc("next_derivation_index", { p_chain: "SOL" });

    // Create Solana wallet via Wolfins Wallet Hub
    const wallet = await wolfinsApi("generate-user-wallet", {}, {
      chain: "SOL",
      derivationIndex: derivationIndex || 1,
    });

    // Store wallet address
    const { error: insertError } = await supabaseAdmin
      .from("wallets")
      .insert({
        user_id: user.id,
        address: wallet.address,
        balance: 0,
        network: "solana",
        currency: "USDC",
        derivation_index: derivationIndex || 1,
      });

    if (insertError) throw new Error(`Failed to save wallet: ${insertError.message}`);

    return new Response(
      JSON.stringify({
        address: wallet.address,
        exists: false,
        warning: "Your wallet has been created and is managed by the platform.",
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
