import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, PanelRightOpen, PanelRightClose } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Navigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
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

const BUILDER_SYSTEM_PROMPTS: ChatMessage[] = [
  {
    role: 'assistant',
    content: `👋 Welcome to the **XDROP Agent Builder**!

Describe what you want your agent to do. I'll help configure its skills, integrations, triggers, and guardrails — then you can review and deploy.

**Examples:**
• "Build a freelance lead finder that messages clients on Upwork"
• "Create a crypto DCA bot with daily buying and stop-loss"
• "Make a customer support agent for my Shopify store"

Use the **config panel** on the right to manually pick skills and integrations, or just chat with me and I'll set it up.`,
  },
];

const AgentBuilder = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(BUILDER_SYSTEM_PROMPTS);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({ ...DEFAULT_CONFIG });
  const [showConfig, setShowConfig] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const parseConfigFromResponse = (content: string) => {
    // Try to extract agent config suggestions from AI response
    const nameMatch = content.match(/(?:agent name|name)[:\s]*["']?([^"'\n]+)["']?/i);
    if (nameMatch && !config.name) {
      setConfig(prev => ({ ...prev, name: nameMatch[1].trim() }));
    }

    // Auto-enable skills mentioned in response
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

    // Auto-connect integrations mentioned
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

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
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

  return (
    <PageLayout>
      <SEOHead title="Agent Builder — XDROP" description="Build and deploy AI agents with chat + visual config." canonicalPath="/builder" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[1100px] flex">
        {/* Chat Panel */}
        <div className={`flex flex-col ${showConfig ? 'w-1/2' : 'flex-1'} border-r border-border transition-all`}>
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <h1 className="text-lg font-bold text-foreground font-display">Agent Builder</h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConfig(!showConfig)}
                className="h-8 w-8"
              >
                {showConfig ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Chat to design • Config panel to customize</p>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'assistant' ? 'bg-accent/20' : 'bg-secondary'
                }`}>
                  {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-accent" /> : <User className="w-3.5 h-3.5 text-foreground" />}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}>
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5 [&>ul]:pl-4 [&>ol]:pl-4 [&>li]:my-0.5 [&_strong]:text-foreground [&_strong]:font-semibold [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&_code]:bg-background/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-background/50 [&_pre]:rounded-lg [&_pre]:p-3">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Describe your agent..."
                className="flex-1 bg-secondary rounded-full py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-all"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="rounded-full w-10 h-10 p-0 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Config Panel */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ConfigSidebar
                config={config}
                onConfigChange={setConfig}
                onDeploy={handleDeploy}
                isDeploying={isDeploying}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageLayout>
  );
};

export default AgentBuilder;
