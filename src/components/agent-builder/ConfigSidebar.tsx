import { useState } from 'react';
import { Wrench, Link2, Clock, Shield, Rocket, GitBranch, Cpu, Brain } from 'lucide-react';
import SkillsPicker from './SkillsPicker';
import IntegrationsPanel from './IntegrationsPanel';
import TriggersPanel from './TriggersPanel';
import GuardrailsPanel from './GuardrailsPanel';
import TestDeployPanel from './TestDeployPanel';
import WorkflowGraph from './WorkflowGraph';
import ModelSelector from './ModelSelector';
import RunPodPanel from './RunPodPanel';
import type { AgentConfig } from '@/types/agentBuilder';

interface ConfigSidebarProps {
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
  onDeploy: () => void;
  isDeploying: boolean;
}

type Tab = 'workflow' | 'skills' | 'model' | 'integrations' | 'triggers' | 'guardrails' | 'runpod' | 'deploy';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'workflow', label: 'Flow', icon: <GitBranch className="w-3.5 h-3.5" /> },
  { id: 'skills', label: 'Skills', icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: 'model', label: 'Model', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'integrations', label: 'Connect', icon: <Link2 className="w-3.5 h-3.5" /> },
  { id: 'triggers', label: 'Triggers', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'guardrails', label: 'Safety', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'runpod', label: 'RunPod', icon: <Cpu className="w-3.5 h-3.5" /> },
  { id: 'deploy', label: 'Deploy', icon: <Rocket className="w-3.5 h-3.5" /> },
];

const ConfigSidebar = ({ config, onConfigChange, onDeploy, isDeploying }: ConfigSidebarProps) => {
const [activeTab, setActiveTab] = useState<Tab>('workflow');

  const handleNavigateTab = (tab: string) => {
    if (TABS.some(t => t.id === tab)) {
      setActiveTab(tab as Tab);
    }
  };

  const toggleSkill = (skillId: string) => {
    onConfigChange({
      ...config,
      skills: config.skills.map(s =>
        s.id === skillId ? { ...s, enabled: !s.enabled } : s
      ),
    });
  };

  const toggleIntegration = (integId: string) => {
    onConfigChange({
      ...config,
      integrations: config.integrations.map(i =>
        i.id === integId ? { ...i, connected: !i.connected } : i
      ),
    });
  };

  const enabledCount = config.skills.filter(s => s.enabled).length;
  const connectedCount = config.integrations.filter(i => i.connected).length;

  return (
    <div className="flex flex-col h-full">
      {/* Agent name input */}
      <div className="px-4 py-3 border-b border-border">
        <input
          value={config.name}
          onChange={(e) => onConfigChange({ ...config, name: e.target.value })}
          placeholder="Agent name..."
          className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <input
          value={config.description}
          onChange={(e) => onConfigChange({ ...config, description: e.target.value })}
          placeholder="Short description..."
          className="w-full bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none mt-1"
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">OpenClaw</span>
          <span className="text-[9px] text-muted-foreground/30">·</span>
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">RunPod</span>
          {config.model && (
            <>
              <span className="text-[9px] text-muted-foreground/30">·</span>
              <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{config.model}</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2.5 py-2.5 text-[10px] font-medium whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'skills' && enabledCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-muted text-[9px] flex items-center justify-center text-foreground">
                {enabledCount}
              </span>
            )}
            {tab.id === 'integrations' && connectedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-muted text-[9px] flex items-center justify-center text-foreground">
                {connectedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'workflow' && (
          <WorkflowGraph
            config={config}
            onReorderSkills={(skills) => onConfigChange({ ...config, skills })}
          />
        )}
        {activeTab === 'skills' && <SkillsPicker skills={config.skills} onToggle={toggleSkill} />}
        {activeTab === 'model' && (
          <ModelSelector
            selectedModel={config.model}
            onSelect={(model) => onConfigChange({ ...config, model })}
          />
        )}
        {activeTab === 'integrations' && <IntegrationsPanel integrations={config.integrations} onToggle={toggleIntegration} />}
        {activeTab === 'triggers' && <TriggersPanel triggers={config.triggers} onUpdate={(triggers) => onConfigChange({ ...config, triggers })} />}
        {activeTab === 'guardrails' && <GuardrailsPanel guardrails={config.guardrails} onUpdate={(guardrails) => onConfigChange({ ...config, guardrails })} />}
        {activeTab === 'runpod' && <RunPodPanel config={config.runpodConfig} onUpdate={(runpodConfig) => onConfigChange({ ...config, runpodConfig })} />}
        {activeTab === 'deploy' && <TestDeployPanel config={config} onDeploy={onDeploy} isDeploying={isDeploying} onNavigateTab={handleNavigateTab} />}
      </div>
    </div>
  );
};

export default ConfigSidebar;
