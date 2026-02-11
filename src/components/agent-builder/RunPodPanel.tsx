import { Check, ExternalLink } from 'lucide-react';
import { GPU_TIERS, type RunPodConfig } from '@/types/agentBuilder';

interface RunPodPanelProps {
  config: RunPodConfig;
  onUpdate: (config: RunPodConfig) => void;
}

const RunPodPanel = ({ config, onUpdate }: RunPodPanelProps) => {
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
      <div className="p-2.5 rounded-lg border border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Your OpenClaw agent will be packaged as a Docker container and deployed as a RunPod serverless endpoint. Workers scale to 0 when idle — you only pay for active compute.
        </p>
      </div>
    </div>
  );
};

export default RunPodPanel;
