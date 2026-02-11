import { useState } from 'react';
import { ExternalLink, Key, CheckCircle2, Loader2, Info } from 'lucide-react';
import { type RunPodConfig } from '@/types/agentBuilder';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RunPodPanelProps {
  config: RunPodConfig;
  onUpdate: (config: RunPodConfig) => void;
}

const SETUP_STEPS = [
  { step: 1, text: 'Go to RunPod.io and create an account', link: 'https://www.runpod.io/console/signup' },
  { step: 2, text: 'Create a Serverless Endpoint with your desired GPU, scaling & volume settings', link: 'https://www.runpod.io/console/serverless' },
  { step: 3, text: 'Copy your Endpoint ID from the endpoint dashboard' },
  { step: 4, text: 'Navigate to Settings → API Keys and create one', link: 'https://www.runpod.io/console/user/settings' },
  { step: 5, text: 'Paste both below to connect' },
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
    if (!config.endpointId.trim()) {
      toast({ title: 'Endpoint ID required', description: 'Please enter your RunPod Serverless Endpoint ID.', variant: 'destructive' });
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

      onUpdate({ ...config, apiKeyConfigured: true });
      setShowSetup(false);
      toast({ title: 'RunPod connected', description: 'API key validated and endpoint linked.' });
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
        <p className="text-xs text-muted-foreground">Connect your RunPod serverless endpoint</p>
      </div>

      {showSetup ? (
        <div className="space-y-3">
          {/* Setup guide */}
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

          {/* Endpoint ID */}
          <div>
            <label className="text-[10px] text-muted-foreground/60 mb-1 block">Serverless Endpoint ID</label>
            <input
              value={config.endpointId}
              onChange={(e) => onUpdate({ ...config, endpointId: e.target.value })}
              placeholder="e.g. abc123xyz"
              className="w-full bg-muted/50 rounded-md py-2 px-2.5 text-xs text-foreground font-mono border border-border focus:border-foreground/30 focus:outline-none"
            />
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              Find this in your <a href="https://www.runpod.io/console/serverless" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">RunPod Serverless dashboard</a>
            </p>
          </div>

          {/* API Key */}
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
            disabled={!apiKey.trim() || !config.endpointId.trim() || isSaving}
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
        <div className="space-y-3">
          <div className="p-2.5 rounded-lg border border-foreground/20 bg-muted/30 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
            <span className="text-xs text-foreground flex-1">RunPod connected</span>
            <button
              onClick={() => { setShowSetup(true); setApiKey(''); }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Change
            </button>
          </div>
          <div className="p-2.5 rounded-lg border border-border bg-muted/30">
            <p className="text-[10px] text-muted-foreground mb-1">Endpoint ID</p>
            <p className="text-xs text-foreground font-mono">{config.endpointId}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-start gap-2">
        <Info className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Create and configure your serverless endpoint (GPU, scaling, volume) directly on <a href="https://www.runpod.io/console/serverless" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">RunPod</a>. OpenClaw will deploy your agent container to that endpoint.
        </p>
      </div>
    </div>
  );
};

export default RunPodPanel;
