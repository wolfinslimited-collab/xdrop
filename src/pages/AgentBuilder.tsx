import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Navigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const BUILDER_SYSTEM_PROMPTS: ChatMessage[] = [
  {
    role: 'assistant',
    content: `👋 Welcome to the **XDROP Agent Builder**!

Tell me what you want your AI agent to do, and I'll help you design, configure, and deploy it.

**Examples:**
• "Build me a freelance lead finder that messages clients on Upwork"
• "Create a crypto DCA bot with daily buying and stop-loss"
• "Make an e-commerce agent that handles customer support on Shopify"

What kind of agent do you want to build?`,
  },
];

const AgentBuilder = () => {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(BUILDER_SYSTEM_PROMPTS);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

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
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
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

      if (!assistantContent) {
        setMessages([...newMessages, { role: 'assistant', content: "I'm working on your agent design. Could you tell me more about the specific tasks and integrations you need?" }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <PageLayout>
      <SEOHead title="Agent Builder — XDROP" description="Build your AI agent with chat." canonicalPath="/builder" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px] flex flex-col">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Agent Builder</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Describe your goal → Get a deployable agent</p>
        </header>

        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' ? 'bg-primary/20' : 'bg-secondary'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-foreground" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
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
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-secondary rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
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
              className="rounded-full w-10 h-10 p-0 bg-gradient-cyber text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </PageLayout>
  );
};

export default AgentBuilder;
