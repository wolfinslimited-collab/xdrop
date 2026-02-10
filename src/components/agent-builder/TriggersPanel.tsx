import { Clock, Webhook, Zap, Hand } from 'lucide-react';
import type { AgentTrigger } from '@/types/agentBuilder';

interface TriggersPanelProps {
  triggers: AgentTrigger[];
  onUpdate: (triggers: AgentTrigger[]) => void;
}

const TRIGGER_OPTIONS: { type: AgentTrigger['type']; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'manual', label: 'Manual', icon: <Hand className="w-4 h-4" />, desc: 'Trigger runs on demand' },
  { type: 'cron', label: 'Schedule', icon: <Clock className="w-4 h-4" />, desc: 'Run on a recurring schedule' },
  { type: 'webhook', label: 'Webhook', icon: <Webhook className="w-4 h-4" />, desc: 'Trigger via HTTP endpoint' },
  { type: 'event', label: 'Event', icon: <Zap className="w-4 h-4" />, desc: 'React to platform events' },
];

const CRON_PRESETS = [
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day 9am', value: '0 9 * * *' },
  { label: 'Every Monday', value: '0 9 * * 1' },
];

const TriggersPanel = ({ triggers, onUpdate }: TriggersPanelProps) => {
  const activeTrigger = triggers[0] || { type: 'manual', enabled: true };

  const setType = (type: AgentTrigger['type']) => {
    onUpdate([{ ...activeTrigger, type, enabled: true }]);
  };

  const setCron = (cronExpression: string) => {
    onUpdate([{ ...activeTrigger, type: 'cron', cronExpression, enabled: true }]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Triggers</h3>
        <p className="text-xs text-muted-foreground">When should your agent run?</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TRIGGER_OPTIONS.map(opt => (
          <button
            key={opt.type}
            onClick={() => setType(opt.type)}
            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
              activeTrigger.type === opt.type
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-secondary/50 hover:bg-secondary'
            }`}
          >
            <div className={activeTrigger.type === opt.type ? 'text-primary' : 'text-muted-foreground'}>
              {opt.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {activeTrigger.type === 'cron' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick presets</p>
          <div className="flex flex-wrap gap-1.5">
            {CRON_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => setCron(p.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                  activeTrigger.cronExpression === p.value
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            value={activeTrigger.cronExpression || ''}
            onChange={(e) => setCron(e.target.value)}
            placeholder="Custom: */5 * * * *"
            className="w-full bg-secondary rounded-lg py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {activeTrigger.type === 'webhook' && (
        <div className="p-3 rounded-xl bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground">Webhook URL will be generated after deployment.</p>
        </div>
      )}

      {activeTrigger.type === 'event' && (
        <input
          value={activeTrigger.eventName || ''}
          onChange={(e) => onUpdate([{ ...activeTrigger, eventName: e.target.value, enabled: true }])}
          placeholder="Event name (e.g., new_order, price_alert)"
          className="w-full bg-secondary rounded-lg py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none"
        />
      )}
    </div>
  );
};

export default TriggersPanel;
