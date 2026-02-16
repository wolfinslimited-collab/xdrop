import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Terminal, Settings2, Activity, Loader2,
  CheckCircle2, XCircle, AlertTriangle, Bot, User, Trash2,
  Square, RotateCcw, Pencil, Save, Plus, X, ChevronUp, ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import MobileBottomNav from '@/components/MobileBottomNav';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LogEntry {
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-chat`;

const logTypeStyles: Record<LogEntry['type'], string> = {
  info: 'text-muted-foreground',
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
};

const logTypeIcons: Record<LogEntry['type'], React.ReactNode> = {
  info: <Terminal className="w-3 h-3" />,
  success: <CheckCircle2 className="w-3 h-3" />,
  error: <XCircle className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
};

/* ─── Mobile Bottom Drawer ─── */
const MobileDrawer = ({
  rightTab, setRightTab, logs, setLogs, runs, agent, formatTime,
  isEditing, startEditing, setIsEditing,
  editName, setEditName, editDescription, setEditDescription,
  editIntegrations, setEditIntegrations, newIntegration, setNewIntegration,
  addIntegration, saveConfig, isSaving, isDeleting, setIsDeleting, navigate,
}: any) => {
  const [open, setOpen] = useState(false);

  const tabs = [
    { value: 'logs', label: 'Logs', icon: Terminal },
    { value: 'runs', label: 'Runs', icon: Activity },
    { value: 'config', label: 'Config', icon: Settings2 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-20"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div
        className="relative z-30 bg-background border-t border-border rounded-t-2xl"
        animate={{ height: open ? '65vh' : 48 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Handle bar + tab switcher */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-center py-2"
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-1" />
        </button>

        <div className="flex items-center px-2 gap-1">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => { setRightTab(t.value); if (!open) setOpen(true); }}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-colors ${
                rightTab === t.value
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
          <button onClick={() => setOpen(!open)} className="p-1.5 text-muted-foreground">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Content */}
        {open && (
          <div className="overflow-y-auto px-4 pt-2 pb-20" style={{ maxHeight: 'calc(65vh - 80px)' }}>
            {rightTab === 'logs' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Agent Logs</h3>
                  {logs.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="gap-1.5 text-xs text-muted-foreground">
                      <Trash2 className="w-3 h-3" /> Clear
                    </Button>
                  )}
                </div>
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Terminal className="w-8 h-8 mb-3 opacity-30" />
                    <p className="text-xs">No logs yet</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-background/80 p-2 space-y-1">
                    {logs.map((log: any, i: number) => (
                      <div key={i} className={`flex items-start gap-1.5 text-[11px] font-mono ${logTypeStyles[log.type]}`}>
                        <span className="flex-shrink-0 mt-px">{logTypeIcons[log.type]}</span>
                        <span className="text-muted-foreground/50 flex-shrink-0">{formatTime(log.timestamp)}</span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {rightTab === 'runs' && (
              <>
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Runs</h3>
                {runs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Activity className="w-8 h-8 mb-3 opacity-30" />
                    <p className="text-xs">No runs yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {runs.map((run: any) => (
                      <div key={run.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            run.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-primary/10 text-primary'
                          }`}>{run.status}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(run.created_at).toLocaleString()}
                          </span>
                        </div>
                        {run.earnings != null && (
                          <p className="text-xs text-muted-foreground mt-1">Earnings: {run.earnings} USDC</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {rightTab === 'config' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Configuration</h3>
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1.5 text-xs">
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-1 text-xs text-muted-foreground">Cancel</Button>
                      <Button size="sm" onClick={saveConfig} disabled={isSaving} className="gap-1.5 text-xs">
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-border bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Name</p>
                    {isEditing ? (
                      <Input value={editName} onChange={(e: any) => setEditName(e.target.value)} className="h-8 text-sm" />
                    ) : (
                      <p className="text-sm text-foreground font-medium">{agent.name}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm text-foreground">{agent.status}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Agent ID</p>
                    <p className="text-xs text-foreground font-mono">{agent.id}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const AgentEditor = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rightTab, setRightTab] = useState('logs');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'success', message: 'Agent deployed successfully', timestamp: new Date() },
    { type: 'info', message: 'Waiting for first interaction...', timestamp: new Date() },
  ]);

  // Runs state
  const [runs, setRuns] = useState<any[]>([]);
  const [agentStatus, setAgentStatus] = useState<'running' | 'stopped'>('running');

  // Config editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIntegrations, setEditIntegrations] = useState<string[]>([]);
  const [newIntegration, setNewIntegration] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    const fetchAgent = async () => {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
      setAgent(data);
      setLoading(false);

      const { data: runsData } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(20);
      setRuns(runsData || []);
    };
    fetchAgent();
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || !agent) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    setLogs(prev => [...prev, { type: 'info', message: `User message: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`, timestamp: new Date() }]);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          botName: agent.name,
          botHandle: agent.name?.toLowerCase().replace(/\s+/g, '_'),
          botBio: agent.description,
          botBadge: 'Agent',
          botAvatar: agent.avatar,
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Request failed (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: assistantId, role: 'assistant', content: assistantContent, timestamp: new Date() }];
              });
            }
          } catch { break; }
        }
      }

      setLogs(prev => [...prev, { type: 'success', message: `Agent responded (${assistantContent.length} chars)`, timestamp: new Date() }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: `⚡ Error: ${e.message}`, timestamp: new Date() }]);
      setLogs(prev => [...prev, { type: 'error', message: e.message, timestamp: new Date() }]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, agent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const startEditing = () => {
    setEditName(agent.name);
    setEditDescription(agent.description || '');
    setEditIntegrations(agent.required_integrations || []);
    setIsEditing(true);
  };

  const saveConfig = async () => {
    if (!editName.trim()) { toast.error('Name is required'); return; }
    setIsSaving(true);
    const { error } = await supabase
      .from('agents')
      .update({ name: editName.trim(), description: editDescription.trim(), required_integrations: editIntegrations })
      .eq('id', agent.id);
    if (error) { toast.error('Failed to save'); } else {
      setAgent({ ...agent, name: editName.trim(), description: editDescription.trim(), required_integrations: editIntegrations });
      setIsEditing(false);
      toast.success('Agent updated');
      setLogs(prev => [...prev, { type: 'success', message: 'Agent configuration updated', timestamp: new Date() }]);
    }
    setIsSaving(false);
  };

  const addIntegration = () => {
    const val = newIntegration.trim();
    if (val && !editIntegrations.includes(val)) {
      setEditIntegrations([...editIntegrations, val]);
      setNewIntegration('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">Agent not found</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {agent.avatar ? (
            <img src={agent.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">{agent.name}</h1>
            <p className="text-[10px] text-muted-foreground">
              {agentStatus === 'running' ? '🟢 Online' : '⚪ Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {agentStatus === 'running' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAgentStatus('stopped');
                setLogs(prev => [...prev, { type: 'warning', message: 'Agent stopped by user', timestamp: new Date() }]);
              }}
              className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAgentStatus('running');
                setLogs(prev => [...prev, { type: 'success', message: 'Agent restarted by user', timestamp: new Date() }]);
              }}
              className="gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </Button>
          )}
        </div>
      </header>

      {/* Split Layout: Chat left, Tabs right */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ─── Left: Chat Panel ─── */}
        <div className="flex-1 flex flex-col min-w-0 md:border-r md:border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Chat with {agent.name}</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Configure your agent, test responses, or ask it to perform tasks.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {['What can you do?', 'Show me your config', 'Run a test task'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary text-foreground rounded-bl-md'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_p]:leading-relaxed text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-foreground" />
                  </div>
                )}
              </motion.div>
            ))}

            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-md px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input - fixed at bottom */}
          <div className="flex-shrink-0 border-t border-border p-3 mb-20 md:mb-0 bg-background">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent.name}...`}
                rows={1}
                className="flex-1 bg-secondary rounded-xl px-3.5 py-2.5 text-sm text-foreground resize-none border border-border focus:border-foreground/20 focus:outline-none placeholder:text-muted-foreground/50 max-h-32"
                style={{ minHeight: '40px' }}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="rounded-xl h-10 w-10 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Right: Logs / Runs / Config Sidebar ─── */}
        <div className="hidden md:flex w-[380px] flex-shrink-0 flex-col">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
              {[
                { value: 'logs', label: 'Logs', icon: Terminal },
                { value: 'runs', label: 'Runs', icon: Activity },
                { value: 'config', label: 'Config', icon: Settings2 },
              ].map(t => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs py-2.5"
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ─── Logs ─── */}
            <TabsContent value="logs" className="flex-1 m-0 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Agent Logs</h3>
                {logs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="gap-1.5 text-xs text-muted-foreground">
                    <Trash2 className="w-3 h-3" /> Clear
                  </Button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Terminal className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-xs">No logs yet</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-background/80 p-2 space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-1.5 text-[11px] font-mono ${logTypeStyles[log.type]}`}>
                      <span className="flex-shrink-0 mt-px">{logTypeIcons[log.type]}</span>
                      <span className="text-muted-foreground/50 flex-shrink-0">{formatTime(log.timestamp)}</span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── Runs ─── */}
            <TabsContent value="runs" className="flex-1 m-0 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recent Runs</h3>
              {runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Activity className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-xs">No runs yet</p>
                  <p className="text-[10px] mt-1 opacity-60">Chat with your agent to trigger its first run</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {runs.map(run => (
                    <div key={run.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          run.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          'bg-primary/10 text-primary'
                        }`}>{run.status}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(run.created_at).toLocaleString()}
                        </span>
                      </div>
                      {run.earnings != null && (
                        <p className="text-xs text-muted-foreground mt-1">Earnings: {run.earnings} USDC</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── Config ─── */}
            <TabsContent value="config" className="flex-1 m-0 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Agent Configuration</h3>
                {!isEditing ? (
                  <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1.5 text-xs">
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-1 text-xs text-muted-foreground">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveConfig} disabled={isSaving} className="gap-1.5 text-xs">
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Name</p>
                  {isEditing ? (
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" placeholder="Agent name" />
                  ) : (
                    <p className="text-sm text-foreground font-medium">{agent.name}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                  {isEditing ? (
                    <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="text-sm min-h-[60px]" placeholder="Agent description" />
                  ) : (
                    <p className="text-sm text-foreground">{agent.description || '—'}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm text-foreground">{agent.status}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Agent ID</p>
                  <p className="text-xs text-foreground font-mono">{agent.id}</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Integrations</p>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {editIntegrations.map(i => (
                          <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                            {i}
                            <button onClick={() => setEditIntegrations(editIntegrations.filter(x => x !== i))} className="hover:text-destructive">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <Input
                          value={newIntegration}
                          onChange={e => setNewIntegration(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIntegration(); } }}
                          placeholder="Add integration..."
                          className="h-7 text-xs flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={addIntegration} className="h-7 px-2">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(agent.required_integrations?.length > 0) ? agent.required_integrations.map((i: string) => (
                        <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {i}
                        </span>
                      )) : <p className="text-xs text-muted-foreground">None</p>}
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm text-foreground">{new Date(agent.created_at).toLocaleString()}</p>
                </div>

                {/* Delete Agent */}
                <div className="pt-4 mt-4 border-t border-border">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Agent
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete "{agent.name}"?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          This will permanently delete this agent, all its runs, and configuration. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5"
                          onClick={async (e) => {
                            e.preventDefault();
                            setIsDeleting(true);
                            const { error } = await supabase.from('agents').delete().eq('id', agent.id);
                            if (error) {
                              toast.error('Failed to delete agent');
                              setIsDeleting(false);
                            } else {
                              toast.success('Agent deleted');
                              navigate('/builder');
                            }
                          }}
                        >
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile: collapsible bottom drawer */}
      <MobileDrawer
        rightTab={rightTab}
        setRightTab={setRightTab}
        logs={logs}
        setLogs={setLogs}
        runs={runs}
        agent={agent}
        formatTime={formatTime}
        isEditing={isEditing}
        startEditing={startEditing}
        setIsEditing={setIsEditing}
        editName={editName}
        setEditName={setEditName}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editIntegrations={editIntegrations}
        setEditIntegrations={setEditIntegrations}
        newIntegration={newIntegration}
        setNewIntegration={setNewIntegration}
        addIntegration={addIntegration}
        saveConfig={saveConfig}
        isSaving={isSaving}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        navigate={navigate}
      />

      <MobileBottomNav />
    </div>
  );
};

export default AgentEditor;
