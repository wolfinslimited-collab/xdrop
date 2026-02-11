import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, Loader2, PanelRightOpen, PanelRightClose, Plus, ArrowUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import { Navigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import NavSidebar from '@/components/NavSidebar';
import MobileHeader from '@/components/MobileHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ConfigSidebar from '@/components/agent-builder/ConfigSidebar';

import { DEFAULT_CONFIG, type AgentConfig } from '@/types/agentBuilder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_SUGGESTIONS = [
  { label: '🔍 Lead Finder', message: 'Build a freelance lead finder that messages clients on Upwork' },
  { label: '📈 DCA Bot', message: 'Create a crypto DCA bot with daily buying and stop-loss' },
  { label: '🛍️ Support Agent', message: 'Make a customer support agent for my Shopify store' },
  { label: '📱 Social Bot', message: 'Build a social media bot that auto-posts on Twitter and Instagram' },
];

const extractSuggestions = (content: string): string[] => {
  const suggestions: string[] = [];
  const bulletMatches = content.match(/[•\-]\s*"([^"]+)"/g);
  if (bulletMatches) {
    bulletMatches.forEach(m => {
      const inner = m.match(/"([^"]+)"/);
      if (inner) suggestions.push(inner[1]);
    });
  }
  if (suggestions.length === 0) {
    const plainBullets = content.match(/[•\-]\s+(.{10,80})$/gm);
    if (plainBullets && plainBullets.length <= 6) {
      plainBullets.forEach(m => {
        const text = m.replace(/^[•\-]\s+/, '').replace(/\*\*/g, '').trim();
        if (text.length > 5 && text.length < 100) suggestions.push(text);
      });
    }
  }
  return suggestions.slice(0, 4);
};

const TypingIndicator = () => (
  <div className="flex gap-3 max-w-3xl mx-auto w-full">
    <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5 border border-accent/20">
      <Bot className="w-3.5 h-3.5 text-accent" />
    </div>
    <div className="flex items-center gap-1.5 pt-2">
      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
    </div>
  </div>
);

const AgentBuilder = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({ ...DEFAULT_CONFIG });
  const [showConfig, setShowConfig] = useState(!isMobile);
  const [isDeploying, setIsDeploying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const parseConfigFromResponse = (content: string) => {
    const nameMatch = content.match(/(?:agent name|name)[:\s]*["']?([^"'\n]+)["']?/i);
    if (nameMatch && !config.name) {
      setConfig(prev => ({ ...prev, name: nameMatch[1].trim() }));
    }

    const skillKeywords: Record<string, string> = {
      'web scraping': 'web-scraping', 'scrape': 'web-scraping', 'scraping': 'web-scraping',
      'send email': 'email-send', 'email sending': 'email-send',
      'read email': 'email-read', 'inbox': 'email-read',
      'calendar': 'calendar',
      'crypto trad': 'crypto-trade', 'trading': 'crypto-trade', 'buy.*sell': 'crypto-trade',
      'dca': 'dca-bot', 'dollar.cost': 'dca-bot',
      'social media': 'social-post', 'post.*twitter': 'social-post', 'tweet': 'social-post',
      'lead gen': 'lead-gen', 'find.*lead': 'lead-gen', 'prospect': 'lead-gen',
      'customer support': 'customer-support', 'support ticket': 'customer-support',
      'file': 'file-management',
      'browser': 'browser-automation', 'automate.*browser': 'browser-automation',
      'data analysis': 'data-analysis', 'analyze.*data': 'data-analysis',
    };

    const lower = content.toLowerCase();
    setConfig(prev => ({
      ...prev,
      skills: prev.skills.map(skill => {
        const shouldEnable = Object.entries(skillKeywords).some(
          ([keyword, id]) => id === skill.id && new RegExp(keyword, 'i').test(lower)
        );
        return shouldEnable ? { ...skill, enabled: true } : skill;
      }),
    }));

    const integKeywords: Record<string, string> = {
      'telegram': 'telegram', 'discord': 'discord', 'twitter': 'twitter',
      'shopify': 'shopify', 'gmail': 'gmail', 'slack': 'slack',
      'notion': 'notion', 'github': 'github',
    };

    setConfig(prev => ({
      ...prev,
      integrations: prev.integrations.map(integ => {
        const shouldConnect = Object.entries(integKeywords).some(
          ([keyword, id]) => id === integ.id && lower.includes(keyword)
        );
        return shouldConnect ? { ...integ, connected: true } : integ;
      }),
    }));
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || isStreaming) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-builder`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages, currentConfig: config }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast({ title: 'Rate limited', description: 'Please wait a moment and try again.', variant: 'destructive' });
          throw new Error('Rate limited');
        }
        if (resp.status === 402) {
          toast({ title: 'Credits required', description: 'Please add funds to continue.', variant: 'destructive' });
          throw new Error('Credits required');
        }
        throw new Error('Failed to start stream');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
            }
          } catch { /* partial */ }
        }
      }

      if (assistantContent) {
        parseConfigFromResponse(assistantContent);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: "I'm working on your agent design. Could you tell me more about the specific tasks and integrations you need?" }]);
      }
    } catch (err) {
      if (!(err instanceof Error && (err.message === 'Rate limited' || err.message === 'Credits required'))) {
        setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDeploy = async () => {
    if (!config.name.trim()) {
      toast({ title: 'Name required', description: 'Give your agent a name before deploying.', variant: 'destructive' });
      return;
    }
    setIsDeploying(true);
    try {
      const enabledSkills = config.skills.filter(s => s.enabled);
      const connectedIntegrations = config.integrations.filter(i => i.connected);

      const { data: agent, error: agentErr } = await supabase
        .from('agents')
        .insert({
          name: config.name,
          description: config.description || `AI agent with ${enabledSkills.length} skills`,
          creator_id: user.id,
          price: 0,
          status: 'active',
          short_description: config.description,
          required_integrations: connectedIntegrations.map(i => i.id),
        })
        .select()
        .single();

      if (agentErr) throw agentErr;

      const { error: manifestErr } = await supabase
        .from('agent_manifests')
        .insert([{
          agent_id: agent.id,
          version: '1.0.0',
          workflow_steps: enabledSkills.map(s => ({ skill: s.id, config: s.config })) as unknown as import('@/integrations/supabase/types').Json,
          triggers: config.triggers as unknown as import('@/integrations/supabase/types').Json,
          guardrails: config.guardrails as unknown as import('@/integrations/supabase/types').Json,
          tool_permissions: connectedIntegrations.map(i => ({ integration: i.id })) as unknown as import('@/integrations/supabase/types').Json,
        }]);

      if (manifestErr) throw manifestErr;

      toast({ title: '🚀 Agent deployed!', description: `${config.name} is now live.` });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🚀 **${config.name}** has been deployed successfully!\n\nYour agent is now live with ${enabledSkills.length} skills and ${connectedIntegrations.length} integrations. You can monitor it from your **Dashboard**.`,
      }]);
    } catch (err) {
      console.error('Deploy error:', err);
      toast({ title: 'Deploy failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConfig({ ...DEFAULT_CONFIG });
    setInput('');
  };

  const hasMessages = messages.length > 0;
  const enabledSkills = config.skills.filter(s => s.enabled).length;
  const connectedIntegrations = config.integrations.filter(i => i.connected).length;

  const mdClasses = "prose prose-invert max-w-none text-[15px] leading-[1.75] [&>p]:my-3 [&>ul]:my-3 [&>ol]:my-3 [&>ul]:pl-6 [&>ol]:pl-6 [&_li]:my-1.5 [&_li]:leading-[1.7] [&_strong]:text-foreground [&_strong]:font-semibold [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_code]:border [&_code]:border-border [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:border [&_pre]:border-border [&_pre]:my-4 [&>blockquote]:border-l-2 [&>blockquote]:border-accent/40 [&>blockquote]:pl-4 [&>blockquote]:my-4 [&>blockquote]:text-muted-foreground [&>blockquote]:italic [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1.5 [&_hr]:my-5 [&_hr]:border-border [&>ul]:list-disc [&>ol]:list-decimal [&_ul_ul]:pl-5 [&_ul_ul]:my-1.5 [&_em]:text-muted-foreground";

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <SEOHead title="Agent Builder — XDROP" description="Build and deploy AI agents with chat + visual config." canonicalPath="/builder" />
      <MobileHeader />
      <div className="flex flex-1 w-full">
        <nav aria-label="Main navigation">
          <NavSidebar />
        </nav>

        {/* Chat Panel - full left side */}
        <div className="flex-1 flex flex-col min-h-screen relative">
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border h-14 flex items-center px-4 gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center border border-accent/20">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground font-display leading-none">Clawdbot</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Agent Builder</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {hasMessages && (
                <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-xs gap-1.5 text-muted-foreground hover:text-foreground h-8">
                  <Plus className="w-3.5 h-3.5" />
                  New
                </Button>
              )}
              {(enabledSkills > 0 || connectedIntegrations > 0) && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] text-accent">
                  <Sparkles className="w-3 h-3" />
                  {enabledSkills}s · {connectedIntegrations}i
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfig(!showConfig)}
                className="text-xs gap-1.5 text-muted-foreground hover:text-foreground h-8"
              >
                {showConfig ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                <span className="hidden sm:inline">{showConfig ? 'Hide' : 'Config'}</span>
              </Button>
            </div>
          </header>

          {/* Chat body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {!hasMessages ? (
              /* Welcome / empty state */
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center max-w-lg"
                >
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                    <Bot className="w-8 h-8 text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground font-display mb-2">What agent do you want to build?</h2>
                  <p className="text-muted-foreground text-sm mb-8">
                    Describe your idea and I'll configure the skills, integrations, triggers & guardrails for you.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto">
                    {STARTER_SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        onClick={() => handleSend(s.message)}
                        className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary hover:border-accent/30 transition-all group"
                      >
                        <span className="text-sm text-foreground group-hover:text-foreground">{s.label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.message}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Messages */
              <div className="py-6 space-y-6">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`px-4 ${msg.role === 'user' ? '' : ''}`}
                  >
                    <div className={`max-w-3xl mx-auto ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                      {msg.role === 'user' ? (
                        <div className="max-w-[85%] bg-secondary rounded-2xl rounded-br-md px-4 py-3 text-[15px] text-foreground leading-relaxed">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-1 border border-accent/20">
                            <Bot className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <div className={`flex-1 min-w-0 ${mdClasses}`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Suggestion chips */}
                {!isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (() => {
                  const suggestions = extractSuggestions(messages[messages.length - 1].content);
                  if (suggestions.length === 0) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="max-w-3xl mx-auto px-4 pl-14"
                    >
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(s)}
                            className="px-3.5 py-2 text-[13px] rounded-xl border border-border bg-card text-foreground hover:bg-secondary hover:border-accent/30 transition-all cursor-pointer text-left leading-snug"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Typing indicator */}
                {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                  <div className="px-4">
                    <TypingIndicator />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className={`border-t border-border bg-background px-4 py-3 ${isMobile ? 'pb-20' : ''}`}>
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end bg-secondary rounded-2xl border border-border focus-within:border-accent/40 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe your agent..."
                  rows={1}
                  className="flex-1 bg-transparent py-3.5 pl-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[200px] leading-relaxed"
                  style={{ minHeight: '48px' }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 transition-all"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Clawdbot can make mistakes. Review your agent config before deploying.
              </p>
            </div>
          </div>
        </div>

        {/* Config Panel - right side */}
        <AnimatePresence>
          {showConfig && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? '100%' : 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className={`border-l border-border bg-background overflow-hidden flex-shrink-0 ${isMobile ? 'fixed inset-0 z-50' : 'relative'}`}
            >
              <div className="h-screen overflow-y-auto flex flex-col">
                {isMobile && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Agent Config</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)} className="h-8 w-8 p-0">
                      <PanelRightClose className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <ConfigSidebar
                  config={config}
                  onConfigChange={setConfig}
                  onDeploy={handleDeploy}
                  isDeploying={isDeploying}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default AgentBuilder;
