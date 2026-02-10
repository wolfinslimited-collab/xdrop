export interface AgentTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  monthlyReturnMin: number;
  monthlyReturnMax: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  // Trading
  { id: 'crypto-spot', name: 'Crypto Spot Trader', icon: '📊', category: 'Trading', description: 'Automated spot trading across major exchanges with technical analysis signals.', monthlyReturnMin: 18, monthlyReturnMax: 28, yearlyPrice: 100, features: ['Multi-exchange support', 'TA signals', 'Stop-loss protection'], popular: true },
  { id: 'pumpfun-sniper', name: 'PumpFun Sniper', icon: '🎯', category: 'Trading', description: 'Snipe new token launches on PumpFun with configurable buy/sell strategies.', monthlyReturnMin: 20, monthlyReturnMax: 30, yearlyPrice: 100, features: ['Token launch detection', 'Auto-buy on launch', 'Rug-pull guard'], popular: true },
  { id: 'polymarket-arb', name: 'Polymarket Arbitrage', icon: '⚖️', category: 'Trading', description: 'Find and execute arbitrage opportunities across prediction markets.', monthlyReturnMin: 15, monthlyReturnMax: 25, yearlyPrice: 100, features: ['Cross-market scanning', 'Auto-execution', 'Risk hedging'], popular: true },
  { id: 'defi-yield', name: 'DeFi Yield Farmer', icon: '🌾', category: 'Trading', description: 'Maximize yield across DeFi protocols with auto-compounding and rebalancing.', monthlyReturnMin: 16, monthlyReturnMax: 24, yearlyPrice: 100, features: ['Multi-protocol', 'Auto-compound', 'IL protection'] },
  { id: 'mev-bot', name: 'MEV Bot', icon: '⚡', category: 'Trading', description: 'Extract MEV from on-chain transactions with sandwich and backrun strategies.', monthlyReturnMin: 22, monthlyReturnMax: 30, yearlyPrice: 100, features: ['Sandwich trades', 'Backrunning', 'Flashloan support'] },
  { id: 'grid-trader', name: 'Grid Trading Bot', icon: '📈', category: 'Trading', description: 'Place grid orders across price ranges for consistent sideways-market profits.', monthlyReturnMin: 15, monthlyReturnMax: 22, yearlyPrice: 100, features: ['Customizable grids', 'Multi-pair', 'Auto-adjust ranges'] },
  { id: 'futures-scalper', name: 'Futures Scalper', icon: '🔥', category: 'Trading', description: 'High-frequency scalping on perpetual futures with tight risk management.', monthlyReturnMin: 20, monthlyReturnMax: 30, yearlyPrice: 100, features: ['1-5min timeframes', 'Leverage control', 'Auto-deleveraging'] },
  { id: 'nft-flipper', name: 'NFT Flipper', icon: '🎨', category: 'Trading', description: 'Snipe undervalued NFTs and auto-list for profit on secondary markets.', monthlyReturnMin: 18, monthlyReturnMax: 28, yearlyPrice: 100, features: ['Rarity scoring', 'Floor price tracking', 'Auto-list'] },

  // AI Content
  { id: 'onlyfans-ai', name: 'OnlyFans AI Manager', icon: '💋', category: 'AI Content', description: 'AI-powered content scheduling, DM management, and fan engagement automation.', monthlyReturnMin: 22, monthlyReturnMax: 30, yearlyPrice: 100, features: ['Auto DM replies', 'Content scheduling', 'PPV automation'], popular: true },
  { id: 'ig-model', name: 'Instagram AI Model', icon: '📸', category: 'AI Content', description: 'Generate and post AI model content with automated engagement and growth.', monthlyReturnMin: 18, monthlyReturnMax: 26, yearlyPrice: 100, features: ['AI image generation', 'Auto-posting', 'Hashtag optimization'], popular: true },
  { id: 'tiktok-creator', name: 'TikTok Content Creator', icon: '🎬', category: 'AI Content', description: 'Create trending short-form video content with AI voiceovers and editing.', monthlyReturnMin: 17, monthlyReturnMax: 25, yearlyPrice: 100, features: ['Trend detection', 'AI voiceover', 'Auto-posting'] },
  { id: 'youtube-shorts', name: 'YouTube Shorts Factory', icon: '▶️', category: 'AI Content', description: 'Mass-produce YouTube Shorts with AI scripts, voiceover, and thumbnails.', monthlyReturnMin: 15, monthlyReturnMax: 23, yearlyPrice: 100, features: ['Script generation', 'Voice synthesis', 'Thumbnail AI'] },
  

  // Freelancing
  { id: 'upwork-hunter', name: 'Upwork Lead Hunter', icon: '💼', category: 'Freelancing', description: 'Find, qualify, and auto-apply to high-value Upwork jobs matching your skills.', monthlyReturnMin: 20, monthlyReturnMax: 28, yearlyPrice: 100, features: ['Job matching AI', 'Auto-proposals', 'Client scoring'], popular: true },
  { id: 'fiverr-bot', name: 'Fiverr Gig Optimizer', icon: '🛠️', category: 'Freelancing', description: 'Optimize gig listings, auto-respond to inquiries, and manage order flow.', monthlyReturnMin: 18, monthlyReturnMax: 26, yearlyPrice: 100, features: ['SEO optimization', 'Auto-responses', 'Order tracking'] },

  // E-commerce
  { id: 'dropship-agent', name: 'Dropshipping Agent', icon: '📦', category: 'E-commerce', description: 'Find trending products, auto-list on stores, and manage fulfillment.', monthlyReturnMin: 19, monthlyReturnMax: 27, yearlyPrice: 100, features: ['Product research', 'Auto-listing', 'Order fulfillment'] },
  { id: 'amazon-fba', name: 'Amazon FBA Scout', icon: '🏷️', category: 'E-commerce', description: 'Scout profitable FBA products with demand analysis and competitor tracking.', monthlyReturnMin: 18, monthlyReturnMax: 26, yearlyPrice: 100, features: ['Product scouting', 'Margin calculator', 'Review monitoring'] },
  { id: 'etsy-seller', name: 'Etsy AI Seller', icon: '🎁', category: 'E-commerce', description: 'Generate digital products and optimize Etsy listings with AI.', monthlyReturnMin: 15, monthlyReturnMax: 23, yearlyPrice: 100, features: ['Digital product creation', 'SEO tags', 'Auto-renewals'] },

  // Data & Research
  { id: 'web-scraper-pro', name: 'Web Scraper Pro', icon: '🌐', category: 'Data', description: 'Enterprise-grade web scraping with proxy rotation and data cleaning.', monthlyReturnMin: 15, monthlyReturnMax: 22, yearlyPrice: 100, features: ['Proxy rotation', 'Anti-detection', 'Structured output'] },
  { id: 'market-research', name: 'Market Research Agent', icon: '🔍', category: 'Data', description: 'Continuous market research with competitor monitoring and trend analysis.', monthlyReturnMin: 16, monthlyReturnMax: 24, yearlyPrice: 100, features: ['Competitor tracking', 'Trend alerts', 'Report generation'] },
  { id: 'sentiment-tracker', name: 'Sentiment Tracker', icon: '📡', category: 'Data', description: 'Track social sentiment across platforms for trading or brand signals.', monthlyReturnMin: 15, monthlyReturnMax: 21, yearlyPrice: 100, features: ['Multi-platform', 'Real-time alerts', 'Sentiment scoring'] },

  // Automation
  { id: 'customer-support', name: 'AI Customer Support', icon: '🤖', category: 'Automation', description: 'Handle customer queries 24/7 with AI across chat, email, and social.', monthlyReturnMin: 17, monthlyReturnMax: 25, yearlyPrice: 100, features: ['Multi-channel', 'Knowledge base', 'Escalation rules'] },
  { id: 'appointment-setter', name: 'Appointment Setter', icon: '📅', category: 'Automation', description: 'AI-powered appointment booking with qualification and calendar sync.', monthlyReturnMin: 18, monthlyReturnMax: 26, yearlyPrice: 100, features: ['Lead qualification', 'Calendar integration', 'SMS reminders'] },
  { id: 'invoice-collector', name: 'Invoice Collector', icon: '💳', category: 'Automation', description: 'Automate invoice creation, sending, and payment follow-ups.', monthlyReturnMin: 15, monthlyReturnMax: 22, yearlyPrice: 100, features: ['Auto-invoicing', 'Payment reminders', 'Overdue tracking'] },
  { id: 'social-manager', name: 'Social Media Manager', icon: '📱', category: 'Automation', description: 'Schedule, post, and engage across all social platforms automatically.', monthlyReturnMin: 16, monthlyReturnMax: 23, yearlyPrice: 100, features: ['Multi-platform posting', 'Engagement bot', 'Analytics'] },
  { id: 'review-harvester', name: 'Review Harvester', icon: '⭐', category: 'Automation', description: 'Automatically request and manage customer reviews across platforms.', monthlyReturnMin: 15, monthlyReturnMax: 21, yearlyPrice: 100, features: ['Review requests', 'Response templates', 'Reputation alerts'] },

  // Misc
  { id: 'ai-copywriter', name: 'AI Copywriter', icon: '✍️', category: 'Content', description: 'Generate high-converting copy for ads, landing pages, and email campaigns.', monthlyReturnMin: 17, monthlyReturnMax: 25, yearlyPrice: 100, features: ['Ad copy', 'Landing pages', 'A/B testing'] },
  { id: 'seo-agent', name: 'SEO Agent', icon: '🔎', category: 'Content', description: 'Automated SEO audits, keyword research, and content optimization.', monthlyReturnMin: 16, monthlyReturnMax: 24, yearlyPrice: 100, features: ['Site audits', 'Keyword tracking', 'Content briefs'] },

  // AI E-commerce
  { id: 'ai-dropshipping', name: 'AI Dropshipping Agent', icon: '🚚', category: 'AI E-commerce', description: 'End-to-end AI dropshipping: product research, store setup, ad creatives, and order fulfillment.', monthlyReturnMin: 20, monthlyReturnMax: 30, yearlyPrice: 100, features: ['Winning product finder', 'Auto-list to store', 'Ad creative AI', 'Order routing'], popular: true },
  { id: 'ai-ecommerce', name: 'AI E-commerce Manager', icon: '🏪', category: 'AI E-commerce', description: 'Full AI-powered e-commerce automation: pricing, inventory, customer service, and marketing.', monthlyReturnMin: 18, monthlyReturnMax: 28, yearlyPrice: 100, features: ['Dynamic pricing', 'Inventory forecasting', 'AI customer support', 'Email campaigns'], popular: true },
];

export const TEMPLATE_CATEGORIES = [...new Set(AGENT_TEMPLATES.map(t => t.category))];
