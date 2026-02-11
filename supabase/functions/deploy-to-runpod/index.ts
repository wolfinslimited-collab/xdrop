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
    // Verify user
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

    if (action === "validate-key") {
      const { apiKey } = body;
      if (!apiKey || typeof apiKey !== "string" || apiKey.length < 10) {
        return new Response(
          JSON.stringify({ error: "Invalid API key format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate by calling RunPod's /pods endpoint
      const resp = await fetch("https://api.runpod.io/graphql?api_key=" + encodeURIComponent(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query { myself { id email } }`,
        }),
      });

      const data = await resp.json();
      if (data.errors || !data.data?.myself) {
        return new Response(
          JSON.stringify({ error: "Invalid RunPod API key. Please check and try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Store API key associated with user (in a simple way via user metadata or a table)
      // For now we store it in the user's profile metadata
      // In production, use a proper secrets vault
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, runpod_api_key: apiKey },
      });

      return new Response(
        JSON.stringify({ success: true, email: data.data.myself.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deploy") {
      const { config, agentId } = body;

      // Get user's RunPod API key from metadata
      const runpodApiKey = user.user_metadata?.runpod_api_key;
      if (!runpodApiKey) {
        return new Response(
          JSON.stringify({ error: "RunPod API key not configured. Go to the RunPod tab and add your API key." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const gpuMap: Record<string, string> = {
        cpu: "CPU",
        a40: "NVIDIA A40",
        a100: "NVIDIA A100 80GB PCIe",
        h100: "NVIDIA H100 80GB HBM3",
      };

      const endpointId = config?.runpodConfig?.endpointId;

      if (endpointId) {
        // Update existing endpoint
        const resp = await fetch(
          "https://api.runpod.io/graphql?api_key=" + encodeURIComponent(runpodApiKey),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `mutation {
                saveEndpoint(input: {
                  id: "${endpointId}"
                  name: "${(config.name || "OpenClaw Agent").replace(/"/g, '\\"')}"
                  gpuIds: "${gpuMap[config.runpodConfig?.gpuTier] || "CPU"}"
                  workersMin: ${config.runpodConfig?.minWorkers || 0}
                  workersMax: ${config.runpodConfig?.maxWorkers || 3}
                  idleTimeout: ${config.runpodConfig?.idleTimeout || 60}
                }) {
                  id
                  name
                  workersMin
                  workersMax
                }
              }`,
            }),
          }
        );
        const data = await resp.json();
        if (data.errors) {
          return new Response(
            JSON.stringify({ error: data.errors[0]?.message || "Failed to update RunPod endpoint" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ success: true, endpoint: data.data?.saveEndpoint, action: "updated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Create new serverless endpoint
        const resp = await fetch(
          "https://api.runpod.io/graphql?api_key=" + encodeURIComponent(runpodApiKey),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `mutation {
                saveEndpoint(input: {
                  name: "${(config.name || "OpenClaw Agent").replace(/"/g, '\\"')}"
                  templateId: "runpod-torch"
                  gpuIds: "${gpuMap[config.runpodConfig?.gpuTier] || "CPU"}"
                  workersMin: ${config.runpodConfig?.minWorkers || 0}
                  workersMax: ${config.runpodConfig?.maxWorkers || 3}
                  idleTimeout: ${config.runpodConfig?.idleTimeout || 60}
                }) {
                  id
                  name
                  workersMin
                  workersMax
                }
              }`,
            }),
          }
        );
        const data = await resp.json();
        if (data.errors) {
          return new Response(
            JSON.stringify({ error: data.errors[0]?.message || "Failed to create RunPod endpoint" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ success: true, endpoint: data.data?.saveEndpoint, action: "created" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("deploy-to-runpod error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
