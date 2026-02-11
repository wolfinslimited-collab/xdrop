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
  endpointId: string;
  apiKeyConfigured: boolean;
}

export interface AgentConfig {
  name: string;
  description: string;
  category: string;
  model: 'claude-sonnet-4';
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

export const AI_MODEL = { id: 'claude-sonnet-4' as const, name: 'Claude Sonnet 4', provider: 'Anthropic' };

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
  // Lovable Cloud supported
  { id: 'elevenlabs', name: 'ElevenLabs', icon: '🔊', description: 'AI voice generation, text-to-speech', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'firecrawl', name: 'Firecrawl', icon: '🔥', description: 'AI-powered web scraping & search', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'perplexity', name: 'Perplexity', icon: '🔍', description: 'AI-powered search & answers', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'resend', name: 'Resend', icon: '✉️', description: 'Transactional email delivery', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  // Messaging & Social
  { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Send/receive messages via Telegram bot', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'discord', name: 'Discord', icon: '💬', description: 'Connect to Discord channels and DMs', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', description: 'Post tweets and monitor mentions', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'slack', name: 'Slack', icon: '💼', description: 'Post messages and respond in Slack', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📲', description: 'Send messages via WhatsApp Business API', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  // Email & Productivity
  { id: 'gmail', name: 'Gmail', icon: '📧', description: 'Read and send emails via Gmail', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'outlook', name: 'Outlook', icon: '📬', description: 'Microsoft Outlook email integration', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'notion', name: 'Notion', icon: '📝', description: 'Read and write Notion pages and databases', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'google-sheets', name: 'Google Sheets', icon: '📊', description: 'Read and write spreadsheet data', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'google-calendar', name: 'Google Calendar', icon: '📅', description: 'Create and manage calendar events', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'airtable', name: 'Airtable', icon: '🗂️', description: 'Database-style spreadsheet integration', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  // Developer & DevOps
  { id: 'github', name: 'GitHub', icon: '🐙', description: 'Manage repos, issues, and PRs', connected: false, requiresApiKey: true, apiKeyLabel: 'Personal Access Token' },
  { id: 'gitlab', name: 'GitLab', icon: '🦊', description: 'Manage repos, CI/CD, and merge requests', connected: false, requiresApiKey: true, apiKeyLabel: 'Personal Access Token' },
  { id: 'jira', name: 'Jira', icon: '📋', description: 'Track issues, sprints, and projects', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  { id: 'linear', name: 'Linear', icon: '⚡', description: 'Modern issue tracking and project management', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  // E-commerce & Payments
  { id: 'shopify', name: 'Shopify', icon: '🛒', description: 'Manage orders, products, and customers', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'stripe', name: 'Stripe', icon: '💳', description: 'Process payments, subscriptions, invoices', connected: false, requiresApiKey: true, apiKeyLabel: 'Secret Key' },
  // Crypto & Web3
  { id: 'coingecko', name: 'CoinGecko', icon: '🦎', description: 'Crypto price data, market caps, volume', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'birdeye', name: 'Birdeye', icon: '🦅', description: 'Solana token analytics and DeFi data', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'helius', name: 'Helius', icon: '☀️', description: 'Solana RPC, webhooks, and NFT APIs', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'jupiter', name: 'Jupiter', icon: '🪐', description: 'Solana DEX aggregator for token swaps', connected: false, requiresApiKey: false },
  // Storage & CMS
  { id: 'aws-s3', name: 'AWS S3', icon: '☁️', description: 'Cloud file storage and retrieval', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Key' },
  { id: 'pinecone', name: 'Pinecone', icon: '🌲', description: 'Vector database for AI embeddings', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  // CRM & Marketing
  { id: 'hubspot', name: 'HubSpot', icon: '🧲', description: 'CRM, contacts, deals, and marketing', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'mailchimp', name: 'Mailchimp', icon: '🐵', description: 'Email marketing campaigns and lists', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  // Webhooks & Custom
  { id: 'webhook', name: 'Custom Webhook', icon: '🔗', description: 'Send/receive data via custom webhooks', connected: false, requiresApiKey: false },
  { id: 'rest-api', name: 'REST API', icon: '🌐', description: 'Connect to any REST API endpoint', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
];

export const DEFAULT_RUNPOD_CONFIG: RunPodConfig = {
  gpuTier: 'cpu',
  maxWorkers: 3,
  minWorkers: 0,
  idleTimeout: 60,
  volumeSize: 20,
  endpointId: '',
  apiKeyConfigured: false,
};

export const DEFAULT_CONFIG: AgentConfig = {
  name: '',
  description: '',
  category: '',
  model: 'claude-sonnet-4',
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
