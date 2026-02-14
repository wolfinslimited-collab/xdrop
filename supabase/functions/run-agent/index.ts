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

    // ===== DEPLOY =====
    if (action === "deploy") {
      const { agentId } = body;
      return new Response(
        JSON.stringify({ success: true, agentId, message: "Agent deployed to Lovable Cloud" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== RUN AGENT (streaming) =====
    if (action === "run") {
      const { agentId, prompt, agentConfig } = body;

      // Deduct credits
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

      // Build system prompt
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

      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!anthropicKey) {
        return new Response(
          JSON.stringify({ error: "AI service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Stream from Anthropic
      const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: systemPrompt,
          stream: true,
          messages: [{ role: "user", content: prompt || "Hello, what can you do?" }],
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

      // Collect full output while streaming to client
      let fullOutput = "";
      const userId = user.id;

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "content_block_delta" && event.delta?.text) {
                fullOutput += event.delta.text;
                // Forward as OpenAI-compatible SSE
                const sseChunk = {
                  choices: [{ delta: { content: event.delta.text } }],
                };
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify(sseChunk)}\n\n`)
                );
              } else if (event.type === "message_stop") {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              }
            } catch { /* skip malformed */ }
          }
        },
        async flush() {
          // Record the run after stream completes
          try {
            await adminClient.from("agent_runs").insert({
              agent_id: agentId,
              user_id: userId,
              status: "completed",
              inputs: { prompt },
              outputs: { response: fullOutput },
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Failed to save run:", e);
          }
        },
      });

      return new Response(aiResp.body!.pipeThrough(transformStream), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
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
