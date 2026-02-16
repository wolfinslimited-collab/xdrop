import { useState, useEffect } from "react";
import { Copy, Check, Apple, Smartphone, Terminal, ChevronDown, ChevronRight, AlertTriangle, Info, Play, Loader2, Download, Clock, CheckCircle2, XCircle, Github, ExternalLink, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Platform = "android" | "ios";
type BuildStatus = "pending" | "provisioning" | "building" | "uploading" | "completed" | "failed";

interface Build {
  id: string;
  platform: Platform;
  status: BuildStatus;
  github_run_id: number | null;
  artifact_url: string | null;
  build_log: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface BuildStep {
  title: string;
  command?: string;
  note?: string;
  warning?: string;
}

const PLATFORM_META: Record<Platform, { label: string; icon: typeof Smartphone; color: string; desc: string }> = {
  android: { label: "Android APK", icon: Smartphone, color: "text-green-400", desc: "GitHub Actions · ubuntu-latest" },
  ios: { label: "iOS TestFlight", icon: Apple, color: "text-gray-300", desc: "GitHub Actions · macos-latest" },
};

const STATUS_META: Record<BuildStatus, { label: string; color: string; spinning: boolean }> = {
  pending: { label: "Pending", color: "text-muted-foreground", spinning: false },
  provisioning: { label: "Queued", color: "text-yellow-400", spinning: true },
  building: { label: "Building", color: "text-blue-400", spinning: true },
  uploading: { label: "Uploading", color: "text-purple-400", spinning: true },
  completed: { label: "Completed", color: "text-green-400", spinning: false },
  failed: { label: "Failed", color: "text-red-400", spinning: false },
};

const MANUAL_STEPS: Record<Platform, BuildStep[]> = {
  android: [
    { title: "Pull latest code", command: "git pull origin main" },
    { title: "Install dependencies", command: "npm install" },
    { title: "Build web assets", command: "npm run build" },
    { title: "Sync Capacitor", command: "npx cap sync android" },
    { title: "Build release APK", command: "cd android && ./gradlew assembleRelease" },
    { title: "Build App Bundle (Play Store)", command: "cd android && ./gradlew bundleRelease", note: "For Google Play Store submission" },
  ],
  ios: [
    { title: "Pull latest code", command: "git pull origin main" },
    { title: "Install dependencies", command: "npm install" },
    { title: "Build web assets", command: "npm run build" },
    { title: "Sync Capacitor", command: "npx cap sync ios" },
    { title: "Install CocoaPods", command: "cd ios/App && pod install" },
    { title: "Archive & Upload to TestFlight", command: "cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive -archivePath build/xdrop.xcarchive", note: "Then use Xcode Organizer to upload to TestFlight" },
  ],
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copy}>
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </Button>
  );
}

function CommandBlock({ step }: { step: BuildStep }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{step.title}</span>
      </div>
      {step.command && (
        <div className="flex items-center gap-2 rounded-md bg-black/40 border border-border/50 px-3 py-2">
          <code className="text-xs text-green-400 flex-1 font-mono">{step.command}</code>
          <CopyButton text={step.command} />
        </div>
      )}
      {step.note && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 pl-5">
          <Info className="h-3 w-3" />
          {step.note}
        </p>
      )}
      {step.warning && (
        <p className="text-xs text-yellow-400 flex items-center gap-1.5 pl-5">
          <AlertTriangle className="h-3 w-3" />
          {step.warning}
        </p>
      )}
    </div>
  );
}

interface JobLog {
  name: string;
  status: string;
  conclusion: string | null;
  steps: Array<{ name: string; status: string; conclusion: string | null }>;
  failed_step_log?: string;
}

function BuildCard({ build, onRefresh }: { build: Build; onRefresh: () => void }) {
  const meta = PLATFORM_META[build.platform];
  const statusMeta = STATUS_META[build.status];
  const Icon = meta.icon;
  const [downloading, setDownloading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<JobLog[] | null>(null);
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [runUrl, setRunUrl] = useState<string | null>(null);

  const isActive = ["pending", "provisioning", "building", "uploading"].includes(build.status);

  async function handleDownload() {
    if (!build.artifact_url) return;
    setDownloading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-build`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "download-artifact", buildId: build.id }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(err.error || "Download failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xdrop-${build.platform}-${build.id.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }

  async function fetchLogs() {
    setLoadingLogs(true);
    setLogMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("github-build", {
        body: { action: "fetch-logs", buildId: build.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch logs");
      setLogs(data.jobs || []);
      if (data.message) setLogMessage(data.message);
      if (data.run_url) setRunUrl(data.run_url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch logs";
      toast.error(msg);
    } finally {
      setLoadingLogs(false);
    }
  }

  function toggleLogs() {
    const next = !showLogs;
    setShowLogs(next);
    if (next && !logs) fetchLogs();
  }

  useEffect(() => {
    if (!showLogs || !isActive) return;
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, [showLogs, isActive, build.id]);

  useEffect(() => {
    if (isActive && !showLogs) {
      setShowLogs(true);
      fetchLogs();
    }
  }, []);

  const stepIcon = (conclusion: string | null, status: string) => {
    if (status === "in_progress") return <Loader2 className="h-3 w-3 animate-spin text-blue-400" />;
    if (status === "queued") return <Clock className="h-3 w-3 text-muted-foreground" />;
    if (conclusion === "success") return <CheckCircle2 className="h-3 w-3 text-green-400" />;
    if (conclusion === "failure") return <XCircle className="h-3 w-3 text-red-400" />;
    if (conclusion === "skipped") return <span className="text-xs text-muted-foreground">—</span>;
    return <Clock className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 ${meta.color}`} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{meta.label}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusMeta.color}`}>
                  {statusMeta.spinning && <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />}
                  {!statusMeta.spinning && build.status === "completed" && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                  {!statusMeta.spinning && build.status === "failed" && <XCircle className="h-2.5 w-2.5 mr-1" />}
                  {statusMeta.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(build.created_at).toLocaleString()}
              </p>
              {build.error_message && (
                <p className="text-xs text-red-400 mt-1">{build.error_message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {runUrl && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(runUrl, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleLogs}>
              <FileText className="h-3.5 w-3.5" />
            </Button>
            {build.artifact_url && build.status === "completed" && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                {downloading ? "Getting..." : "Download"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {showLogs && (
        <div className="border-t border-border/50 bg-black/20 p-4">
          <Separator className="mb-3" />
          {loadingLogs && !logs ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Fetching build logs...
            </div>
          ) : logMessage && (!logs || logs.length === 0) ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {logMessage}
              </p>
              {isActive && <p className="text-xs text-muted-foreground">Auto-refreshing every 8s...</p>}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3">
              {isActive && (
                <p className="text-[10px] text-blue-400 flex items-center gap-1">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Live · refreshing every 8s
                </p>
              )}
              {logs.map((job, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {stepIcon(job.conclusion, job.status)}
                    <span>{job.name}</span>
                    {job.conclusion && (
                      <span className="text-xs text-muted-foreground">({job.conclusion})</span>
                    )}
                  </div>
                  <div className="pl-5 space-y-0.5">
                    {job.steps.map((step, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                        {stepIcon(step.conclusion, step.status)}
                        <span>{step.name}</span>
                      </div>
                    ))}
                  </div>
                  {job.failed_step_log && (
                    <div className="pl-5 mt-1">
                      <p className="text-xs font-medium text-red-400">Error Output:</p>
                      <pre className="text-[10px] text-red-300/80 bg-red-950/30 rounded p-2 mt-1 overflow-x-auto max-h-40">
                        {job.failed_step_log}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No log data available yet.</p>
          )}
          <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={fetchLogs} disabled={loadingLogs}>
            {loadingLogs ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Refresh Logs
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function BuildCenter() {
  const navigate = useNavigate();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState<Platform | null>(null);
  const [showManual, setShowManual] = useState<Platform | null>(null);

  useEffect(() => {
    loadBuilds();

    const channel = supabase
      .channel("builds-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "builds" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setBuilds((prev) => [payload.new as Build, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setBuilds((prev) =>
            prev.map((b) => (b.id === (payload.new as Build).id ? (payload.new as Build) : b))
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadBuilds() {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("builds")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setBuilds(data as Build[]);
    } finally {
      setLoading(false);
    }
  }

  async function triggerBuild(platform: Platform) {
    setTriggering(platform);
    try {
      const { data, error } = await supabase.functions.invoke("github-build", {
        body: { action: "trigger", platform },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to trigger build");
      toast.success(`${PLATFORM_META[platform].label} build triggered!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger build";
      toast.error(msg);
    } finally {
      setTriggering(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">xDrop Build Center</h1>
            <p className="text-sm text-muted-foreground">
              Build & deploy via GitHub Actions · iOS TestFlight + Android APK
            </p>
          </div>
        </div>

        <Separator />

        {/* Build Triggers */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="h-4 w-4" />
              Cloud Builds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {(["ios", "android"] as Platform[]).map((p) => {
                const meta = PLATFORM_META[p];
                const PlatformIcon = meta.icon;
                const isTriggering = triggering === p;

                return (
                  <Button
                    key={p}
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1 border-border/50"
                    onClick={() => triggerBuild(p)}
                    disabled={isTriggering}
                  >
                    <div className="flex items-center gap-2">
                      {isTriggering ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PlatformIcon className={`h-4 w-4 ${meta.color}`} />
                      )}
                      <span className="text-sm font-medium">
                        {isTriggering ? "Triggering..." : `Build ${meta.label}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{meta.desc}</span>
                  </Button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              Builds run on GitHub Actions. iOS uses macos-latest with TestFlight upload. Artifacts available for 30 days.
            </p>
          </CardContent>
        </Card>

        {/* Build History */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Build History
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={loadBuilds} disabled={loading}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {builds.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No builds yet. Trigger one above!
              </p>
            ) : (
              <div className="space-y-3">
                {builds.map((b) => (
                  <BuildCard key={b.id} build={b} onRefresh={loadBuilds} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Manual Commands */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Manual Build Commands</h2>
          <div className="space-y-2">
            {(["ios", "android"] as Platform[]).map((p) => {
              const meta = PLATFORM_META[p];
              const PlatformIcon = meta.icon;
              const isOpen = showManual === p;
              return (
                <div key={p}>
                  <Button variant="ghost" className="w-full justify-between h-10" onClick={() => setShowManual(isOpen ? null : p)}>
                    <div className="flex items-center gap-2">
                      <PlatformIcon className={`h-4 w-4 ${meta.color}`} />
                      <span className="text-sm">{meta.label}</span>
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  {isOpen && (
                    <div className="pl-4 pr-2 py-3 space-y-4">
                      {MANUAL_STEPS[p].map((step, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <CommandBlock step={step} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
