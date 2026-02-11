import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Plus, Settings2, X, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import { Navigate, useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import NavSidebar from '@/components/NavSidebar';
import MobileHeader from '@/components/MobileHeader';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import ConfigSidebar from '@/components/agent-builder/ConfigSidebar';

import { DEFAULT_CONFIG, type AgentConfig } from '@/types/agentBuilder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import openclawLogo from '@/assets/openclaw-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import OpenClawMascot from '@/components/agent-builder/OpenClawMascot';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_SUGGESTIONS = [
  'Build an OpenClaw crypto DCA bot with stop-loss on RunPod',
  'Create a lead gen agent using ClawhHub skills + Telegram',
  'Deploy a customer support bot on RunPod serverless',
  'Build a social media agent that auto-posts via OpenClaw',
];

const extractSuggestions = (content: string): string[] => {
  // Extract [suggest: text] tags from AI response
  const matches = content.match(/\[suggest:\s*([^\]]+)\]/g);
  if (!matches) return [];
  return matches
    .map(m => {
      const inner = m.match(/\[suggest:\s*([^\]]+)\]/);
      return inner ? inner[1].trim() : '';
    })
    .filter(Boolean)
    .slice(0, 4);
};

const stripSuggestionTags = (content: string): string => {
  return content.replace(/\[suggest:\s*[^\]]+\]/g, '').trim();
};

const AgentBuilder = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({ ...DEFAULT_CONFIG });
  const [showConfig, setShowConfig] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load most recent session on mount
  useEffect(() => {
    if (!user) return;
    const loadSession = async () => {
      const { data } = await supabase
        .from('builder_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setSessionId(data.id);
        setMessages((data.messages as unknown as ChatMessage[]) || []);
        try {
          const savedConfig = data.config as unknown as Partial<AgentConfig>;
          if (savedConfig && typeof savedConfig === 'object' && 'skills' in savedConfig) {
            setConfig({ ...DEFAULT_CONFIG, ...savedConfig });
          }
        } catch { /* use default */ }
      }
      setSessionLoaded(true);
    };
    loadSession();
  }, [user]);

  // Auto-save session (debounced)
  const saveSession = useCallback(async (msgs: ChatMessage[], cfg: AgentConfig, sid: string | null) => {
    if (!user || msgs.length === 0) return;
    const sessionData = {
      user_id: user.id,
      name: cfg.name || 'Untitled Agent',
      messages: msgs as unknown as import('@/integrations/supabase/types').Json,
      config: cfg as unknown as import('@/integrations/supabase/types').Json,
    };
    if (sid) {
      await supabase.from('builder_sessions').update(sessionData).eq('id', sid);
    } else {
      const { data } = await supabase.from('builder_sessions').insert(sessionData).select('id').single();
      if (data) setSessionId(data.id);
    }
  }, [user]);

  useEffect(() => {
    if (!sessionLoaded || messages.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveSession(messages, config, sessionId);
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [messages, config, sessionLoaded, sessionId, saveSession]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
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
      'read email': 'email-read', 'inbox': 'email-read', 'calendar': 'calendar',
      'crypto trad': 'crypto-trade', 'trading': 'crypto-trade',
      'dca': 'dca-bot', 'dollar.cost': 'dca-bot',
      'social media': 'social-post', 'post.*twitter': 'social-post', 'tweet': 'social-post',
      'lead gen': 'lead-gen', 'find.*lead': 'lead-gen', 'prospect': 'lead-gen',
      'customer support': 'customer-support', 'support ticket': 'customer-support',
      'file': 'file-management', 'browser': 'browser-automation',
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
        if (resp.status === 429) { toast({ title: 'Rate limited', description: 'Please wait and try again.', variant: 'destructive' }); throw new Error('Rate limited'); }
        if (resp.status === 402) { toast({ title: 'Credits required', description: 'Please add funds.', variant: 'destructive' }); throw new Error('Credits required'); }
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

      if (assistantContent) { parseConfigFromResponse(assistantContent); }
      else { setMessages([...newMessages, { role: 'assistant', content: "Could you tell me more about the specific tasks and integrations you need?" }]); }
    } catch (err) {
      if (!(err instanceof Error && (err.message === 'Rate limited' || err.message === 'Credits required'))) {
        setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
      }
    } finally { setIsStreaming(false); }
  };

  const handleDeploy = async () => {
    if (!config.name.trim()) { toast({ title: 'Name required', description: 'Give your agent a name before deploying.', variant: 'destructive' }); return; }
    setIsDeploying(true);
    try {
      const enabledSkills = config.skills.filter(s => s.enabled);
      const connectedIntegrations = config.integrations.filter(i => i.connected);
      const { data: agent, error: agentErr } = await supabase.from('agents').insert({ name: config.name, description: config.description || `AI agent with ${enabledSkills.length} skills`, creator_id: user.id, price: 0, status: 'active', short_description: config.description, required_integrations: connectedIntegrations.map(i => i.id) }).select().single();
      if (agentErr) throw agentErr;
      const { error: manifestErr } = await supabase.from('agent_manifests').insert([{ agent_id: agent.id, version: '1.0.0', workflow_steps: enabledSkills.map(s => ({ skill: s.id, config: s.config })) as unknown as import('@/integrations/supabase/types').Json, triggers: config.triggers as unknown as import('@/integrations/supabase/types').Json, guardrails: config.guardrails as unknown as import('@/integrations/supabase/types').Json, tool_permissions: connectedIntegrations.map(i => ({ integration: i.id })) as unknown as import('@/integrations/supabase/types').Json }]);
      if (manifestErr) throw manifestErr;
      toast({ title: 'Agent deployed', description: `${config.name} is now live.` });
      setMessages(prev => [...prev, { role: 'assistant', content: `**${config.name}** has been deployed successfully. You can monitor it from your Dashboard.` }]);
    } catch (err) { console.error('Deploy error:', err); toast({ title: 'Deploy failed', description: 'Something went wrong.', variant: 'destructive' }); }
    finally { setIsDeploying(false); }
  };

  const handleNewChat = () => { setMessages([]); setConfig({ ...DEFAULT_CONFIG }); setInput(''); setSessionId(null); };

  const hasMessages = messages.length > 0;

  const mdClasses = "prose prose-invert max-w-none text-sm leading-[1.7] [&>p]:my-2.5 [&>ul]:my-2.5 [&>ol]:my-2.5 [&>ul]:pl-5 [&>ol]:pl-5 [&_li]:my-1 [&_li]:leading-[1.65] [&_strong]:text-foreground [&_strong]:font-medium [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3.5 [&_pre]:my-3 [&>blockquote]:border-l-2 [&>blockquote]:border-muted-foreground/20 [&>blockquote]:pl-3 [&>blockquote]:my-3 [&>blockquote]:text-muted-foreground [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-5 [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mt-3 [&_h3]:mb-1 [&>ul]:list-disc [&>ol]:list-decimal [&_em]:text-muted-foreground";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <SEOHead title="Agent Builder — XDROP" description="Build and deploy AI agents." canonicalPath="/builder" />
      <MobileHeader />
      <div className="flex flex-1 w-full">
        {/* Chat panel — left side */}
        <div className={`flex flex-col h-screen ${isMobile ? 'w-full' : 'w-[462px] flex-shrink-0'} border-r border-border`}>
          {/* Chat header */}
          <header className="sticky top-0 z-20 bg-background border-b border-border h-12 flex items-center px-4">
            <button onClick={() => navigate('/home')} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground font-display flex-1">Clawdbot</span>
            <div className="flex items-center gap-1">
              {hasMessages && (
                <button onClick={handleNewChat} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-md hover:bg-muted transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              )}
              {isMobile && (
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className={`h-7 px-2 text-xs flex items-center gap-1 rounded-md transition-colors ${showConfig ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>

          {/* Chat content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
                  <div className="mb-5">
                    <OpenClawMascot size="lg" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground font-display mb-1">Build your OpenClaw agent</h2>
                  <p className="text-sm text-muted-foreground mb-1">Describe what you need — I'll configure skills, model, and RunPod deployment.</p>
                  <p className="text-[10px] text-muted-foreground/50 mb-8">Powered by OpenClaw · Deployed on RunPod</p>
                  <div className="flex flex-col gap-2 max-w-sm mx-auto">
                    {STARTER_SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="text-left px-3.5 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="py-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`px-4 py-2 ${msg.role === 'user' ? '' : 'bg-muted/30'}`}>
                    <div className="max-w-full">
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] text-sm text-foreground leading-relaxed">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 items-start">
                          <img src={claudeLogo} alt="Claude" className="w-6 h-6 rounded-full mt-1 flex-shrink-0" />
                          <div className={mdClasses}>
                            <ReactMarkdown>{stripSuggestionTags(msg.content)}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Suggestions */}
                {!isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (() => {
                  const suggestions = extractSuggestions(messages[messages.length - 1].content);
                  if (suggestions.length === 0) return null;
                  return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((s, idx) => (
                          <button key={idx} onClick={() => handleSend(s)} className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Typing */}
                {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                  <div className="px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className={`border-t border-border px-4 py-3 ${isMobile ? 'pb-20' : ''}`}>
            <div>
              <div className="relative flex items-end rounded-xl border border-border bg-muted/40 focus-within:border-muted-foreground/30 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Message Clawdbot..."
                  rows={1}
                  className="flex-1 bg-transparent py-3 pl-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[160px] leading-relaxed"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-1.5 bottom-1.5 w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
                Clawdbot may make mistakes. Review config before deploying.
              </p>
            </div>
          </div>
        </div>

        {/* Config panel — center/main area (hidden on mobile unless toggled) */}
        {isMobile ? (
          <AnimatePresence>
            {showConfig && (
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="fixed inset-0 z-50 bg-background"
              >
                <div className="h-screen overflow-y-auto">
                  <div className="flex items-center justify-between px-4 h-12 border-b border-border">
                    <span className="text-sm font-medium text-foreground">Config</span>
                    <button onClick={() => setShowConfig(false)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <ConfigSidebar config={config} onConfigChange={setConfig} onDeploy={handleDeploy} isDeploying={isDeploying} />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col h-screen overflow-y-auto">
            <ConfigSidebar config={config} onConfigChange={setConfig} onDeploy={handleDeploy} isDeploying={isDeploying} />
          </div>
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default AgentBuilder;
