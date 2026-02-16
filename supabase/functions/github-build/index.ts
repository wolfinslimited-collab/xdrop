import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!;
const GITHUB_REPO = Deno.env.get("GITHUB_REPO")!; // format: owner/repo

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const body = await req.json();
    const { action } = body;

    if (action === "trigger") {
      return await handleTrigger(supabase, user.id, body.platform);
    } else if (action === "fetch-logs") {
      return await handleFetchLogs(supabase, body.buildId);
    } else if (action === "download-artifact") {
      return await handleDownloadArtifact(supabase, body.buildId);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    console.error("github-build error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleTrigger(supabase: any, userId: string, platform: string) {
  if (!["android", "ios"].includes(platform)) throw new Error("Invalid platform");

  // Create build record
  const { data: build, error } = await supabase
    .from("builds")
    .insert({ user_id: userId, platform, status: "pending" })
    .select()
    .single();
  if (error) throw new Error(`DB error: ${error.message}`);

  // Trigger GitHub Actions workflow
  const workflowFile = platform === "android" ? "build-android.yml" : "build-ios.yml";
  const ghRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflowFile}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { build_id: build.id },
      }),
    }
  );

  if (!ghRes.ok) {
    const errText = await ghRes.text();
    await supabase.from("builds").update({ status: "failed", error_message: `GitHub API error: ${errText}` }).eq("id", build.id);
    throw new Error(`GitHub API error: ${ghRes.status} ${errText}`);
  }

  // Update status to provisioning
  await supabase.from("builds").update({ status: "provisioning" }).eq("id", build.id);

  return new Response(JSON.stringify({ success: true, buildId: build.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleFetchLogs(supabase: any, buildId: string) {
  const { data: build } = await supabase.from("builds").select("*").eq("id", buildId).single();
  if (!build) throw new Error("Build not found");

  // Find the GitHub run if we don't have it yet
  let runId = build.github_run_id;
  if (!runId) {
    // Search recent runs for this build_id
    const runsRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=10&event=workflow_dispatch`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (runsRes.ok) {
      const runsData = await runsRes.json();
      // Try to match by timing - find runs created around the same time as our build
      const buildTime = new Date(build.created_at).getTime();
      for (const run of runsData.workflow_runs || []) {
        const runTime = new Date(run.created_at).getTime();
        const workflowName = build.platform === "android" ? "Build Android APK" : "Build iOS TestFlight";
        if (Math.abs(runTime - buildTime) < 120000 && run.name === workflowName) {
          runId = run.id;
          await supabase.from("builds").update({ github_run_id: runId }).eq("id", buildId);
          break;
        }
      }
    }
  }

  if (!runId) {
    return new Response(JSON.stringify({
      success: true,
      jobs: [],
      message: "Waiting for GitHub Actions to pick up the build...",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Fetch jobs for this run
  const jobsRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${runId}/jobs`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
  );

  if (!jobsRes.ok) throw new Error("Failed to fetch jobs from GitHub");

  const jobsData = await jobsRes.json();
  const jobs = (jobsData.jobs || []).map((job: any) => ({
    name: job.name,
    status: job.status,
    conclusion: job.conclusion,
    steps: (job.steps || []).map((s: any) => ({
      name: s.name,
      status: s.status,
      conclusion: s.conclusion,
    })),
  }));

  // Update build status based on GitHub run status
  const runRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${runId}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (runRes.ok) {
    const runData = await runRes.json();
    let newStatus = build.status;
    if (runData.status === "queued") newStatus = "provisioning";
    else if (runData.status === "in_progress") newStatus = "building";
    else if (runData.status === "completed") {
      newStatus = runData.conclusion === "success" ? "completed" : "failed";
    }

    const updateData: any = { status: newStatus };
    if (newStatus === "completed" || newStatus === "failed") {
      updateData.completed_at = new Date().toISOString();
    }
    if (newStatus === "failed" && runData.conclusion === "failure") {
      updateData.error_message = "Build failed. Check logs for details.";
    }

    // Check for artifacts if completed
    if (newStatus === "completed") {
      const artifactsRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${runId}/artifacts`,
        { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
      );
      if (artifactsRes.ok) {
        const artifactsData = await artifactsRes.json();
        if (artifactsData.artifacts?.length > 0) {
          updateData.artifact_url = artifactsData.artifacts[0].archive_download_url;
        }
      }
    }

    await supabase.from("builds").update(updateData).eq("id", buildId);
  }

  const run_url = `https://github.com/${GITHUB_REPO}/actions/runs/${runId}`;

  return new Response(JSON.stringify({ success: true, jobs, run_url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleDownloadArtifact(supabase: any, buildId: string) {
  const { data: build } = await supabase.from("builds").select("*").eq("id", buildId).single();
  if (!build || !build.artifact_url) throw new Error("No artifact available");

  const res = await fetch(build.artifact_url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    redirect: "follow",
  });

  if (!res.ok) throw new Error("Failed to download artifact from GitHub");

  const blob = await res.blob();
  return new Response(blob, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="xdrop-${build.platform}-${buildId.slice(0, 8)}.zip"`,
    },
  });
}
