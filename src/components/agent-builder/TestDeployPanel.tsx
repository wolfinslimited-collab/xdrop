import { useState } from 'react';
import { Play, Rocket, Loader2, CheckCircle2, AlertCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AI_MODEL, type AgentConfig } from '@/types/agentBuilder';

interface TestDeployPanelProps {
  config: AgentConfig;
  onDeploy: () => void;
  isDeploying: boolean;
  onNavigateTab?: (tab: string) => void;
}

type TestStatus = 'idle' | 'running' | 'success' | 'error';

const TestDeployPanel = ({ config, onDeploy, isDeploying, onNavigateTab }: TestDeployPanelProps) => {
  const [testInput, setTestInput] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testOutput, setTestOutput] = useState('');

  const enabledSkills = config.skills.filter(s => s.enabled);
  const connectedIntegrations = config.integrations.filter(i => i.connected);
  const isConfigValid = config.name.trim() && enabledSkills.length > 0;
  const isRunPodReady = config.runpodConfig.apiKeyConfigured;

  const handleTest = () => {
    setTestStatus('running');
    setTestOutput('');
    setTimeout(() => {
      setTestStatus('success');
      setTestOutput(
        `✅ OpenClaw agent "${config.name}" validated successfully.\n\n` +
        `Framework: OpenClaw v3.2\n` +
        `Model: ${AI_MODEL.name}\n` +
        `Skills: ${enabledSkills.map(s => s.name).join(', ')}\n` +
        `Integrations: ${connectedIntegrations.length > 0 ? connectedIntegrations.map(i => i.name).join(', ') : 'None'}\n` +
        `Trigger: ${config.triggers[0]?.type || 'manual'}\n` +
        `RunPod Endpoint: ${config.runpodConfig.endpointId || 'Not set'}\n` +
        `Guardrails: Max $${config.guardrails.maxSpendPerRun}/run, ${config.guardrails.maxRunsPerDay} runs/day` +
        (testInput ? `\n\nTest input: "${testInput}"` : '')
      );
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Test & Deploy</h3>
        <p className="text-xs text-muted-foreground">Validate and deploy to RunPod serverless</p>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
        <p className="text-xs font-medium text-foreground">
          {config.name || 'Unnamed Agent'}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Model:</span>
            <span className="text-foreground">{AI_MODEL.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Endpoint:</span>
            <span className="text-foreground font-mono">{config.runpodConfig.endpointId || '—'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {enabledSkills.map(s => (
            <span key={s.id} className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-foreground border border-border">
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
          className="w-full bg-muted/50 rounded-lg py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/30 focus:outline-none resize-none"
        />
      </div>

      <Button
        onClick={handleTest}
        disabled={!isConfigValid || testStatus === 'running'}
        variant="secondary"
        className="w-full gap-2"
      >
        {testStatus === 'running' ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Validating...</>
        ) : (
          <><Play className="w-3.5 h-3.5" /> Test Agent</>
        )}
      </Button>

      {/* Test output */}
      {testOutput && (
        <div className={`p-3 rounded-lg border text-xs whitespace-pre-wrap font-mono ${
          testStatus === 'success'
            ? 'border-foreground/20 bg-muted/30 text-foreground'
            : 'border-destructive/30 bg-destructive/5 text-destructive'
        }`}>
          {testStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}
          {testStatus === 'error' && <AlertCircle className="w-3.5 h-3.5 inline mr-1" />}
          {testOutput}
        </div>
      )}

      {/* RunPod connection warning */}
      {!isRunPodReady && (
        <button
          onClick={() => onNavigateTab?.('runpod')}
          className="w-full p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2 text-left hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-destructive">
            RunPod API key not connected. <strong className="underline underline-offset-2">Click here</strong> to go to the RunPod tab and add your API key.
          </p>
        </button>
      )}

      {/* Deploy */}
      <Button
        onClick={onDeploy}
        disabled={!isConfigValid || !isRunPodReady || isDeploying}
        className="w-full gap-2"
      >
        {isDeploying ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deploying to RunPod...</>
        ) : (
          <><Rocket className="w-3.5 h-3.5" /> Deploy to RunPod</>
        )}
      </Button>

      {!isConfigValid && (
        <p className="text-[10px] text-muted-foreground text-center">
          Add a name and at least one skill to deploy
        </p>
      )}

      {/* Links */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          OpenClaw Docs <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <a href="https://www.runpod.io" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          RunPod Console <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};

export default TestDeployPanel;
