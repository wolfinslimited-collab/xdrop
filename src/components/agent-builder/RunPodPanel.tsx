import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Key, CheckCircle2, Loader2, Info, Cpu, Zap, CreditCard, Calculator } from 'lucide-react';
import { type RunPodConfig } from '@/types/agentBuilder';
import { GPU_TIERS } from '@/types/agentBuilder';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RunPodPanelProps {
  config: RunPodConfig;
  onUpdate: (config: RunPodConfig) => void;
}

const HOURLY_RATES: Record<string, number> = {
  a4000: 0.12,
  a40: 0.39,
  a100: 1.09,
  h100: 3.49,
};

const CostCalculator = ({ gpuTier, isUsingPlatform }: { gpuTier: string; isUsingPlatform: boolean }) => {
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [runsPerDay, setRunsPerDay] = useState(10);

  const costs = useMemo(() => {
    const hourlyRate = HOURLY_RATES[gpuTier] || 0;
    const monthlyGpu = hourlyRate * hoursPerDay * 30;
    const monthlyCreditsCompute = isUsingPlatform ? hoursPerDay * 60 * 2 * 30 : 0;
    const monthlyCreditsRuns = runsPerDay * 5 * 30;
    const totalCredits = monthlyCreditsCompute + monthlyCreditsRuns;
    return { monthlyGpu, monthlyCreditsCompute, monthlyCreditsRuns, totalCredits };
  }, [gpuTier, hoursPerDay, runsPerDay, isUsingPlatform]);

  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
      <div className="flex items-center gap-2">
        <Calculator className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Cost Calculator</span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Hours active / day</span>
            <span className="text-foreground font-medium">{hoursPerDay}h</span>
          </div>
          <Slider value={[hoursPerDay]} onValueChange={([v]) => setHoursPerDay(v)} min={1} max={24} step={1} className="w-full" />
        </div>

        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Runs / day</span>
            <span className="text-foreground font-medium">{runsPerDay}</span>
          </div>
          <Slider value={[runsPerDay]} onValueChange={([v]) => setRunsPerDay(v)} min={1} max={100} step={1} className="w-full" />
        </div>
      </div>

      <div className="border-t border-border pt-2 space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">GPU compute</span>
          <span className="text-foreground">${costs.monthlyGpu.toFixed(2)}/mo</span>
        </div>
        {isUsingPlatform && (
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Compute credits</span>
            <span className="text-foreground">{costs.monthlyCreditsCompute.toLocaleString()} credits/mo</span>
          </div>
        )}
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Run credits ({runsPerDay}/day × 5)</span>
          <span className="text-foreground">{costs.monthlyCreditsRuns.toLocaleString()} credits/mo</span>
        </div>
        <div className="flex justify-between text-[10px] font-semibold pt-1 border-t border-border">
          <span className="text-foreground">Total credits</span>
          <span className="text-primary">{costs.totalCredits.toLocaleString()}/mo</span>
        </div>
      </div>
    </div>
  );
};
const RunPodPanel = ({ config, onUpdate }: RunPodPanelProps) => {

  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [platformKeyAvailable, setPlatformKeyAvailable] = useState(false);
  const [checkingPlatform, setCheckingPlatform] = useState(true);

  // Check if platform key is available
  useEffect(() => {
    const check = async () => {
      try {
        const session = await supabase.auth.getSession();
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-to-runpod`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({ action: 'check-platform-key' }),
        });
        const data = await resp.json();
        setPlatformKeyAvailable(data.available === true);
      } catch { /* ignore */ }
      setCheckingPlatform(false);
    };
    check();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'API key required', description: 'Please enter your RunPod API key.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-to-runpod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ action: 'validate-key', apiKey: apiKey.trim() }),
      });

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Failed to validate API key');

      onUpdate({ ...config, apiKeyConfigured: true, usePlatformKey: false });
      toast({ title: 'RunPod connected', description: `API key validated (${result.email}).` });
    } catch (err: any) {
      toast({ title: 'Validation failed', description: err.message || 'Could not validate API key.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsePlatformKey = () => {
    onUpdate({ ...config, apiKeyConfigured: true, usePlatformKey: true });
    toast({ title: 'Using platform credits', description: 'RunPod compute will be billed via your XDROP credits.' });
  };

  const handleSwitchToOwn = () => {
    onUpdate({ ...config, apiKeyConfigured: false, usePlatformKey: false });
    setApiKey('');
  };

  const isUsingPlatform = config.apiKeyConfigured && config.usePlatformKey;
  const isUsingOwn = config.apiKeyConfigured && !config.usePlatformKey;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground">RunPod Deployment</h3>
          <a href="https://www.runpod.io" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">Deploy your OpenClaw agent to RunPod serverless</p>
      </div>

      {/* Connection Mode Selection */}
      {!config.apiKeyConfigured ? (
        <div className="space-y-3">
          {/* Platform Credits Option */}
          {!checkingPlatform && platformKeyAvailable && (
            <button
              onClick={handleUsePlatformKey}
              className="w-full p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Use Platform Credits</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Recommended</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No RunPod account needed. Compute is billed via your XDROP credits at 2 credits/min.
              </p>
            </button>
          )}

          {/* BYO Key Option */}
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-foreground" />
              <p className="text-xs font-semibold text-foreground">Use Your Own RunPod Account</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Connect your own RunPod account for direct billing. 
              <a href="https://www.runpod.io/console/signup" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground ml-1">
                Create account →
              </a>
            </p>

            <div>
              <label className="text-[10px] text-muted-foreground/60 mb-1 block">RunPod API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="rpa_XXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full bg-muted/50 rounded-md py-2 px-2.5 text-xs text-foreground font-mono border border-border focus:border-foreground/30 focus:outline-none"
              />
            </div>

            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim() || isSaving}
              className="w-full gap-2"
              size="sm"
            >
              {isSaving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Validating...</>
              ) : (
                <><Key className="w-3.5 h-3.5" /> Connect RunPod</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Connected state */}
          <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
            isUsingPlatform ? 'border-primary/30 bg-primary/5' : 'border-foreground/20 bg-muted/30'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs text-foreground flex-1">
              {isUsingPlatform ? 'Using platform credits (2 credits/min)' : 'RunPod connected (own account)'}
            </span>
            <button
              onClick={handleSwitchToOwn}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Change
            </button>
          </div>

          {/* Endpoint ID (only for BYO key) */}
          {isUsingOwn && (
            <div>
              <label className="text-[10px] text-muted-foreground/60 mb-1 block">Endpoint ID (optional)</label>
              <input
                value={config.endpointId}
                onChange={(e) => onUpdate({ ...config, endpointId: e.target.value })}
                placeholder="Leave blank to create new endpoint"
                className="w-full bg-muted/50 rounded-md py-2 px-2.5 text-xs text-foreground font-mono border border-border focus:border-foreground/30 focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                Optional — leave blank and we'll create one on deploy.
              </p>
            </div>
          )}
        </div>
      )}

      {/* GPU Tier Selection */}
      <div>
        <label className="text-[10px] text-muted-foreground/60 mb-1.5 block">GPU Tier</label>
        <div className="grid grid-cols-2 gap-1.5">
          {GPU_TIERS.map(tier => (
            <button
              key={tier.id}
              onClick={() => onUpdate({ ...config, gpuTier: tier.id })}
              className={`p-2 rounded-lg border text-left transition-all ${
                config.gpuTier === tier.id
                  ? 'border-foreground/30 bg-muted/60'
                  : 'border-border bg-muted/20 hover:border-border/80'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Cpu className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-foreground">{tier.name}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">{tier.price} · {tier.vram}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Scaling */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground/60 mb-1 block">Min Workers</label>
          <input
            type="number"
            min={0}
            max={10}
            value={config.minWorkers}
            onChange={(e) => onUpdate({ ...config, minWorkers: parseInt(e.target.value) || 0 })}
            className="w-full bg-muted/50 rounded-md py-2 px-2.5 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground/60 mb-1 block">Max Workers</label>
          <input
            type="number"
            min={1}
            max={50}
            value={config.maxWorkers}
            onChange={(e) => onUpdate({ ...config, maxWorkers: parseInt(e.target.value) || 3 })}
            className="w-full bg-muted/50 rounded-md py-2 px-2.5 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground/60 mb-1 block">Idle Timeout (seconds)</label>
        <input
          type="number"
          min={5}
          max={3600}
          value={config.idleTimeout}
          onChange={(e) => onUpdate({ ...config, idleTimeout: parseInt(e.target.value) || 60 })}
          className="w-full bg-muted/50 rounded-md py-2 px-2.5 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
        />
      </div>

      {/* Cost Calculator */}
      <CostCalculator gpuTier={config.gpuTier} isUsingPlatform={isUsingPlatform} />
      {/* Docker Image */}
      <div>
        <label className="text-[10px] text-muted-foreground/60 mb-1 block">Docker Image</label>
        <input
          value={config.dockerImage || 'runpod/serverless-hello-world:latest'}
          onChange={(e) => onUpdate({ ...config, dockerImage: e.target.value })}
          placeholder="runpod/serverless-hello-world:latest"
          className="w-full bg-muted/50 rounded-md py-2 px-2.5 text-xs text-foreground font-mono border border-border focus:border-foreground/30 focus:outline-none"
        />
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Default: <code className="font-mono">runpod/serverless-hello-world:latest</code> — use any public Docker Hub image.
        </p>
      </div>

      {/* Info */}
      <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-start gap-2">
        <Info className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Your agent is deployed as a Docker container on RunPod serverless infrastructure. Skills and integrations are passed as environment config.
        </p>
      </div>
    </div>
  );
};

export default RunPodPanel;
