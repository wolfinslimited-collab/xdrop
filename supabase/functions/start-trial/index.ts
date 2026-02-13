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

    const { templateId, templateName, templateDescription, templateAvatar, templateCategory, monthlyReturnMin, monthlyReturnMax } = await req.json();

    if (!templateId || !templateName) {
      throw new Error("Missing template data");
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user already has a trial for this template
    const { data: existingTrial } = await serviceClient
      .from("agent_trials")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("template_id", templateId)
      .maybeSingle();

    if (existingTrial) {
      throw new Error("You have already used your free trial for this agent. Each user gets one trial per agent.");
    }

    // Create trial agent
    const { data: agent, error: agentError } = await serviceClient
      .from("agents")
      .insert({
        creator_id: user.id,
        name: `${templateName} (Trial)`,
        description: templateDescription || templateName,
        short_description: templateDescription,
        avatar: templateAvatar || "🤖",
        status: "published",
        template_id: templateId,
        price: 0,
        monthly_return_min: monthlyReturnMin || 0,
        monthly_return_max: monthlyReturnMax || 0,
        is_trial: true,
        trial_earnings_locked: 0,
      })
      .select()
      .single();

    if (agentError) {
      throw new Error("Failed to create trial agent: " + agentError.message);
    }

    // Create trial record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: trialError } = await serviceClient
      .from("agent_trials")
      .insert({
        user_id: user.id,
        template_id: templateId,
        agent_id: agent.id,
        expires_at: expiresAt.toISOString(),
        status: "active",
      });

    if (trialError) {
      // Clean up agent on failure
      await serviceClient.from("agents").delete().eq("id", agent.id);
      throw new Error("Failed to create trial: " + trialError.message);
    }

    return new Response(JSON.stringify({
      success: true,
      agent,
      trial: {
        expiresAt: expiresAt.toISOString(),
        daysRemaining: 7,
      },
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
