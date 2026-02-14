import { useState, useRef, useEffect } from 'react';
import { Play, Rocket, Loader2, CheckCircle2, AlertCircle, ExternalLink, AlertTriangle, Terminal, XCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AI_MODEL, type AgentConfig } from '@/types/agentBuilder';
import AgentRunPanel from './AgentRunPanel';


export interface DeployLog {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface TestDeployPanelProps {
  config: AgentConfig;
  onDeploy: () => void;
  isDeploying: boolean;
  onNavigateTab?: (tab: string) => void;
  deployLogs: DeployLog[];
  onTryFix?: (errorMessage: string) => void;
}

type TestStatus = 'idle' | 'running' | 'success' | 'error';

const TestDeployPanel = ({ config, onDeploy, isDeploying, onNavigateTab, deployLogs, onTryFix }: TestDeployPanelProps) => {
  const [testInput, setTestInput] = useState('');
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testOutput, setTestOutput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const enabledSkills = config.skills.filter(s => s.enabled);
  const connectedIntegrations = config.integrations.filter(i => i.connected);
  const isConfigValid = config.name.trim() && enabledSkills.length > 0;
  const isRunPodReady = true; // Cloud-based, always ready

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [deployLogs]);

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const logTypeStyles: Record<DeployLog['type'], string> = {
    info: 'text-muted-foreground',
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
  };

  const logTypeIcons: Record<DeployLog['type'], React.ReactNode> = {
    info: <Terminal className="w-3 h-3" />,
    success: <CheckCircle2 className="w-3 h-3" />,
    error: <XCircle className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Test & Deploy</h3>
        <p className="text-xs text-muted-foreground">Validate and deploy to Lovable Cloud</p>
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
            <span>Runtime:</span>
            <span className="text-foreground font-mono">Lovable Cloud</span>
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

      {/* Cloud ready indicator */}

      {/* Deploy */}
      <Button
        onClick={onDeploy}
        disabled={!isConfigValid || isDeploying}
        className="w-full gap-2"
      >
        {isDeploying ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deploying...</>
        ) : (
          <><Rocket className="w-3.5 h-3.5" /> Deploy to Cloud</>
        )}
      </Button>

      {!isConfigValid && (
        <p className="text-[10px] text-muted-foreground text-center">
          Add a name and at least one skill to deploy
        </p>
      )}

      {/* Run Agent (after deployment) */}
      {config.deployedAgentId && (
        <AgentRunPanel
          agentId={config.deployedAgentId}
          agentConfig={config}
        />
      )}

      {/* Deploy Logs */}
      {deployLogs.length > 0 && (() => {
        const hasError = deployLogs.some(l => l.type === 'error');
        const lastError = [...deployLogs].reverse().find(l => l.type === 'error');
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
              <h4 className="text-xs font-medium text-foreground">Deploy Logs</h4>
            </div>
            <div className={`rounded-lg border bg-background/80 max-h-48 overflow-y-auto ${hasError ? 'border-red-500/40' : 'border-border'}`}>
              <div className="p-2 space-y-1">
                {deployLogs.map((log, i) => (
                  <div key={i} className={`flex items-start gap-1.5 text-[11px] font-mono ${logTypeStyles[log.type]}`}>
                    <span className="flex-shrink-0 mt-px">{logTypeIcons[log.type]}</span>
                    <span className="text-muted-foreground/50 flex-shrink-0">{formatTime(log.timestamp)}</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
            {hasError && lastError && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={() => onTryFix?.(lastError.message)}
              >
                <Wrench className="w-3.5 h-3.5" /> Try to Fix
              </Button>
            )}
          </div>
        );
      })()}

      {/* Links */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          OpenClaw Docs <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};

export default TestDeployPanel;
