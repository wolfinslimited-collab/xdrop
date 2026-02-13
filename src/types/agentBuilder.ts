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
  usePlatformKey: boolean;
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
  { id: 'cpu' as const, name: 'CPU Only', price: '$0.003/sec', description: 'Lightweight tasks, no inference', vram: '—', runpodId: 'CPU' },
  { id: 'a40' as const, name: 'A40 / Ada 48GB', price: '$0.39/hr', description: 'Mid-range inference', vram: '48 GB', runpodId: 'AMPERE_48,ADA_48_PRO' },
  { id: 'a100' as const, name: 'A100 80GB', price: '$1.09/hr', description: 'Large models, fast inference', vram: '80 GB', runpodId: 'AMPERE_80,ADA_80_PRO' },
  { id: 'h100' as const, name: 'H100 80GB', price: '$3.49/hr', description: 'Maximum performance', vram: '80 GB', runpodId: 'ADA_80_PRO,AMPERE_80' },
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
  // AI & Cloud
  { id: 'openai', name: 'OpenAI', icon: '🧠', description: 'GPT models, embeddings, DALL·E, Whisper', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'anthropic', name: 'Anthropic', icon: '🤖', description: 'Claude models for reasoning and analysis', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'google-ai', name: 'Google AI', icon: '🔮', description: 'Gemini models, multimodal AI', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'replicate', name: 'Replicate', icon: '🔄', description: 'Run open-source ML models via API', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  { id: 'huggingface', name: 'Hugging Face', icon: '🤗', description: 'ML model hub and inference API', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  { id: 'elevenlabs', name: 'ElevenLabs', icon: '🔊', description: 'AI voice generation, text-to-speech', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'firecrawl', name: 'Firecrawl', icon: '🔥', description: 'AI-powered web scraping & search', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'perplexity', name: 'Perplexity', icon: '🔍', description: 'AI-powered search & answers', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'stability', name: 'Stability AI', icon: '🎨', description: 'Stable Diffusion image generation', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'deepgram', name: 'Deepgram', icon: '🎙️', description: 'Speech-to-text and audio intelligence', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'pinecone', name: 'Pinecone', icon: '🌲', description: 'Vector database for AI embeddings', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'weaviate', name: 'Weaviate', icon: '🕸️', description: 'Vector search engine for AI apps', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'langchain', name: 'LangChain', icon: '🔗', description: 'LLM orchestration and chaining', connected: false, requiresApiKey: false },
  // Messaging & Social
  { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Send/receive messages via Telegram bot', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'discord', name: 'Discord', icon: '💬', description: 'Connect to Discord channels and DMs', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', description: 'Post tweets and monitor mentions', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'slack', name: 'Slack', icon: '💼', description: 'Post messages and respond in Slack', connected: false, requiresApiKey: true, apiKeyLabel: 'Bot Token' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📲', description: 'Send messages via WhatsApp Business API', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'instagram', name: 'Instagram', icon: '📸', description: 'Post content and manage DMs', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'facebook', name: 'Facebook', icon: '👤', description: 'Pages, Messenger, and ad management', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'reddit', name: 'Reddit', icon: '🟠', description: 'Post, comment, and monitor subreddits', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'linkedin', name: 'LinkedIn', icon: '🔵', description: 'Post updates and manage connections', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', description: 'Upload videos and manage channels', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', description: 'Post videos and track analytics', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'twitch', name: 'Twitch', icon: '🟣', description: 'Chat bot and stream management', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  // Email & Productivity
  { id: 'gmail', name: 'Gmail', icon: '📧', description: 'Read and send emails via Gmail', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'outlook', name: 'Outlook', icon: '📬', description: 'Microsoft Outlook email integration', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'resend', name: 'Resend', icon: '✉️', description: 'Transactional email delivery', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'sendgrid', name: 'SendGrid', icon: '📨', description: 'Scalable email delivery service', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'notion', name: 'Notion', icon: '📝', description: 'Read and write Notion pages and databases', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'google-sheets', name: 'Google Sheets', icon: '📊', description: 'Read and write spreadsheet data', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'google-calendar', name: 'Google Calendar', icon: '📅', description: 'Create and manage calendar events', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'google-drive', name: 'Google Drive', icon: '📁', description: 'File storage, sharing, and retrieval', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  { id: 'airtable', name: 'Airtable', icon: '🗂️', description: 'Database-style spreadsheet integration', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'trello', name: 'Trello', icon: '📌', description: 'Board-based task and project management', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'asana', name: 'Asana', icon: '✅', description: 'Project and task management', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'clickup', name: 'ClickUp', icon: '🎯', description: 'All-in-one project management', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'todoist', name: 'Todoist', icon: '📋', description: 'Task management and to-do lists', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  { id: 'confluence', name: 'Confluence', icon: '📖', description: 'Team wiki and documentation', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  { id: 'dropbox', name: 'Dropbox', icon: '💧', description: 'Cloud file storage and sync', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'onedrive', name: 'OneDrive', icon: '☁️', description: 'Microsoft cloud file storage', connected: false, requiresApiKey: true, apiKeyLabel: 'OAuth Token' },
  // Developer & DevOps
  { id: 'github', name: 'GitHub', icon: '🐙', description: 'Manage repos, issues, and PRs', connected: false, requiresApiKey: true, apiKeyLabel: 'Personal Access Token' },
  { id: 'gitlab', name: 'GitLab', icon: '🦊', description: 'Manage repos, CI/CD, and merge requests', connected: false, requiresApiKey: true, apiKeyLabel: 'Personal Access Token' },
  { id: 'bitbucket', name: 'Bitbucket', icon: '🪣', description: 'Git repos and CI/CD pipelines', connected: false, requiresApiKey: true, apiKeyLabel: 'App Password' },
  { id: 'jira', name: 'Jira', icon: '🔷', description: 'Track issues, sprints, and projects', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  { id: 'linear', name: 'Linear', icon: '⚡', description: 'Modern issue tracking and project management', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'vercel', name: 'Vercel', icon: '▲', description: 'Deploy and manage web applications', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  { id: 'docker', name: 'Docker Hub', icon: '🐳', description: 'Container image registry', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'sentry', name: 'Sentry', icon: '🛡️', description: 'Error tracking and performance monitoring', connected: false, requiresApiKey: true, apiKeyLabel: 'Auth Token' },
  { id: 'datadog', name: 'Datadog', icon: '🐕', description: 'Monitoring, logs, and APM', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'pagerduty', name: 'PagerDuty', icon: '🚨', description: 'Incident management and alerting', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  // E-commerce & Payments
  { id: 'shopify', name: 'Shopify', icon: '🛒', description: 'Manage orders, products, and customers', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'stripe', name: 'Stripe', icon: '💳', description: 'Process payments, subscriptions, invoices', connected: false, requiresApiKey: true, apiKeyLabel: 'Secret Key' },
  { id: 'paypal', name: 'PayPal', icon: '💰', description: 'Payments, transfers, and checkout', connected: false, requiresApiKey: true, apiKeyLabel: 'Client ID' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🛍️', description: 'WordPress e-commerce management', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'gumroad', name: 'Gumroad', icon: '🎁', description: 'Sell digital products and memberships', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'lemonsqueezy', name: 'Lemon Squeezy', icon: '🍋', description: 'Digital product payments and licensing', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  // Crypto & Web3
  { id: 'coingecko', name: 'CoinGecko', icon: '🦎', description: 'Crypto price data, market caps, volume', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'birdeye', name: 'Birdeye', icon: '🦅', description: 'Solana token analytics and DeFi data', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'helius', name: 'Helius', icon: '☀️', description: 'Solana RPC, webhooks, and NFT APIs', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'jupiter', name: 'Jupiter', icon: '🪐', description: 'Solana DEX aggregator for token swaps', connected: false, requiresApiKey: false },
  { id: 'alchemy', name: 'Alchemy', icon: '⚗️', description: 'Blockchain RPC, NFT, and token APIs', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'moralis', name: 'Moralis', icon: '🔮', description: 'Web3 data, streams, and authentication', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'infura', name: 'Infura', icon: '🌉', description: 'Ethereum and IPFS infrastructure', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'thegraph', name: 'The Graph', icon: '📈', description: 'Indexed blockchain data via GraphQL', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'chainlink', name: 'Chainlink', icon: '⛓️', description: 'Decentralized oracle price feeds', connected: false, requiresApiKey: false },
  { id: 'dexscreener', name: 'DEX Screener', icon: '📉', description: 'Real-time DEX pair analytics', connected: false, requiresApiKey: false },
  { id: 'pumpfun', name: 'Pump.fun', icon: '🚀', description: 'Solana token launch monitoring', connected: false, requiresApiKey: false },
  { id: 'raydium', name: 'Raydium', icon: '💎', description: 'Solana AMM and liquidity pools', connected: false, requiresApiKey: false },
  { id: 'magic-eden', name: 'Magic Eden', icon: '🏰', description: 'NFT marketplace APIs', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'polymarket', name: 'Polymarket', icon: '🎲', description: 'Prediction market data and trading', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  // Storage & Databases
  { id: 'aws-s3', name: 'AWS S3', icon: '🗄️', description: 'Cloud file storage and retrieval', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Key' },
  { id: 'supabase', name: 'Supabase', icon: '⚡', description: 'Postgres database and auth', connected: false, requiresApiKey: true, apiKeyLabel: 'Service Key' },
  { id: 'firebase', name: 'Firebase', icon: '🔥', description: 'Google cloud database and auth', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'mongodb', name: 'MongoDB', icon: '🍃', description: 'NoSQL document database', connected: false, requiresApiKey: true, apiKeyLabel: 'Connection String' },
  { id: 'redis', name: 'Redis', icon: '🔴', description: 'In-memory cache and message broker', connected: false, requiresApiKey: true, apiKeyLabel: 'Connection URL' },
  { id: 'cloudflare-r2', name: 'Cloudflare R2', icon: '🟠', description: 'S3-compatible object storage', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  // CRM & Marketing
  { id: 'hubspot', name: 'HubSpot', icon: '🧲', description: 'CRM, contacts, deals, and marketing', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'mailchimp', name: 'Mailchimp', icon: '🐵', description: 'Email marketing campaigns and lists', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'Enterprise CRM and automation', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'intercom', name: 'Intercom', icon: '💬', description: 'Customer messaging and support', connected: false, requiresApiKey: true, apiKeyLabel: 'Access Token' },
  { id: 'zendesk', name: 'Zendesk', icon: '🎫', description: 'Customer support ticketing system', connected: false, requiresApiKey: true, apiKeyLabel: 'API Token' },
  { id: 'convertkit', name: 'ConvertKit', icon: '📩', description: 'Creator-focused email marketing', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'segment', name: 'Segment', icon: '📊', description: 'Customer data platform and analytics', connected: false, requiresApiKey: true, apiKeyLabel: 'Write Key' },
  { id: 'mixpanel', name: 'Mixpanel', icon: '📐', description: 'Product analytics and user tracking', connected: false, requiresApiKey: true, apiKeyLabel: 'Project Token' },
  // Automation & Webhooks
  { id: 'zapier', name: 'Zapier', icon: '⚡', description: 'Connect 5000+ apps with automations', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'make', name: 'Make (Integromat)', icon: '🔧', description: 'Visual automation platform', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'n8n', name: 'n8n', icon: '🔀', description: 'Self-hosted workflow automation', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'ifttt', name: 'IFTTT', icon: '🔌', description: 'Simple conditional automations', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'webhook', name: 'Custom Webhook', icon: '🔗', description: 'Send/receive data via custom webhooks', connected: false, requiresApiKey: false },
  { id: 'rest-api', name: 'REST API', icon: '🌐', description: 'Connect to any REST API endpoint', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'graphql', name: 'GraphQL', icon: '◆', description: 'Query any GraphQL API endpoint', connected: false, requiresApiKey: true, apiKeyLabel: 'API Key' },
  { id: 'cron', name: 'Cron Job', icon: '⏰', description: 'Schedule recurring tasks', connected: false, requiresApiKey: false },
];

export const DEFAULT_RUNPOD_CONFIG: RunPodConfig = {
  gpuTier: 'cpu',
  maxWorkers: 3,
  minWorkers: 0,
  idleTimeout: 60,
  volumeSize: 20,
  endpointId: '',
  apiKeyConfigured: false,
  usePlatformKey: false,
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
