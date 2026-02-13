import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// OpenClaw Docker image for RunPod serverless
const OPENCLAW_DOCKER_IMAGE = "openclaw/openclaw:latest";

// Credit cost per RunPod compute minute
const CREDITS_PER_COMPUTE_MINUTE = 2;

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

    // Helper: get the RunPod API key (user's own or platform)
    const getRunPodKey = (usePlatformKey: boolean): string | null => {
      if (usePlatformKey) {
        return Deno.env.get("RUNPOD_PLATFORM_API_KEY") || null;
      }
      return user.user_metadata?.runpod_api_key || null;
    };

    // ===== VALIDATE KEY =====
    if (action === "validate-key") {
      const { apiKey } = body;
      if (!apiKey || typeof apiKey !== "string" || apiKey.length < 10) {
        return new Response(
          JSON.stringify({ error: "Invalid API key format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resp = await fetch("https://api.runpod.io/graphql?api_key=" + encodeURIComponent(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `query { myself { id email } }` }),
      });

      const data = await resp.json();
      if (data.errors || !data.data?.myself) {
        return new Response(
          JSON.stringify({ error: "Invalid RunPod API key. Please check and try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Store API key in user metadata
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

    // ===== CHECK PLATFORM KEY AVAILABILITY =====
    if (action === "check-platform-key") {
      const platformKey = Deno.env.get("RUNPOD_PLATFORM_API_KEY");
      return new Response(
        JSON.stringify({ available: !!platformKey }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== DEPLOY =====
    if (action === "deploy") {
      const { config, agentId, usePlatformKey = false, openclawConfig } = body;

      const runpodApiKey = getRunPodKey(usePlatformKey);
      if (!runpodApiKey) {
        const msg = usePlatformKey
          ? "Platform RunPod key is not available. Please use your own RunPod API key."
          : "RunPod API key not configured. Go to the RunPod tab and add your API key or use platform credits.";
        return new Response(
          JSON.stringify({ error: msg }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const gpuMap: Record<string, string> = {
        cpu: "CPU",
        a40: "NVIDIA A40",
        a100: "NVIDIA A100 80GB PCIe",
        h100: "NVIDIA H100 80GB HBM3",
      };

      // Generate OpenClaw environment config as JSON string
      const envConfig = openclawConfig ? JSON.stringify(openclawConfig) : "{}";

      const endpointId = config?.runpodConfig?.endpointId;
      const agentName = (config.name || "OpenClaw Agent").replace(/"/g, '\\"');
      const gpuId = gpuMap[config.runpodConfig?.gpuTier] || "CPU";
      const minWorkers = config.runpodConfig?.minWorkers || 0;
      const maxWorkers = config.runpodConfig?.maxWorkers || 3;
      const idleTimeout = config.runpodConfig?.idleTimeout || 60;

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
                  name: "${agentName}"
                  templateId: "${OPENCLAW_DOCKER_IMAGE}"
                  gpuIds: "${gpuId}"
                  workersMin: ${minWorkers}
                  workersMax: ${maxWorkers}
                  idleTimeout: ${idleTimeout}
                  env: [
                    { key: "OPENCLAW_CONFIG", value: ${JSON.stringify(envConfig)} }
                    { key: "AGENT_ID", value: "${agentId || ""}" }
                  ]
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
          JSON.stringify({ success: true, endpoint: data.data?.saveEndpoint, action: "updated", usedPlatformKey: usePlatformKey }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Create new serverless endpoint with OpenClaw Docker image
        const resp = await fetch(
          "https://api.runpod.io/graphql?api_key=" + encodeURIComponent(runpodApiKey),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `mutation {
                saveEndpoint(input: {
                  name: "${agentName}"
                  templateId: "${OPENCLAW_DOCKER_IMAGE}"
                  gpuIds: "${gpuId}"
                  workersMin: ${minWorkers}
                  workersMax: ${maxWorkers}
                  idleTimeout: ${idleTimeout}
                  env: [
                    { key: "OPENCLAW_CONFIG", value: ${JSON.stringify(envConfig)} }
                    { key: "AGENT_ID", value: "${agentId || ""}" }
                  ]
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
          JSON.stringify({ success: true, endpoint: data.data?.saveEndpoint, action: "created", usedPlatformKey: usePlatformKey }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ===== CHECK COMPUTE USAGE =====
    if (action === "check-usage") {
      const { endpointId, usePlatformKey = false } = body;
      if (!endpointId) {
        return new Response(
          JSON.stringify({ error: "Endpoint ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const runpodApiKey = getRunPodKey(usePlatformKey);
      if (!runpodApiKey) {
        return new Response(
          JSON.stringify({ error: "No RunPod API key available" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Query RunPod for endpoint status and jobs
      const resp = await fetch(
        "https://api.runpod.io/graphql?api_key=" + encodeURIComponent(runpodApiKey),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query {
              myself {
                serverlessDiscount
                currentSpend {
                  currentSpend
                  type
                }
              }
            }`,
          }),
        }
      );

      const data = await resp.json();
      if (data.errors) {
        return new Response(
          JSON.stringify({ error: data.errors[0]?.message || "Failed to check usage" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          usage: data.data?.myself?.currentSpend || [],
          discount: data.data?.myself?.serverlessDiscount || 0,
          creditsPerMinute: CREDITS_PER_COMPUTE_MINUTE,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== RUN AGENT (trigger a job) =====
    if (action === "run") {
      const { endpointId, input: agentInput, usePlatformKey = false } = body;
      if (!endpointId) {
        return new Response(
          JSON.stringify({ error: "Endpoint ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const runpodApiKey = getRunPodKey(usePlatformKey);
      if (!runpodApiKey) {
        return new Response(
          JSON.stringify({ error: "No RunPod API key available" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct credits for the run (base cost)
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      if (usePlatformKey) {
        // Deduct credits from user for platform compute
        const { data: deductResult } = await adminClient.rpc("deduct_credits", {
          p_user_id: user.id,
          p_amount: 5, // base run cost
          p_type: "agent_run",
          p_description: `Agent run on endpoint ${endpointId}`,
        });

        const result = deductResult as unknown as { success: boolean; error?: string };
        if (!result?.success) {
          return new Response(
            JSON.stringify({ error: result?.error || "Insufficient credits for agent run" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Submit job to RunPod
      const resp = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${runpodApiKey}`,
        },
        body: JSON.stringify({ input: agentInput || {} }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: data.error || "Failed to start agent run" }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, job: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== CHECK JOB STATUS =====
    if (action === "job-status") {
      const { endpointId, jobId, usePlatformKey = false } = body;
      if (!endpointId || !jobId) {
        return new Response(
          JSON.stringify({ error: "Endpoint ID and Job ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const runpodApiKey = getRunPodKey(usePlatformKey);
      if (!runpodApiKey) {
        return new Response(
          JSON.stringify({ error: "No RunPod API key available" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resp = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
        headers: { Authorization: `Bearer ${runpodApiKey}` },
      });

      const data = await resp.json();
      return new Response(
        JSON.stringify({ success: true, status: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Supported: validate-key, check-platform-key, deploy, run, job-status, check-usage" }),
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
