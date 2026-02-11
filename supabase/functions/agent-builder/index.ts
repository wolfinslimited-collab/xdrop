import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, currentConfig } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const enabledSkills = currentConfig?.skills?.filter((s: any) => s.enabled)?.map((s: any) => s.name) || [];
    const connectedIntegrations = currentConfig?.integrations?.filter((i: any) => i.connected)?.map((i: any) => i.name) || [];

    const systemPrompt = `You are Clawdbot — the XDROP Agent Builder assistant. You help users design, configure, and deploy OpenClaw-based AI agents on RunPod serverless infrastructure.

## About OpenClaw
OpenClaw (github.com/openclaw/openclaw) is an open-source personal AI assistant framework with 183k+ stars. It supports:
- **ClawhHub Skills**: 2999+ community-built skills for automation, trading, data, communication, and more
- **Memory & Context**: Long-term memory, conversation persistence, vector storage
- **Multi-model support**: Works with GPT-5, Gemini, Claude, Llama, and local models
- **Plugin architecture**: Extend with custom skills from ClawhHub marketplace

## About RunPod Deployment
Agents are deployed as serverless workers on RunPod:
- **GPU Options**: A40, A100, H100 for model inference
- **CPU-only**: Available for lightweight agents that don't need GPU
- **Auto-scaling**: Scales from 0 to N workers based on demand
- **Pricing**: Pay per second of compute, no idle costs

## Your Role
Guide users through building an OpenClaw agent step-by-step:
1. Understand their goal — what should the agent do?
2. Suggest an agent name (prefix with "Agent Name: " so UI can parse it)
3. Recommend ClawhHub skills and integrations by exact name
4. Configure the AI model (recommend based on task complexity)
5. Set memory settings (context window, long-term memory)
6. Define triggers (cron, webhook, event, manual)
7. Set guardrails (spending caps, rate limits, approval gates)
8. Guide RunPod deployment (GPU tier, scaling config)

## Available Skills (ClawhHub)
Web Scraping, Send Emails, Read Emails, Calendar Management, Crypto Trading, DCA Bot, Social Posting, Lead Generation, Customer Support, File Management, Browser Automation, Data Analysis.

## Available Integrations
Telegram, Discord, Twitter/X, Shopify, Gmail, Slack, Notion, GitHub.

## AI Models for Agent
- Claude Sonnet 4 — best for complex reasoning and instruction following
- Claude 3.5 Sonnet — excellent balance of speed and quality
- Claude 3.5 Haiku — fast and cost-effective for simpler tasks
- Llama 3.1 70B — open-source, runs on RunPod GPU
- Mistral Large — fast, multilingual

## RunPod GPU Tiers
- CPU Only — $0.003/sec — lightweight tasks, no inference
- A40 (48GB) — $0.39/hr — mid-range inference
- A100 (80GB) — $1.09/hr — large models, fast inference
- H100 (80GB) — $3.49/hr — maximum performance

## Current Config State
- Agent name: ${currentConfig?.name || '(not set)'}
- Model: ${currentConfig?.model || 'Not selected'}
- Enabled skills: ${enabledSkills.length > 0 ? enabledSkills.join(', ') : 'None'}
- Connected integrations: ${connectedIntegrations.length > 0 ? connectedIntegrations.join(', ') : 'None'}
- Trigger: ${currentConfig?.triggers?.[0]?.type || 'manual'}
- RunPod GPU: ${currentConfig?.runpodConfig?.gpuTier || 'Not selected'}

Format responses with markdown. Use **bold** for key concepts and bullet points for lists. Be conversational but structured. Ask one clarifying question at a time. Always move toward a deployable configuration. When recommending skills or integrations, mention them by exact name so the UI auto-enables them.`;

    // Convert messages to Anthropic format (separate system from user/assistant)
    const anthropicMessages = messages.map((m: any) => ({
      role: m.role === "system" ? "user" : m.role,
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI API error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Anthropic SSE stream to OpenAI-compatible format
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
              const openaiChunk = {
                choices: [{ delta: { content: event.delta.text } }],
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
            } else if (event.type === "message_stop") {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            }
          } catch { /* skip malformed */ }
        }
      },
    });

    return new Response(response.body!.pipeThrough(transformStream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-builder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
