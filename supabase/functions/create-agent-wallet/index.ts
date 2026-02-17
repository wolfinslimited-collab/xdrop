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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { agentName } = await req.json();
    if (!agentName) throw new Error("agentName is required");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if agent wallet already exists for this user + agent name
    const { data: existing } = await supabaseAdmin
      .from("agent_wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("agent_name", agentName)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          exists: true,
          sol_address: existing.sol_address,
          usdc_address: existing.usdc_address,
          sol_balance: existing.sol_balance,
          usdc_balance: existing.usdc_balance,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get next derivation index atomically
    const { data: derivationIndex } = await supabaseAdmin.rpc("next_derivation_index", { p_chain: "SOL" });

    // Generate Solana wallet via Wolfins Wallet Hub
    const wallet = await wolfinsApi("generate-user-wallet", {}, {
      chain: "SOL",
      derivationIndex: derivationIndex || 1,
    });

    // Store in agent_wallets (SOL and USDC share the same Solana address)
    const { error: insertError } = await supabaseAdmin
      .from("agent_wallets")
      .insert({
        agent_name: agentName,
        user_id: user.id,
        sol_address: wallet.address,
        usdc_address: wallet.address,
        sol_balance: 0,
        usdc_balance: 0,
        network: "solana",
        derivation_index: derivationIndex || 1,
      });

    if (insertError) throw new Error(`Failed to save wallet: ${insertError.message}`);

    return new Response(
      JSON.stringify({
        exists: false,
        sol_address: wallet.address,
        usdc_address: wallet.address,
        sol_balance: 0,
        usdc_balance: 0,
        warning: "Agent wallet created. Keys are managed by the platform.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-agent-wallet error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
