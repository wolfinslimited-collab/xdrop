import { useState } from 'react';
import { Check, ExternalLink, Key, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { GPU_TIERS, type RunPodConfig } from '@/types/agentBuilder';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RunPodPanelProps {
  config: RunPodConfig;
  onUpdate: (config: RunPodConfig) => void;
}

const SETUP_STEPS = [
  { step: 1, text: 'Go to RunPod.io and create an account', link: 'https://www.runpod.io/console/signup' },
  { step: 2, text: 'Navigate to Settings → API Keys', link: 'https://www.runpod.io/console/user/settings' },
  { step: 3, text: 'Click "Create API Key" and copy it' },
  { step: 4, text: 'Paste your API key below to connect' },
];

const RunPodPanel = ({ config, onUpdate }: RunPodPanelProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(!config.apiKeyConfigured);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'API key required', description: 'Please enter your RunPod API key.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      // Save API key via edge function that stores it securely
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

      onUpdate({ ...config, apiKeyConfigured: true });
      setShowSetup(false);
      toast({ title: 'RunPod connected', description: 'API key validated and saved.' });
    } catch (err: any) {
      toast({ title: 'Validation failed', description: err.message || 'Could not validate API key.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground">RunPod</h3>
          <a href="https://www.runpod.io" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">Serverless GPU infrastructure for your agent</p>
      </div>

      {/* API Key Setup */}
      {showSetup ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-foreground" />
              <p className="text-xs font-medium text-foreground">Connect your RunPod account</p>
            </div>
            <div className="space-y-2">
              {SETUP_STEPS.map(({ step, text, link }) => (
                <div key={step} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-muted text-[9px] flex items-center justify-center text-foreground flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                      {text}
                    </a>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

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
      ) : (
        <div className="p-2.5 rounded-lg border border-foreground/20 bg-muted/30 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
          <span className="text-xs text-foreground flex-1">RunPod API key connected</span>
          <button
            onClick={() => { setShowSetup(true); setApiKey(''); }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {/* Endpoint ID */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <label className="text-xs text-muted-foreground">Serverless Endpoint ID</label>
          <span className="text-[9px] text-muted-foreground/40">(optional)</span>
        </div>
        <input
          value={config.endpointId}
          onChange={(e) => onUpdate({ ...config, endpointId: e.target.value })}
          placeholder="e.g. abc123xyz"
          className="w-full bg-muted/50 rounded-md py-1.5 px-2.5 text-xs text-foreground font-mono border border-border focus:border-foreground/30 focus:outline-none"
        />
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          Leave empty to create a new endpoint, or paste an existing one to update it.
        </p>
      </div>

      {/* GPU Tier */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">GPU Tier</label>
        <div className="space-y-1.5">
          {GPU_TIERS.map(tier => (
            <button
              key={tier.id}
              onClick={() => onUpdate({ ...config, gpuTier: tier.id })}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                config.gpuTier === tier.id
                  ? 'border-foreground/30 bg-muted'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground">{tier.name}</p>
                  {tier.vram !== '—' && <span className="text-[9px] text-muted-foreground/60">{tier.vram}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground">{tier.description} · {tier.price}</p>
              </div>
              {config.gpuTier === tier.id && <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Scaling */}
      <div className="space-y-3">
        <label className="text-xs text-muted-foreground block">Scaling</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground/60 mb-1 block">Min Workers</label>
            <input
              type="number"
              value={config.minWorkers}
              onChange={(e) => onUpdate({ ...config, minWorkers: Math.max(0, parseInt(e.target.value) || 0) })}
              min={0}
              max={10}
              className="w-full bg-muted/50 rounded-md py-1.5 px-2.5 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground/60 mb-1 block">Max Workers</label>
            <input
              type="number"
              value={config.maxWorkers}
              onChange={(e) => onUpdate({ ...config, maxWorkers: Math.max(1, parseInt(e.target.value) || 1) })}
              min={1}
              max={100}
              className="w-full bg-muted/50 rounded-md py-1.5 px-2.5 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground/60 mb-1 block">Idle Timeout (s)</label>
            <input
              type="number"
              value={config.idleTimeout}
              onChange={(e) => onUpdate({ ...config, idleTimeout: Math.max(5, parseInt(e.target.value) || 60) })}
              min={5}
              className="w-full bg-muted/50 rounded-md py-1.5 px-2.5 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground/60 mb-1 block">Volume (GB)</label>
            <input
              type="number"
              value={config.volumeSize}
              onChange={(e) => onUpdate({ ...config, volumeSize: Math.max(5, parseInt(e.target.value) || 20) })}
              min={5}
              className="w-full bg-muted/50 rounded-md py-1.5 px-2.5 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-start gap-2">
        <Info className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Your OpenClaw agent will be packaged as a Docker container and deployed as a RunPod serverless endpoint. Workers scale to 0 when idle — you only pay for active compute.
        </p>
      </div>
    </div>
  );
};

export default RunPodPanel;
