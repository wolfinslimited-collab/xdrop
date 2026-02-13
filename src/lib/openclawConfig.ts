import type { AgentConfig } from '@/types/agentBuilder';

/**
 * Generate OpenClaw YAML-style config from builder state.
 * This JSON object is passed as OPENCLAW_CONFIG env var to the RunPod worker.
 */
export function generateOpenClawConfig(config: AgentConfig) {
  const enabledSkills = config.skills.filter(s => s.enabled);
  const connectedIntegrations = config.integrations.filter(i => i.connected);

  // Map builder skills to OpenClaw skill names
  const skillMap: Record<string, string> = {
    'web-scraping': 'openclaw.skills.web_scraper',
    'email-send': 'openclaw.skills.email_sender',
    'email-read': 'openclaw.skills.email_reader',
    'calendar': 'openclaw.skills.calendar_manager',
    'crypto-trade': 'openclaw.skills.crypto_trader',
    'dca-bot': 'openclaw.skills.dca_bot',
    'social-post': 'openclaw.skills.social_poster',
    'lead-gen': 'openclaw.skills.lead_generator',
    'customer-support': 'openclaw.skills.support_agent',
    'file-management': 'openclaw.skills.file_manager',
    'browser-automation': 'openclaw.skills.browser_auto',
    'data-analysis': 'openclaw.skills.data_analyst',
  };

  // Map integrations to OpenClaw connection format
  const integrationMap: Record<string, string> = {
    'telegram': 'telegram',
    'discord': 'discord',
    'twitter': 'twitter',
    'slack': 'slack',
    'gmail': 'gmail',
    'notion': 'notion',
    'github': 'github',
    'shopify': 'shopify',
    'openai': 'openai',
    'anthropic': 'anthropic',
    'elevenlabs': 'elevenlabs',
  };

  const openclawConfig = {
    version: '1.0',
    agent: {
      name: config.name,
      description: config.description,
      model: config.model,
      memory: {
        enabled: config.memoryEnabled,
        context_window: config.contextWindow,
      },
    },
    skills: enabledSkills.map(s => ({
      module: skillMap[s.id] || `openclaw.skills.${s.id.replace(/-/g, '_')}`,
      name: s.name,
      config: s.config || {},
    })),
    integrations: connectedIntegrations.map(i => ({
      provider: integrationMap[i.id] || i.id,
      name: i.name,
    })),
    triggers: config.triggers
      .filter(t => t.enabled)
      .map(t => ({
        type: t.type,
        ...(t.cronExpression && { cron: t.cronExpression }),
        ...(t.webhookUrl && { webhook_url: t.webhookUrl }),
        ...(t.eventName && { event: t.eventName }),
      })),
    guardrails: {
      max_spend_per_run: config.guardrails.maxSpendPerRun,
      require_approval: config.guardrails.requireApproval,
      rate_limit_per_hour: config.guardrails.rateLimitPerHour,
      max_runs_per_day: config.guardrails.maxRunsPerDay,
    },
    runtime: {
      gpu_tier: config.runpodConfig.gpuTier,
      min_workers: config.runpodConfig.minWorkers,
      max_workers: config.runpodConfig.maxWorkers,
      idle_timeout: config.runpodConfig.idleTimeout,
    },
  };

  return openclawConfig;
}
