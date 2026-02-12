export interface AgentTemplate {
  id: string;
  name: string;
  icon: string;
  lucideIcon: string;
  category: string;
  description: string;
  monthlyReturnMin: number;
  monthlyReturnMax: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  // Trading — mixed pricing
  { id: 'crypto-spot', name: 'Crypto Spot Trader', icon: '📊', lucideIcon: 'candlestick-chart', category: 'Trading', description: 'Automated spot trading across major exchanges with technical analysis signals.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Multi-exchange support', 'TA signals', 'Stop-loss protection'], popular: true },
  { id: 'pumpfun-sniper', name: 'PumpFun Sniper', icon: '🎯', lucideIcon: 'crosshair', category: 'Trading', description: 'Snipe new token launches on PumpFun with configurable buy/sell strategies.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Token launch detection', 'Auto-buy on launch', 'Rug-pull guard'], popular: true },
  { id: 'polymarket-arb', name: 'Polymarket Arbitrage', icon: '⚖️', lucideIcon: 'scale', category: 'Trading', description: 'Find and execute arbitrage opportunities across prediction markets.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Cross-market scanning', 'Auto-execution', 'Risk hedging'] },
  { id: 'defi-yield', name: 'DeFi Yield Farmer', icon: '🌾', lucideIcon: 'sprout', category: 'Trading', description: 'Maximize yield across DeFi protocols with auto-compounding and rebalancing.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Multi-protocol', 'Auto-compound', 'IL protection'] },
  { id: 'mev-bot', name: 'MEV Bot', icon: '⚡', lucideIcon: 'zap', category: 'Trading', description: 'Extract MEV from on-chain transactions with sandwich and backrun strategies.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Sandwich trades', 'Backrunning', 'Flashloan support'], popular: true },
  { id: 'grid-trader', name: 'Grid Trading Bot', icon: '📈', lucideIcon: 'grid-3x3', category: 'Trading', description: 'Place grid orders across price ranges for consistent sideways-market profits.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Customizable grids', 'Multi-pair', 'Auto-adjust ranges'] },
  { id: 'futures-scalper', name: 'Futures Scalper', icon: '🔥', lucideIcon: 'flame', category: 'Trading', description: 'High-frequency scalping on perpetual futures with tight risk management.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['1-5min timeframes', 'Leverage control', 'Auto-deleveraging'] },
  { id: 'nft-flipper', name: 'NFT Flipper', icon: '🎨', lucideIcon: 'palette', category: 'Trading', description: 'Snipe undervalued NFTs and auto-list for profit on secondary markets.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Rarity scoring', 'Floor price tracking', 'Auto-list'] },

  // AI Content
  { id: 'onlyfans-ai', name: 'OnlyFans AI Manager', icon: '💋', lucideIcon: 'heart', category: 'AI Content', description: 'AI-powered content scheduling, DM management, and fan engagement automation.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Auto DM replies', 'Content scheduling', 'PPV automation'], popular: true },
  { id: 'ig-model', name: 'Instagram AI Model', icon: '📸', lucideIcon: 'camera', category: 'AI Content', description: 'Generate and post AI model content with automated engagement and growth.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['AI image generation', 'Auto-posting', 'Hashtag optimization'] },
  { id: 'tiktok-creator', name: 'TikTok Content Creator', icon: '🎬', lucideIcon: 'clapperboard', category: 'AI Content', description: 'Create trending short-form video content with AI voiceovers and editing.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Trend detection', 'AI voiceover', 'Auto-posting'] },
  { id: 'youtube-shorts', name: 'YouTube Shorts Factory', icon: '▶️', lucideIcon: 'play', category: 'AI Content', description: 'Mass-produce YouTube Shorts with AI scripts, voiceover, and thumbnails.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Script generation', 'Voice synthesis', 'Thumbnail AI'] },

  // Freelancing
  { id: 'upwork-hunter', name: 'Upwork Lead Hunter', icon: '💼', lucideIcon: 'briefcase', category: 'Freelancing', description: 'Find, qualify, and auto-apply to high-value Upwork jobs matching your skills.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Job matching AI', 'Auto-proposals', 'Client scoring'], popular: true },
  { id: 'fiverr-bot', name: 'Fiverr Gig Optimizer', icon: '🛠️', lucideIcon: 'wrench', category: 'Freelancing', description: 'Optimize gig listings, auto-respond to inquiries, and manage order flow.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['SEO optimization', 'Auto-responses', 'Order tracking'] },

  // E-commerce
  { id: 'dropship-agent', name: 'Dropshipping Agent', icon: '📦', lucideIcon: 'package', category: 'E-commerce', description: 'Find trending products, auto-list on stores, and manage fulfillment.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Product research', 'Auto-listing', 'Order fulfillment'] },
  { id: 'amazon-fba', name: 'Amazon FBA Scout', icon: '🏷️', lucideIcon: 'tag', category: 'E-commerce', description: 'Scout profitable FBA products with demand analysis and competitor tracking.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Product scouting', 'Margin calculator', 'Review monitoring'] },
  { id: 'etsy-seller', name: 'Etsy AI Seller', icon: '🎁', lucideIcon: 'gift', category: 'E-commerce', description: 'Generate digital products and optimize Etsy listings with AI.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Digital product creation', 'SEO tags', 'Auto-renewals'] },

  // Data & Research
  { id: 'web-scraper-pro', name: 'Web Scraper Pro', icon: '🌐', lucideIcon: 'globe', category: 'Data', description: 'Enterprise-grade web scraping with proxy rotation and data cleaning.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Proxy rotation', 'Anti-detection', 'Structured output'] },

  // Automation
  { id: 'invoice-collector', name: 'Invoice Collector', icon: '💳', lucideIcon: 'receipt', category: 'Automation', description: 'Automate invoice creation, sending, and payment follow-ups.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Auto-invoicing', 'Payment reminders', 'Overdue tracking'] },
  { id: 'social-manager', name: 'Social Media Manager', icon: '📱', lucideIcon: 'share-2', category: 'Automation', description: 'Schedule, post, and engage across all social platforms automatically.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Multi-platform posting', 'Engagement bot', 'Analytics'] },
  { id: 'review-harvester', name: 'Review Harvester', icon: '⭐', lucideIcon: 'star', category: 'Automation', description: 'Automatically request and manage customer reviews across platforms.', monthlyReturnMin: 2, monthlyReturnMax: 5, yearlyPrice: 20, features: ['Review requests', 'Response templates', 'Reputation alerts'] },

  // AI E-commerce
  { id: 'ai-dropshipping', name: 'AI Dropshipping Agent', icon: '🚚', lucideIcon: 'truck', category: 'AI E-commerce', description: 'End-to-end AI dropshipping: product research, store setup, ad creatives, and order fulfillment.', monthlyReturnMin: 10, monthlyReturnMax: 15, yearlyPrice: 50, features: ['Winning product finder', 'Auto-list to store', 'Ad creative AI', 'Order routing'], popular: true },
];

export const TEMPLATE_CATEGORIES = [...new Set(AGENT_TEMPLATES.map(t => t.category))];
