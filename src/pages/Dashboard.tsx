import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, DollarSign, Zap, Play, Pause, CheckCircle, XCircle, Clock, Bot, Plus } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Agent {
  id: string;
  name: string;
  avatar: string | null;
  status: string;
  total_runs: number | null;
  total_earnings: number | null;
  created_at: string;
}

interface AgentRun {
  id: string;
  status: string;
  earnings: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  metrics: Record<string, any>;
  agents?: { name: string; avatar: string } | null;
}

const statusIcons: Record<string, any> = {
  running: Play,
  completed: CheckCircle,
  failed: XCircle,
  paused: Pause,
  pending: Clock,
};

const statusColors: Record<string, string> = {
  running: 'text-primary',
  completed: 'text-green-500',
  failed: 'text-destructive',
  paused: 'text-accent',
  pending: 'text-muted-foreground',
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRuns = async () => {
      const { data } = await supabase
        .from('agent_runs')
        .select('*, agents:agent_id(name, avatar)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setRuns(data as any);
      setLoadingRuns(false);
    };
    const fetchAgents = async () => {
      const { data } = await supabase
        .from('agents')
        .select('id, name, avatar, status, total_runs, total_earnings, created_at')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setAgents(data as Agent[]);
      setLoadingAgents(false);
    };
    fetchRuns();
    fetchAgents();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const totalEarnings = runs.reduce((sum, r) => sum + (r.earnings || 0), 0);
  const activeRuns = runs.filter((r) => r.status === 'running').length;
  const completedRuns = runs.filter((r) => r.status === 'completed').length;

  return (
    <PageLayout>
      <SEOHead title="Dashboard — XDROP" description="Monitor your AI agents." canonicalPath="/dashboard" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor your agent runs</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-4 py-4 border-b border-border">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">${totalEarnings.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Total Earnings</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{activeRuns}</p>
            <p className="text-[10px] text-muted-foreground">Active Runs</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{completedRuns}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* My Agents */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">My Agents</h2>
            <Link to="/builder" className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Create
            </Link>
          </div>
          {loadingAgents ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No agents yet.</p>
              <Link to="/builder" className="text-xs text-primary hover:underline mt-1 inline-block">Create your first agent →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              {agents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card rounded-xl border border-border p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{agent.avatar || '🤖'}</span>
                    <span className="text-sm font-semibold text-foreground truncate">{agent.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${
                      agent.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {agent.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{agent.total_runs || 0} runs</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Runs */}
        <div className="divide-y divide-border">
          {loadingRuns ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-20">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No runs yet. Deploy an agent to get started!</p>
            </div>
          ) : (
            runs.map((run, i) => {
              const StatusIcon = statusIcons[run.status] || Clock;
              return (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-4 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">
                      {run.agents?.avatar || '🤖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {run.agents?.name || 'Agent'}
                        </span>
                        <StatusIcon className={`w-4 h-4 ${statusColors[run.status]}`} />
                        <span className={`text-xs capitalize ${statusColors[run.status]}`}>{run.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {run.started_at ? new Date(run.started_at).toLocaleDateString() : new Date(run.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {run.earnings > 0 && (
                      <span className="text-sm font-bold text-green-500">+${run.earnings.toFixed(2)}</span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </PageLayout>
  );
};

export default Dashboard;
