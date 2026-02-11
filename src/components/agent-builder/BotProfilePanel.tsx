import { Heart, Zap, Clock, DollarSign, Activity, Shield, Cpu } from 'lucide-react';
import BotCharacter3D from './BotCharacter3D';
import type { AgentConfig } from '@/types/agentBuilder';
import { AI_MODEL, GPU_TIERS } from '@/types/agentBuilder';

interface BotProfilePanelProps {
  config: AgentConfig;
}

const BotProfilePanel = ({ config }: BotProfilePanelProps) => {
  const enabledSkills = config.skills.filter(s => s.enabled).length;
  const connectedIntegrations = config.integrations.filter(i => i.connected).length;
  const gpu = GPU_TIERS.find(g => g.id === config.runpodConfig.gpuTier);

  // Derive "health" from config completeness
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

  // Age: days since "creation" (session start, mocked as today)
  const ageDays = 0;

  const statItems = [
    { icon: <Heart className="w-3.5 h-3.5" />, label: 'Health', value: `${health}%`, color: health > 70 ? 'text-emerald-400' : health > 40 ? 'text-amber-400' : 'text-red-400' },
    { icon: <Clock className="w-3.5 h-3.5" />, label: 'Age', value: ageDays === 0 ? 'Newborn' : `${ageDays}d`, color: 'text-muted-foreground' },
    { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Earned', value: '$0.00', color: 'text-muted-foreground' },
    { icon: <Zap className="w-3.5 h-3.5" />, label: 'Runs', value: '0', color: 'text-muted-foreground' },
    { icon: <Activity className="w-3.5 h-3.5" />, label: 'Skills', value: `${enabledSkills}`, color: enabledSkills > 0 ? 'text-foreground' : 'text-muted-foreground' },
    { icon: <Shield className="w-3.5 h-3.5" />, label: 'Safety', value: config.guardrails?.requireApproval ? 'On' : 'Off', color: config.guardrails?.requireApproval ? 'text-emerald-400' : 'text-amber-400' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Bot Profile</h3>
        <p className="text-xs text-muted-foreground">Your agent's identity & vitals</p>
      </div>

      {/* 3D Character */}
      <BotCharacter3D />

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
