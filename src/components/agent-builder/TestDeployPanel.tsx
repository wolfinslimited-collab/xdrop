import { useState } from 'react';
import { Play, Rocket, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AgentConfig } from '@/types/agentBuilder';

interface TestDeployPanelProps {
  config: AgentConfig;
  onDeploy: () => void;
  isDeploying: boolean;
}

type TestStatus = 'idle' | 'running' | 'success' | 'error';

const TestDeployPanel = ({ config, onDeploy, isDeploying }: TestDeployPanelProps) => {
  const [testInput, setTestInput] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testOutput, setTestOutput] = useState('');

  const enabledSkills = config.skills.filter(s => s.enabled);
  const connectedIntegrations = config.integrations.filter(i => i.connected);
  const isConfigValid = config.name.trim() && enabledSkills.length > 0;

  const handleTest = () => {
    setTestStatus('running');
    setTestOutput('');
    setTimeout(() => {
      setTestStatus('success');
      setTestOutput(
        `✅ Agent "${config.name}" validated successfully.\n\n` +
        `Skills: ${enabledSkills.map(s => s.name).join(', ')}\n` +
        `Integrations: ${connectedIntegrations.length > 0 ? connectedIntegrations.map(i => i.name).join(', ') : 'None'}\n` +
        `Trigger: ${config.triggers[0]?.type || 'manual'}\n` +
        `Guardrails: Max $${config.guardrails.maxSpendPerRun}/run, ${config.guardrails.maxRunsPerDay} runs/day` +
        (testInput ? `\n\nTest input: "${testInput}"` : '')
      );
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Test & Deploy</h3>
        <p className="text-xs text-muted-foreground">Validate your agent and go live</p>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1.5">
        <p className="text-xs font-medium text-foreground">
          {config.name || 'Unnamed Agent'}
        </p>
        <div className="flex flex-wrap gap-1">
          {enabledSkills.map(s => (
            <span key={s.id} className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-foreground">
              {s.icon} {s.name}
            </span>
          ))}
          {enabledSkills.length === 0 && (
            <span className="text-[10px] text-muted-foreground">No skills selected</span>
          )}
        </div>
      </div>

      {/* Test input */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Test input (optional)</label>
        <textarea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="e.g., Find 5 freelance Python jobs on Upwork..."
          rows={2}
          className="w-full bg-secondary rounded-lg py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none resize-none"
        />
      </div>

      <Button
        onClick={handleTest}
        disabled={!isConfigValid || testStatus === 'running'}
        variant="secondary"
        className="w-full gap-2"
      >
        {testStatus === 'running' ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running test...</>
        ) : (
          <><Play className="w-3.5 h-3.5" /> Test Agent</>
        )}
      </Button>

      {/* Test output */}
      {testOutput && (
        <div className={`p-3 rounded-xl border text-xs whitespace-pre-wrap ${
          testStatus === 'success'
            ? 'border-green-500/30 bg-green-500/5 text-green-300'
            : 'border-destructive/30 bg-destructive/5 text-destructive'
        }`}>
          {testStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}
          {testStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 inline mr-1" />}
          {testOutput}
        </div>
      )}

      {/* Deploy */}
      <Button
        onClick={onDeploy}
        disabled={!isConfigValid || isDeploying}
        className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {isDeploying ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deploying...</>
        ) : (
          <><Rocket className="w-3.5 h-3.5" /> Deploy Agent</>
        )}
      </Button>

      {!isConfigValid && (
        <p className="text-[10px] text-muted-foreground text-center">
          Add a name and at least one skill to deploy
        </p>
      )}
    </div>
  );
};

export default TestDeployPanel;
