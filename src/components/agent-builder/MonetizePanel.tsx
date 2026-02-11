import { DollarSign, Tag, TrendingUp, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AgentConfig } from '@/types/agentBuilder';

interface MonetizePanelProps {
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
}

const PRICING_MODELS = [
  { id: 'free', label: 'Free', desc: 'Open access, no charges', icon: '🆓' },
  { id: 'per-run', label: 'Per Run', desc: 'Charge per execution', icon: '⚡' },
  { id: 'subscription', label: 'Subscription', desc: 'Monthly recurring fee', icon: '🔄' },
  { id: 'freemium', label: 'Freemium', desc: 'Free tier + paid upgrades', icon: '🎁' },
];

const MonetizePanel = ({ config, onConfigChange }: MonetizePanelProps) => {
  const price = (config as any).price ?? 0;
  const subscriptionPrice = (config as any).subscriptionPrice ?? 0;
  const pricingModel = (config as any).pricingModel ?? 'free';

  const updateField = (field: string, value: any) => {
    onConfigChange({ ...config, [field]: value } as any);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Monetize</h3>
        <p className="text-xs text-muted-foreground">Set pricing and earn from your agent</p>
      </div>

      {/* Pricing Model */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Pricing Model</label>
        <div className="grid grid-cols-2 gap-2">
          {PRICING_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => updateField('pricingModel', model.id)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                pricingModel === model.id
                  ? 'border-foreground/30 bg-muted/80'
                  : 'border-border hover:border-foreground/20 bg-muted/30'
              }`}
            >
              <span className="text-sm">{model.icon}</span>
              <p className="text-[11px] font-medium text-foreground mt-1">{model.label}</p>
              <p className="text-[9px] text-muted-foreground">{model.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Price inputs */}
      {(pricingModel === 'per-run' || pricingModel === 'freemium') && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Price per run (USDC)</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
              className="w-full bg-muted/50 rounded-lg py-2 pl-8 pr-3 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
            />
          </div>
        </div>
      )}

      {(pricingModel === 'subscription' || pricingModel === 'freemium') && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Monthly subscription (USDC)</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="number"
              min={0}
              step={1}
              value={subscriptionPrice}
              onChange={(e) => updateField('subscriptionPrice', parseFloat(e.target.value) || 0)}
              className="w-full bg-muted/50 rounded-lg py-2 pl-8 pr-3 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Revenue Estimate */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Estimated Revenue</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Zap className="w-3 h-3" />
              <span className="text-[9px]">Per Run</span>
            </div>
            <p className="text-sm font-semibold text-foreground">${price.toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[9px]">Monthly (est.)</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              ${pricingModel === 'subscription' ? subscriptionPrice.toFixed(2) : (price * config.guardrails.maxRunsPerDay * 30).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Marketplace listing toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-foreground">List on Marketplace</p>
            <p className="text-[9px] text-muted-foreground">Make discoverable to other users</p>
          </div>
        </div>
        <button
          onClick={() => updateField('listOnMarketplace', !(config as any).listOnMarketplace)}
          className={`w-9 h-5 rounded-full transition-colors ${(config as any).listOnMarketplace ? 'bg-foreground' : 'bg-muted'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-background transition-transform ${(config as any).listOnMarketplace ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  );
};

export default MonetizePanel;
