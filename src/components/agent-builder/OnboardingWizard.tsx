import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Check, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AgentConfig, AgentSkill } from '@/types/agentBuilder';

interface OnboardingWizardProps {
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
  onComplete: () => void;
}

const STEPS = ['Name', 'Skills', 'Integrations', 'Trigger'] as const;

const OnboardingWizard = ({ config, onConfigChange, onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);

  const canAdvance = () => {
    if (step === 0) return config.name.trim().length > 0;
    if (step === 1) return config.skills.some(s => s.enabled);
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onComplete();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleSkill = (id: string) => {
    onConfigChange({
      ...config,
      skills: config.skills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    });
  };

  const toggleIntegration = (id: string) => {
    onConfigChange({
      ...config,
      integrations: config.integrations.map(i => i.id === id ? { ...i, connected: !i.connected } : i),
    });
  };

  const setTriggerType = (type: 'cron' | 'webhook' | 'event' | 'manual') => {
    onConfigChange({
      ...config,
      triggers: config.triggers.map(t => ({ ...t, enabled: t.type === type })),
    });
  };

  const activeTrigger = config.triggers.find(t => t.enabled)?.type || 'manual';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg mx-4 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground font-display">Create Your Agent</h2>
          </div>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

          {/* Progress bar */}
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? 'bg-accent' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && <StepName config={config} onConfigChange={onConfigChange} />}
              {step === 1 && <StepSkills skills={config.skills} onToggle={toggleSkill} />}
              {step === 2 && <StepIntegrations integrations={config.integrations} onToggle={toggleIntegration} />}
              {step === 3 && <StepTrigger activeTrigger={activeTrigger} onSelect={setTriggerType} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={back}
            disabled={step === 0}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="text-muted-foreground text-xs"
            >
              Skip
            </Button>
            <Button
              size="sm"
              onClick={next}
              disabled={!canAdvance()}
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {step === STEPS.length - 1 ? (
                <>
                  Launch Builder
                  <Rocket className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Step Components ── */

const StepName = ({ config, onConfigChange }: { config: AgentConfig; onConfigChange: (c: AgentConfig) => void }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">What's your agent called?</h3>
      <p className="text-xs text-muted-foreground">Pick a name and describe what it does.</p>
    </div>
    <input
      value={config.name}
      onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
      placeholder="e.g. SolDCA Bot"
      autoFocus
      className="w-full bg-secondary rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-all"
    />
    <textarea
      value={config.description}
      onChange={(e) => onConfigChange({ ...config, description: e.target.value })}
      placeholder="e.g. Buys SOL daily and posts updates to Telegram"
      rows={3}
      className="w-full bg-secondary rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-all resize-none"
    />
  </div>
);

const StepSkills = ({ skills, onToggle }: { skills: AgentSkill[]; onToggle: (id: string) => void }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">What can your agent do?</h3>
      <p className="text-xs text-muted-foreground">Select one or more skills. You can change these later.</p>
    </div>
    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
      {skills.map(skill => (
        <button
          key={skill.id}
          onClick={() => onToggle(skill.id)}
          className={`relative flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-xs ${
            skill.enabled
              ? 'border-primary/40 bg-primary/5'
              : 'border-border bg-secondary/50 hover:bg-secondary'
          }`}
        >
          {skill.enabled && (
            <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-2 h-2 text-primary-foreground" />
            </div>
          )}
          <span className="text-base leading-none">{skill.icon}</span>
          <span className="font-medium text-foreground truncate">{skill.name}</span>
        </button>
      ))}
    </div>
  </div>
);

const StepIntegrations = ({ integrations, onToggle }: { integrations: AgentConfig['integrations']; onToggle: (id: string) => void }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">Connect platforms</h3>
      <p className="text-xs text-muted-foreground">Optional — choose where your agent operates.</p>
    </div>
    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
      {integrations.map(integ => (
        <button
          key={integ.id}
          onClick={() => onToggle(integ.id)}
          className={`relative flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all text-xs ${
            integ.connected
              ? 'border-primary/40 bg-primary/5'
              : 'border-border bg-secondary/50 hover:bg-secondary'
          }`}
        >
          {integ.connected && (
            <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-2 h-2 text-primary-foreground" />
            </div>
          )}
          <span className="text-base leading-none">{integ.icon}</span>
          <span className="font-medium text-foreground truncate">{integ.name}</span>
        </button>
      ))}
    </div>
  </div>
);

const triggerOptions: { type: 'manual' | 'cron' | 'webhook' | 'event'; label: string; emoji: string; desc: string }[] = [
  { type: 'manual', label: 'Manual', emoji: '👆', desc: 'Run on demand' },
  { type: 'cron', label: 'Schedule', emoji: '⏰', desc: 'Run on a cron schedule' },
  { type: 'webhook', label: 'Webhook', emoji: '🔗', desc: 'Triggered by HTTP call' },
  { type: 'event', label: 'Event', emoji: '⚡', desc: 'React to platform events' },
];

const StepTrigger = ({ activeTrigger, onSelect }: { activeTrigger: string; onSelect: (t: 'cron' | 'webhook' | 'event' | 'manual') => void }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">When should it run?</h3>
      <p className="text-xs text-muted-foreground">Choose how your agent gets triggered.</p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {triggerOptions.map(opt => (
        <button
          key={opt.type}
          onClick={() => onSelect(opt.type)}
          className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
            activeTrigger === opt.type
              ? 'border-primary/40 bg-primary/5'
              : 'border-border bg-secondary/50 hover:bg-secondary'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{opt.emoji}</span>
            <span className="text-xs font-medium text-foreground">{opt.label}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
        </button>
      ))}
    </div>
  </div>
);

export default OnboardingWizard;
