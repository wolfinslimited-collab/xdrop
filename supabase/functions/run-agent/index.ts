import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ===== DEPLOY (save agent + manifest) =====
    if (action === "deploy") {
      const { config, agentId } = body;
      // No RunPod needed — agent is saved and ready for cloud runs
      return new Response(
        JSON.stringify({
          success: true,
          agentId,
          message: "Agent deployed to Lovable Cloud",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== RUN AGENT =====
    if (action === "run") {
      const { agentId, prompt, agentConfig } = body;

      // Deduct credits (5 base + run)
      const { data: deductResult } = await adminClient.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: 5,
        p_type: "agent_run",
        p_description: `Agent run: ${agentConfig?.name || agentId}`,
      });

      const result = deductResult as unknown as { success: boolean; error?: string };
      if (!result?.success) {
        return new Response(
          JSON.stringify({ error: result?.error || "Insufficient credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build system prompt from agent config
      const skills = (agentConfig?.skills || [])
        .filter((s: { enabled: boolean }) => s.enabled)
        .map((s: { name: string; description: string }) => `- ${s.name}: ${s.description}`)
        .join("\n");

      const integrations = (agentConfig?.integrations || [])
        .filter((i: { connected: boolean }) => i.connected)
        .map((i: { name: string }) => i.name)
        .join(", ");

      const systemPrompt = `You are "${agentConfig?.name || "AI Agent"}", an OpenClaw AI agent.
${agentConfig?.description ? `Description: ${agentConfig.description}` : ""}

Your capabilities:
${skills || "- General assistant"}

${integrations ? `Connected integrations: ${integrations}` : ""}

Guardrails:
- Max spend per run: $${agentConfig?.guardrails?.maxSpendPerRun || 10}
- Require approval for actions: ${agentConfig?.guardrails?.requireApproval ? "Yes" : "No"}

Execute the user's task efficiently. Provide clear, actionable results.`;

      // Call Lovable AI
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableApiKey) {
        return new Response(
          JSON.stringify({ error: "AI service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiResp = await fetch("https://ai.lovable.dev/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt || "Hello, what can you do?" },
          ],
          max_tokens: 2048,
        }),
      });

      if (!aiResp.ok) {
        const errData = await aiResp.text();
        console.error("AI API error:", errData);
        return new Response(
          JSON.stringify({ error: "AI service error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResp.json();
      const output = aiData.choices?.[0]?.message?.content || "No response generated.";

      // Record the run
      await adminClient.from("agent_runs").insert({
        agent_id: agentId,
        user_id: user.id,
        status: "completed",
        inputs: { prompt } as unknown as import("https://esm.sh/@supabase/supabase-js@2").Json,
        outputs: { response: output } as unknown as import("https://esm.sh/@supabase/supabase-js@2").Json,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true, output }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Supported: deploy, run" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("run-agent error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
