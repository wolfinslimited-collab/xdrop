import { Shield } from 'lucide-react';
import type { AgentConfig } from '@/types/agentBuilder';

interface GuardrailsPanelProps {
  guardrails: AgentConfig['guardrails'];
  onUpdate: (guardrails: AgentConfig['guardrails']) => void;
}

const GuardrailsPanel = ({ guardrails, onUpdate }: GuardrailsPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Guardrails</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Max spend per run ($)</label>
          <input
            type="number"
            value={guardrails.maxSpendPerRun}
            onChange={(e) => onUpdate({ ...guardrails, maxSpendPerRun: Number(e.target.value) })}
            className="w-full bg-secondary rounded-lg py-2 px-3 text-xs text-foreground border border-border focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Rate limit (per hour)</label>
          <input
            type="number"
            value={guardrails.rateLimitPerHour}
            onChange={(e) => onUpdate({ ...guardrails, rateLimitPerHour: Number(e.target.value) })}
            className="w-full bg-secondary rounded-lg py-2 px-3 text-xs text-foreground border border-border focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Max runs per day</label>
          <input
            type="number"
            value={guardrails.maxRunsPerDay}
            onChange={(e) => onUpdate({ ...guardrails, maxRunsPerDay: Number(e.target.value) })}
            className="w-full bg-secondary rounded-lg py-2 px-3 text-xs text-foreground border border-border focus:border-primary focus:outline-none"
          />
        </div>

        <button
          onClick={() => onUpdate({ ...guardrails, requireApproval: !guardrails.requireApproval })}
          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
            guardrails.requireApproval
              ? 'border-accent/40 bg-accent/5'
              : 'border-border bg-secondary/50'
          }`}
        >
          <div>
            <p className="text-xs font-medium text-foreground">Require Approval</p>
            <p className="text-[10px] text-muted-foreground">Pause before executing actions</p>
          </div>
          <div className={`w-8 h-5 rounded-full transition-all flex items-center ${
            guardrails.requireApproval ? 'bg-accent justify-end' : 'bg-muted justify-start'
          }`}>
            <div className="w-3.5 h-3.5 rounded-full bg-foreground mx-0.5" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default GuardrailsPanel;
