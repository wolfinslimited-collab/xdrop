import { useState } from 'react';
import { Wrench, Link2, Clock, Shield, Rocket, ChevronRight } from 'lucide-react';
import SkillsPicker from './SkillsPicker';
import IntegrationsPanel from './IntegrationsPanel';
import TriggersPanel from './TriggersPanel';
import GuardrailsPanel from './GuardrailsPanel';
import TestDeployPanel from './TestDeployPanel';
import type { AgentConfig } from '@/types/agentBuilder';

interface ConfigSidebarProps {
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
  onDeploy: () => void;
  isDeploying: boolean;
}

type Tab = 'skills' | 'integrations' | 'triggers' | 'guardrails' | 'deploy';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'skills', label: 'Skills', icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: 'integrations', label: 'Connect', icon: <Link2 className="w-3.5 h-3.5" /> },
  { id: 'triggers', label: 'Triggers', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'guardrails', label: 'Safety', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'deploy', label: 'Deploy', icon: <Rocket className="w-3.5 h-3.5" /> },
];

const ConfigSidebar = ({ config, onConfigChange, onDeploy, isDeploying }: ConfigSidebarProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('skills');

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
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'skills' && enabledCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary/20 text-[9px] flex items-center justify-center text-foreground">
                {enabledCount}
              </span>
            )}
            {tab.id === 'integrations' && connectedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary/20 text-[9px] flex items-center justify-center text-foreground">
                {connectedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'skills' && <SkillsPicker skills={config.skills} onToggle={toggleSkill} />}
        {activeTab === 'integrations' && <IntegrationsPanel integrations={config.integrations} onToggle={toggleIntegration} />}
        {activeTab === 'triggers' && <TriggersPanel triggers={config.triggers} onUpdate={(triggers) => onConfigChange({ ...config, triggers })} />}
        {activeTab === 'guardrails' && <GuardrailsPanel guardrails={config.guardrails} onUpdate={(guardrails) => onConfigChange({ ...config, guardrails })} />}
        {activeTab === 'deploy' && <TestDeployPanel config={config} onDeploy={onDeploy} isDeploying={isDeploying} />}
      </div>
    </div>
  );
};

export default ConfigSidebar;
