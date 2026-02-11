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

export interface RunPodConfig {
  gpuTier: 'cpu' | 'a40' | 'a100' | 'h100';
  maxWorkers: number;
  minWorkers: number;
  idleTimeout: number; // seconds
  volumeSize: number; // GB
}

export interface AgentConfig {
  name: string;
  description: string;
  category: string;
  model: string;
  memoryEnabled: boolean;
  contextWindow: number;
  skills: AgentSkill[];
  integrations: AgentIntegration[];
  triggers: AgentTrigger[];
  guardrails: {
    maxSpendPerRun: number;
    requireApproval: boolean;
    rateLimitPerHour: number;
    maxRunsPerDay: number;
  };
  runpodConfig: RunPodConfig;
}

export const AI_MODELS = [
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', description: 'Best for complex reasoning', tier: 'premium' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Speed/quality balance', tier: 'standard' },
  { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', description: 'Fast and cost-effective', tier: 'standard' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta', description: 'Open-source, runs on RunPod', tier: 'open' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', description: 'Fast, multilingual', tier: 'standard' },
];

export const GPU_TIERS = [
  { id: 'cpu' as const, name: 'CPU Only', price: '$0.003/sec', description: 'Lightweight tasks, no inference', vram: '—' },
  { id: 'a40' as const, name: 'A40', price: '$0.39/hr', description: 'Mid-range inference', vram: '48 GB' },
  { id: 'a100' as const, name: 'A100', price: '$1.09/hr', description: 'Large models, fast inference', vram: '80 GB' },
  { id: 'h100' as const, name: 'H100', price: '$3.49/hr', description: 'Maximum performance', vram: '80 GB' },
];

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

export const DEFAULT_RUNPOD_CONFIG: RunPodConfig = {
  gpuTier: 'cpu',
  maxWorkers: 3,
  minWorkers: 0,
  idleTimeout: 60,
  volumeSize: 20,
};

export const DEFAULT_CONFIG: AgentConfig = {
  name: '',
  description: '',
  category: '',
  model: '',
  memoryEnabled: true,
  contextWindow: 8192,
  skills: DEFAULT_SKILLS,
  integrations: DEFAULT_INTEGRATIONS,
  triggers: [{ type: 'manual', enabled: true }],
  guardrails: {
    maxSpendPerRun: 10,
    requireApproval: true,
    rateLimitPerHour: 60,
    maxRunsPerDay: 100,
  },
  runpodConfig: DEFAULT_RUNPOD_CONFIG,
};
