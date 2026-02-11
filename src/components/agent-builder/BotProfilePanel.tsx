import { useState } from 'react';
import { Heart, Zap, Clock, DollarSign, Activity, Shield, Cpu, Palette, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BotCharacter3D, { DEFAULT_APPEARANCE, type BotAppearance, type BotTier } from './BotCharacter3D';
import type { AgentConfig } from '@/types/agentBuilder';
import { AI_MODEL, GPU_TIERS } from '@/types/agentBuilder';

interface BotProfilePanelProps {
  config: AgentConfig;
}

const TIER_INFO: { id: BotTier; name: string; label: string; description: string }[] = [
  { id: 'clawd', name: 'Clawd', label: 'Starter', description: 'Small & cute — perfect for simple tasks' },
  { id: 'moltbot', name: 'Moltbot', label: 'Advanced', description: 'Armored warrior — multi-skill agents' },
  { id: 'openclaw', name: 'OpenClaw', label: 'Elite', description: 'Maximum power — full deployment beast' },
];

const BODY_COLORS = [
  { color: '#8B3A3A', name: 'Terracotta' },
  { color: '#1a1a2e', name: 'Midnight' },
  { color: '#2d4a3e', name: 'Forest' },
  { color: '#3a2d6b', name: 'Violet' },
  { color: '#4a3728', name: 'Bronze' },
  { color: '#2a3a5c', name: 'Navy' },
  { color: '#5c2a2a', name: 'Crimson' },
  { color: '#3d3d3d', name: 'Gunmetal' },
];

const EYE_COLORS = [
  { color: '#00ffcc', name: 'Teal' },
  { color: '#ff4444', name: 'Red' },
  { color: '#ffaa00', name: 'Amber' },
  { color: '#4488ff', name: 'Blue' },
  { color: '#ff44ff', name: 'Pink' },
  { color: '#44ff44', name: 'Green' },
  { color: '#ffffff', name: 'White' },
  { color: '#ffff44', name: 'Yellow' },
];

const ACCENT_COLORS = [
  { color: '#00d4aa', name: 'Mint' },
  { color: '#ff4444', name: 'Red' },
  { color: '#4488ff', name: 'Blue' },
  { color: '#ffaa00', name: 'Gold' },
  { color: '#ff44ff', name: 'Magenta' },
  { color: '#44ff44', name: 'Lime' },
  { color: '#ff8844', name: 'Orange' },
  { color: '#aa44ff', name: 'Purple' },
];

const BotProfilePanel = ({ config }: BotProfilePanelProps) => {
  const [appearance, setAppearance] = useState<BotAppearance>(DEFAULT_APPEARANCE);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const enabledSkills = config.skills.filter(s => s.enabled).length;
  const connectedIntegrations = config.integrations.filter(i => i.connected).length;
  const gpu = GPU_TIERS.find(g => g.id === config.runpodConfig.gpuTier);

  const healthFactors = [
    (config.name || '').trim().length > 0,
    enabledSkills > 0,
    connectedIntegrations > 0,
    config.runpodConfig?.apiKeyConfigured ?? false,
    (config.runpodConfig?.endpointId || '').length > 0,
    config.guardrails?.requireApproval ?? false,
    config.triggers?.some(t => t.enabled) ?? false,
    (config.description || '').trim().length > 0,
  ];
  const health = Math.round((healthFactors.filter(Boolean).length / healthFactors.length) * 100);
  const ageDays = 0;

  const statItems = [
    { icon: <Heart className="w-3.5 h-3.5" />, label: 'Health', value: `${health}%`, color: health > 70 ? 'text-emerald-400' : health > 40 ? 'text-amber-400' : 'text-red-400' },
    { icon: <Clock className="w-3.5 h-3.5" />, label: 'Age', value: ageDays === 0 ? 'Newborn' : `${ageDays}d`, color: 'text-muted-foreground' },
    { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Earned', value: '$0.00', color: 'text-muted-foreground' },
    { icon: <Zap className="w-3.5 h-3.5" />, label: 'Runs', value: '0', color: 'text-muted-foreground' },
    { icon: <Activity className="w-3.5 h-3.5" />, label: 'Skills', value: `${enabledSkills}`, color: enabledSkills > 0 ? 'text-foreground' : 'text-muted-foreground' },
    { icon: <Shield className="w-3.5 h-3.5" />, label: 'Safety', value: config.guardrails?.requireApproval ? 'On' : 'Off', color: config.guardrails?.requireApproval ? 'text-emerald-400' : 'text-amber-400' },
  ];

  const currentTier = TIER_INFO.find(t => t.id === appearance.tier)!;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Bot Profile</h3>
        <p className="text-xs text-muted-foreground">Your agent's identity & vitals</p>
      </div>

      {/* 3D Character */}
      <BotCharacter3D appearance={appearance} />

      {/* Customization toggle */}
      <button
        onClick={() => setCustomizeOpen(!customizeOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Customize Appearance</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${customizeOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {customizeOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-1">
              {/* Evolution Tier */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Evolution Tier</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIER_INFO.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => setAppearance(prev => ({ ...prev, tier: tier.id }))}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        appearance.tier === tier.id
                          ? 'border-primary/60 bg-primary/10'
                          : 'border-border bg-muted/30 hover:bg-muted/60'
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-foreground">{tier.name}</p>
                      <p className="text-[8px] text-muted-foreground">{tier.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/70 italic">{currentTier.description}</p>
              </div>

              {/* Body Color */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Body Color</p>
                <div className="flex flex-wrap gap-2">
                  {BODY_COLORS.map(c => (
                    <button
                      key={c.color}
                      onClick={() => setAppearance(prev => ({ ...prev, bodyColor: c.color }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        appearance.bodyColor === c.color ? 'border-foreground scale-110' : 'border-transparent hover:border-muted-foreground/50'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Eye Color */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Eye Color</p>
                <div className="flex flex-wrap gap-2">
                  {EYE_COLORS.map(c => (
                    <button
                      key={c.color}
                      onClick={() => setAppearance(prev => ({ ...prev, eyeColor: c.color }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        appearance.eyeColor === c.color ? 'border-foreground scale-110' : 'border-transparent hover:border-muted-foreground/50'
                      }`}
                      style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}40` }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Accent / Glow Color */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Accent Glow</p>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.color}
                      onClick={() => setAppearance(prev => ({ ...prev, accentColor: c.color }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        appearance.accentColor === c.color ? 'border-foreground scale-110' : 'border-transparent hover:border-muted-foreground/50'
                      }`}
                      style={{ backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}40` }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name & identity card */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center space-y-1.5">
        <p className="text-sm font-bold text-foreground">{config.name || 'Unnamed Agent'}</p>
        {config.description && (
          <p className="text-[10px] text-muted-foreground italic">"{config.description}"</p>
        )}
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] text-muted-foreground flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5" /> {AI_MODEL.name}
          </span>
          {gpu && (
            <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] text-muted-foreground">
              {gpu.name}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] text-muted-foreground">
            {currentTier.name}
          </span>
        </div>
      </div>

      {/* Health bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Config Health</span>
          <span className={health > 70 ? 'text-emerald-400' : health > 40 ? 'text-amber-400' : 'text-red-400'}>{health}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              health > 70 ? 'bg-emerald-500' : health > 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {statItems.map(stat => (
          <div key={stat.label} className="p-2.5 rounded-lg bg-muted/30 border border-border text-center">
            <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
            <p className={`text-xs font-semibold ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Resource Costs */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resource Costs</p>
        <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">GPU Tier</span>
            <span className="text-foreground font-medium">{gpu?.name || 'CPU Only'} — {gpu?.price || '$0.003/sec'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">VRAM</span>
            <span className="text-foreground font-medium">{gpu?.vram || '—'}</span>
          </div>
          <div className="h-px bg-border/50" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Est. per run</span>
            <span className="text-foreground font-medium">
              ~${config.runpodConfig?.gpuTier === 'cpu' ? '0.002' : config.runpodConfig?.gpuTier === 'a40' ? '0.02' : config.runpodConfig?.gpuTier === 'a100' ? '0.05' : '0.15'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Daily ({config.triggers?.[0]?.type === 'cron' ? 'cron' : 'manual'})</span>
            <span className="text-foreground font-medium">
              ~${config.triggers?.[0]?.type === 'cron'
                ? (config.runpodConfig?.gpuTier === 'cpu' ? '0.58' : config.runpodConfig?.gpuTier === 'a40' ? '5.76' : config.runpodConfig?.gpuTier === 'a100' ? '14.40' : '43.20')
                : '0.00'}
              /day
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Workers</span>
            <span className="text-foreground font-medium">{config.runpodConfig?.minWorkers ?? 0} min / {config.runpodConfig?.maxWorkers ?? 3} max</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Idle timeout</span>
            <span className="text-foreground font-medium">{config.runpodConfig?.idleTimeout ?? 60}s</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Volume</span>
            <span className="text-foreground font-medium">{config.runpodConfig?.volumeSize ?? 20} GB</span>
          </div>
        </div>
      </div>

      {/* Equipped skills */}
      {enabledSkills > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Equipped Skills</p>
          <div className="flex flex-wrap gap-1">
            {config.skills.filter(s => s.enabled).map(s => (
              <span key={s.id} className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-foreground border border-border">
                {s.icon} {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BotProfilePanel;