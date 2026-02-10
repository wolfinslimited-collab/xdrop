import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowRight, Zap, Shield, Radio } from 'lucide-react';
import type { AgentConfig } from '@/types/agentBuilder';

interface WorkflowGraphProps {
  config: AgentConfig;
}

const WorkflowGraph = ({ config }: WorkflowGraphProps) => {
  const enabledSkills = config.skills.filter(s => s.enabled);
  const connectedIntegrations = config.integrations.filter(i => i.connected);
  const activeTrigger = config.triggers.find(t => t.enabled)?.type || 'manual';
  const hasGuardrails = config.guardrails.maxSpendPerRun > 0 || config.guardrails.requireApproval;

  if (enabledSkills.length === 0 && connectedIntegrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-12">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
          <Zap className="w-5 h-5" />
        </div>
        <p className="text-sm text-center max-w-[220px]">
          Enable skills & integrations to see your agent's workflow
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex items-start gap-2 min-w-max px-2">
        {/* Trigger node */}
        <Node
          icon={<Radio className="w-3.5 h-3.5" />}
          label={activeTrigger.charAt(0).toUpperCase() + activeTrigger.slice(1)}
          sublabel="Trigger"
          color="accent"
          delay={0}
        />

        {enabledSkills.length > 0 && <Connector delay={0.1} />}

        {/* Skill nodes */}
        {enabledSkills.length > 1 ? (
          <div className="flex flex-col gap-2 items-center">
            <AnimatePresence>
              {enabledSkills.map((skill, i) => (
                <div key={skill.id} className="flex items-center gap-2">
                  {i > 0 && <div className="w-4" />}
                  <Node
                    icon={<span className="text-sm leading-none">{skill.icon}</span>}
                    label={skill.name}
                    sublabel="Skill"
                    color="primary"
                    delay={0.15 + i * 0.05}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        ) : enabledSkills.length === 1 ? (
          <Node
            icon={<span className="text-sm leading-none">{enabledSkills[0].icon}</span>}
            label={enabledSkills[0].name}
            sublabel="Skill"
            color="primary"
            delay={0.15}
          />
        ) : null}

        {connectedIntegrations.length > 0 && <Connector delay={0.25} />}

        {/* Integration nodes */}
        {connectedIntegrations.length > 1 ? (
          <div className="flex flex-col gap-2 items-center">
            {connectedIntegrations.map((integ, i) => (
              <div key={integ.id} className="flex items-center gap-2">
                {i > 0 && <div className="w-4" />}
                <Node
                  icon={<span className="text-sm leading-none">{integ.icon}</span>}
                  label={integ.name}
                  sublabel="Integration"
                  color="secondary"
                  delay={0.3 + i * 0.05}
                />
              </div>
            ))}
          </div>
        ) : connectedIntegrations.length === 1 ? (
          <Node
            icon={<span className="text-sm leading-none">{connectedIntegrations[0].icon}</span>}
            label={connectedIntegrations[0].name}
            sublabel="Integration"
            color="secondary"
            delay={0.3}
          />
        ) : null}

        {hasGuardrails && (
          <>
            <Connector delay={0.4} />
            <Node
              icon={<Shield className="w-3.5 h-3.5" />}
              label="Guardrails"
              sublabel={config.guardrails.requireApproval ? 'Approval req.' : 'Auto'}
              color="warning"
              delay={0.45}
            />
          </>
        )}

        {/* Output node */}
        <Connector delay={0.5} />
        <Node
          icon={<Bot className="w-3.5 h-3.5" />}
          label={config.name || 'Agent'}
          sublabel="Output"
          color="accent"
          delay={0.55}
        />
      </div>
    </div>
  );
};

const colorMap: Record<string, string> = {
  primary: 'border-primary/40 bg-primary/10',
  accent: 'border-accent/40 bg-accent/10',
  secondary: 'border-border bg-secondary',
  warning: 'border-yellow-500/40 bg-yellow-500/10',
};

const Node = ({
  icon,
  label,
  sublabel,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.25, type: 'spring', stiffness: 300 }}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorMap[color] || colorMap.secondary} min-w-[100px]`}
  >
    <div className="shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-foreground truncate">{label}</p>
      <p className="text-[9px] text-muted-foreground">{sublabel}</p>
    </div>
  </motion.div>
);

const Connector = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scaleX: 0 }}
    animate={{ opacity: 1, scaleX: 1 }}
    transition={{ delay, duration: 0.2 }}
    className="flex items-center self-center"
  >
    <div className="w-6 h-px bg-border" />
    <ArrowRight className="w-3 h-3 text-muted-foreground -ml-1" />
  </motion.div>
);

export default WorkflowGraph;
