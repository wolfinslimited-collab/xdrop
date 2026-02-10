export interface AgentSkill {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'automation' | 'communication' | 'data' | 'trading' | 'productivity';
  enabled: boolean;
  config: Record<string, string>;
}

export interface AgentIntegration {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  requiresApiKey: boolean;
  apiKeyLabel?: string;
}

export interface AgentTrigger {
  type: 'cron' | 'webhook' | 'event' | 'manual';
  cronExpression?: string;
  webhookUrl?: string;
  eventName?: string;
  enabled: boolean;
}

export interface AgentConfig {
  name: string;
  description: string;
  category: string;
  skills: AgentSkill[];
  integrations: AgentIntegration[];
  triggers: AgentTrigger[];
  guardrails: {
    maxSpendPerRun: number;
    requireApproval: boolean;
    rateLimitPerHour: number;
    maxRunsPerDay: number;
  };
}

export const DEFAULT_SKILLS: AgentSkill[] = [
  { id: 'web-scraping', name: 'Web Scraping', icon: '🌐', description: 'Extract data from websites and APIs', category: 'data', enabled: false, config: {} },
  { id: 'email-send', name: 'Send Emails', icon: '📧', description: 'Compose and send emails automatically', category: 'communication', enabled: false, config: {} },
  { id: 'email-read', name: 'Read Emails', icon: '📥', description: 'Monitor inbox and parse messages', category: 'communication', enabled: false, config: {} },
  { id: 'calendar', name: 'Calendar Management', icon: '📅', description: 'Create, update, and manage calendar events', category: 'productivity', enabled: false, config: {} },
  { id: 'crypto-trade', name: 'Crypto Trading', icon: '📊', description: 'Execute buy/sell orders on exchanges', category: 'trading', enabled: false, config: {} },
  { id: 'dca-bot', name: 'DCA Bot', icon: '💰', description: 'Dollar-cost averaging with configurable intervals', category: 'trading', enabled: false, config: {} },
  { id: 'social-post', name: 'Social Posting', icon: '📱', description: 'Post content to social media platforms', category: 'communication', enabled: false, config: {} },
  { id: 'lead-gen', name: 'Lead Generation', icon: '🎯', description: 'Find and qualify potential leads', category: 'automation', enabled: false, config: {} },
  { id: 'customer-support', name: 'Customer Support', icon: '🤖', description: 'Handle customer queries automatically', category: 'communication', enabled: false, config: {} },
  { id: 'file-management', name: 'File Management', icon: '📁', description: 'Upload, download, and organize files', category: 'productivity', enabled: false, config: {} },
  { id: 'browser-automation', name: 'Browser Automation', icon: '🖥️', description: 'Automate browser tasks and form fills', category: 'automation', enabled: false, config: {} },
  { id: 'data-analysis', name: 'Data Analysis', icon: '📈', description: 'Analyze datasets and generate reports', category: 'data', enabled: false, config: {} },
];

export const DEFAULT_INTEGRATIONS: AgentIntegration[] = [
  { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Send/receive messages via Telegram bot', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'discord', name: 'Discord', icon: '💬', description: 'Connect to Discord channels and DMs', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', description: 'Post tweets and monitor mentions', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'shopify', name: 'Shopify', icon: '🛒', description: 'Manage orders, products, and customers', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'gmail', name: 'Gmail', icon: '📧', description: 'Read and send emails via Gmail', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'slack', name: 'Slack', icon: '💼', description: 'Post messages and respond in Slack', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'notion', name: 'Notion', icon: '📝', description: 'Read and write Notion pages and databases', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'github', name: 'GitHub', icon: '🐙', description: 'Manage repos, issues, and PRs', connected: false, requiresApiKey: true, apiKeyLabel: 'Personal Access Token' },
];

export const DEFAULT_CONFIG: AgentConfig = {
  name: '',
  description: '',
  category: '',
  skills: DEFAULT_SKILLS,
  integrations: DEFAULT_INTEGRATIONS,
  triggers: [{ type: 'manual', enabled: true }],
  guardrails: {
    maxSpendPerRun: 10,
    requireApproval: true,
    rateLimitPerHour: 60,
    maxRunsPerDay: 100,
  },
};
