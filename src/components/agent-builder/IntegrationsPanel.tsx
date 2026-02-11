import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Link2, X, Key } from 'lucide-react';
import type { AgentIntegration } from '@/types/agentBuilder';

interface IntegrationsPanelProps {
  integrations: AgentIntegration[];
  onToggle: (integrationId: string) => void;
}

const CATEGORY_MAP: Record<string, string> = {
  elevenlabs: 'AI & Cloud',
  firecrawl: 'AI & Cloud',
  perplexity: 'AI & Cloud',
  resend: 'AI & Cloud',
  pinecone: 'AI & Cloud',
  telegram: 'Messaging & Social',
  discord: 'Messaging & Social',
  twitter: 'Messaging & Social',
  slack: 'Messaging & Social',
  whatsapp: 'Messaging & Social',
  gmail: 'Email & Productivity',
  outlook: 'Email & Productivity',
  notion: 'Email & Productivity',
  'google-sheets': 'Email & Productivity',
  'google-calendar': 'Email & Productivity',
  airtable: 'Email & Productivity',
  github: 'Developer & DevOps',
  gitlab: 'Developer & DevOps',
  jira: 'Developer & DevOps',
  linear: 'Developer & DevOps',
  shopify: 'E-commerce & Payments',
  stripe: 'E-commerce & Payments',
  coingecko: 'Crypto & Web3',
  birdeye: 'Crypto & Web3',
  helius: 'Crypto & Web3',
  jupiter: 'Crypto & Web3',
  'aws-s3': 'Storage',
  hubspot: 'CRM & Marketing',
  mailchimp: 'CRM & Marketing',
  webhook: 'Custom',
  'rest-api': 'Custom',
};

const CATEGORY_ORDER = [
  'AI & Cloud',
  'Messaging & Social',
  'Email & Productivity',
  'Developer & DevOps',
  'Crypto & Web3',
  'E-commerce & Payments',
  'Storage',
  'CRM & Marketing',
  'Custom',
];

const IntegrationsPanel = ({ integrations, onToggle }: IntegrationsPanelProps) => {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');

  const handleClick = (integ: AgentIntegration) => {
    if (integ.connected) {
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

  // Group integrations by category
  const grouped = new Map<string, AgentIntegration[]>();
  for (const integ of integrations) {
    const cat = CATEGORY_MAP[integ.id] || 'Other';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(integ);
  }

  const sortedCategories = CATEGORY_ORDER.filter(c => grouped.has(c));
  // Add any unmapped categories
  for (const cat of grouped.keys()) {
    if (!sortedCategories.includes(cat)) sortedCategories.push(cat);
  }

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Integrations</h3>
        <p className="text-xs text-muted-foreground">
          Connect channels and platforms · {connectedCount} connected
        </p>
      </div>

      <div className="space-y-5">
        {sortedCategories.map(category => (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {category}
              </span>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[9px] text-muted-foreground/50">
                {grouped.get(category)!.filter(i => i.connected).length}/{grouped.get(category)!.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {grouped.get(category)!.map(integ => (
                <div key={integ.id}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleClick(integ)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      integ.connected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    <span className="text-lg">{integ.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{integ.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{integ.description}</p>
                    </div>
                    {integ.connected ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
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
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPanel;
