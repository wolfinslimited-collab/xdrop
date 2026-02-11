import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, MessageSquare, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  name: string;
  updated_at: string;
  messages: unknown[];
  config?: unknown;
}

interface SessionHistoryProps {
  userId: string;
  currentSessionId: string | null;
  onSelectSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  open: boolean;
  onClose: () => void;
}

const SessionHistory = ({ userId, currentSessionId, onSelectSession, onDeleteSession, open, onClose }: SessionHistoryProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    const fetchSessions = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('builder_sessions')
        .select('id, name, updated_at, messages, config')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(50);
      setSessions((data as unknown as Session[]) || []);
      setLoading(false);
    };
    fetchSessions();
  }, [open, userId]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await supabase.from('builder_sessions').delete().eq('id', sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    onDeleteSession(sessionId);
  };

  const getPreview = (session: Session): string => {
    const msgs = session.messages as Array<{ role: string; content: string }>;
    const firstUser = msgs?.find(m => m.role === 'user');
    if (firstUser) return firstUser.content.slice(0, 80) + (firstUser.content.length > 80 ? '…' : '');
    return 'Empty session';
  };

  const getMsgCount = (session: Session): number => {
    return Array.isArray(session.messages) ? session.messages.length : 0;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-50 h-screen w-72 bg-background border-r border-border flex flex-col"
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">History</span>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No sessions yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start a conversation to see it here</p>
                </div>
              ) : (
                <div className="py-1">
                  {sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => { onSelectSession(session); onClose(); }}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group relative ${
                        session.id === currentSessionId ? 'bg-muted/60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {session.name || 'Untitled Agent'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {getPreview(session)}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-muted-foreground/60">
                              {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              · {getMsgCount(session)} msgs
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SessionHistory;
