import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WOLFINS_BASE = "https://kaqsiocszidolsaoeusd.supabase.co/functions/v1/wallet-api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Parse request
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Wolfins API request
    const wolfinsParams = new URLSearchParams({ action });

    // Forward relevant query params
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "action") {
        wolfinsParams.set(key, value);
      }
    }

    const wolfinsUrl = `${WOLFINS_BASE}?${wolfinsParams}`;
    const wolfinsHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: Deno.env.get("WOLFINS_ANON_KEY")!,
      "x-api-key": Deno.env.get("WOLFINS_API_KEY")!,
    };

    const fetchOptions: RequestInit = {
      method: req.method === "POST" ? "POST" : "GET",
      headers: wolfinsHeaders,
    };

    // Forward body for POST requests
    if (req.method === "POST") {
      const body = await req.json();
      fetchOptions.body = JSON.stringify(body);
    }

    const wolfinsRes = await fetch(wolfinsUrl, fetchOptions);
    const data = await wolfinsRes.json();

    return new Response(JSON.stringify(data), {
      status: wolfinsRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Wallet proxy error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
