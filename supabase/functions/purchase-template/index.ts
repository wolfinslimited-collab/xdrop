import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabaseClient.auth.getUser(token);
    const user = authData.user;
    if (!user) throw new Error("Not authenticated");

    const { templateId, templateName, templateDescription, templateAvatar, templateCategory, monthlyReturnMin, monthlyReturnMax, price } = await req.json();

    if (!templateId || !templateName) {
      throw new Error("Missing template data");
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check wallet balance
    const { data: wallet } = await serviceClient
      .from("wallets")
      .select("id, balance")
      .eq("user_id", user.id)
      .eq("currency", "USDC")
      .single();

    if (!wallet) {
      throw new Error("No USDC wallet found. Please create a wallet first.");
    }

    const purchasePrice = price || 100;
    if (wallet.balance < purchasePrice) {
      throw new Error(`Insufficient USDC balance. You need $${purchasePrice} but have $${wallet.balance}.`);
    }

    // Deduct from wallet
    const { error: walletError } = await serviceClient
      .from("wallets")
      .update({ balance: wallet.balance - purchasePrice })
      .eq("id", wallet.id);

    if (walletError) throw new Error("Failed to deduct wallet balance");

    // Create agent from template
    const { data: agent, error: agentError } = await serviceClient
      .from("agents")
      .insert({
        creator_id: user.id,
        name: templateName,
        description: templateDescription || templateName,
        short_description: templateDescription,
        avatar: templateAvatar || "🤖",
        status: "published",
        template_id: templateId,
        price: purchasePrice,
        monthly_return_min: monthlyReturnMin || 0,
        monthly_return_max: monthlyReturnMax || 0,
        purchased_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (agentError) {
      // Refund wallet on failure
      await serviceClient
        .from("wallets")
        .update({ balance: wallet.balance })
        .eq("id", wallet.id);
      throw new Error("Failed to create agent: " + agentError.message);
    }

    // Create purchase record
    await serviceClient
      .from("agent_purchases")
      .insert({
        user_id: user.id,
        agent_id: agent.id,
        price_paid: purchasePrice,
        subscription_status: "one_time",
      });

    return new Response(JSON.stringify({ 
      success: true, 
      agent,
      newBalance: wallet.balance - purchasePrice 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
