import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, currentConfig } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const enabledSkills = currentConfig?.skills?.filter((s: any) => s.enabled)?.map((s: any) => s.name) || [];
    const connectedIntegrations = currentConfig?.integrations?.filter((i: any) => i.connected)?.map((i: any) => i.name) || [];

    const systemPrompt = `You are the XDROP Agent Builder — an expert AI that helps users design, configure, and deploy AI agents (like OpenClaw).

The user has a config panel on the right side where they can manually toggle skills and integrations. Your job is to guide them conversationally and suggest what to enable. When you recommend skills or integrations, mention them by name so the system can auto-enable them.

Available skills: Web Scraping, Send Emails, Read Emails, Calendar Management, Crypto Trading, DCA Bot, Social Posting, Lead Generation, Customer Support, File Management, Browser Automation, Data Analysis.

Available integrations: Telegram, Discord, Twitter/X, Shopify, Gmail, Slack, Notion, GitHub.

Trigger types: Manual, Schedule (cron), Webhook, Event-based.

Current config state:
- Agent name: ${currentConfig?.name || '(not set)'}
- Enabled skills: ${enabledSkills.length > 0 ? enabledSkills.join(', ') : 'None'}
- Connected integrations: ${connectedIntegrations.length > 0 ? connectedIntegrations.join(', ') : 'None'}
- Trigger: ${currentConfig?.triggers?.[0]?.type || 'manual'}

When a user describes what they want:
1. Understand their goal and clarify if needed
2. Suggest an agent name (prefix with "Agent Name: " so the UI can parse it)
3. Recommend specific skills and integrations by exact name
4. Define workflow steps
5. Set guardrails (spending caps, rate limits, approval requirements)
6. Guide them to test and deploy

Format responses with markdown. Use **bold** for key concepts and bullet points for lists. Be conversational but structured. Ask one clarifying question at a time. Always move toward a deployable configuration.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-builder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
