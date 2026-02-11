import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Link2, X, Key } from 'lucide-react';
import type { AgentIntegration } from '@/types/agentBuilder';

interface IntegrationsPanelProps {
  integrations: AgentIntegration[];
  onToggle: (integrationId: string) => void;
}

const IntegrationsPanel = ({ integrations, onToggle }: IntegrationsPanelProps) => {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');

  const handleClick = (integ: AgentIntegration) => {
    if (integ.connected) {
      // Disconnect
      onToggle(integ.id);
      return;
    }
    if (integ.requiresApiKey) {
      setConnectingId(integ.id);
      setApiKeyValue('');
    } else {
      onToggle(integ.id);
    }
  };

  const handleConnect = (id: string) => {
    if (apiKeyValue.trim().length === 0) return;
    onToggle(id);
    setConnectingId(null);
    setApiKeyValue('');
  };

  const handleCancel = () => {
    setConnectingId(null);
    setApiKeyValue('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Integrations</h3>
        <p className="text-xs text-muted-foreground">Connect channels and platforms</p>
      </div>

      <div className="space-y-2">
        {integrations.map(integ => (
          <div key={integ.id}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(integ)}
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

            <AnimatePresence>
              {connectingId === integ.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 p-3 rounded-xl border border-border bg-secondary/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Key className="w-3 h-3" />
                      <span>{integ.apiKeyLabel || 'API Key'}</span>
                    </div>
                    <input
                      type="password"
                      value={apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                      placeholder={`Enter ${integ.apiKeyLabel || 'API Key'}...`}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleConnect(integ.id)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConnect(integ.id)}
                        disabled={apiKeyValue.trim().length === 0}
                        className="flex-1 text-[11px] font-medium py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Connect
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 rounded-lg border border-border text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPanel;
