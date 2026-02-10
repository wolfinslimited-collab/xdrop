import { motion } from 'framer-motion';
import { Check, Link2 } from 'lucide-react';
import type { AgentIntegration } from '@/types/agentBuilder';

interface IntegrationsPanelProps {
  integrations: AgentIntegration[];
  onToggle: (integrationId: string) => void;
}

const IntegrationsPanel = ({ integrations, onToggle }: IntegrationsPanelProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Integrations</h3>
        <p className="text-xs text-muted-foreground">Connect channels and platforms</p>
      </div>

      <div className="space-y-2">
        {integrations.map(integ => (
          <motion.button
            key={integ.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggle(integ.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              integ.connected
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-secondary/50 hover:bg-secondary'
            }`}
          >
            <span className="text-xl">{integ.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{integ.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{integ.description}</p>
            </div>
            {integ.connected ? (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            ) : (
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPanel;
