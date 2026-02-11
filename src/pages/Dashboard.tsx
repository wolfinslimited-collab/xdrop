import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, DollarSign, Zap, Play, Pause, CheckCircle, XCircle, Clock, Bot, Plus } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PurchasedAgentDetail from '@/components/dashboard/PurchasedAgentDetail';

interface Agent {
  id: string;
  name: string;
  avatar: string | null;
  status: string;
  total_runs: number | null;
  total_earnings: number | null;
  created_at: string;
  template_id: string | null;
  monthly_return_min: number | null;
  monthly_return_max: number | null;
  purchased_at: string | null;
  usdc_earnings: number | null;
  price: number;
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

function getSimulatedEarnings(agent: Agent): { total: number; monthly: number; dailyRate: number } {
  if (!agent.purchased_at || !agent.monthly_return_min) return { total: 0, monthly: 0, dailyRate: 0 };
  const purchasedDate = new Date(agent.purchased_at);
  const now = new Date();
  const daysSincePurchase = Math.max(1, Math.floor((now.getTime() - purchasedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgMonthlyReturn = ((agent.monthly_return_min || 0) + (agent.monthly_return_max || 0)) / 2;
  const dailyRate = (avgMonthlyReturn / 30) / 100 * (agent.price || 100);
  const total = +(dailyRate * daysSincePurchase).toFixed(2);
  const monthly = +(dailyRate * 30).toFixed(2);
  return { total, monthly, dailyRate: +dailyRate.toFixed(2) };
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

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
        .select('id, name, avatar, status, total_runs, total_earnings, created_at, template_id, monthly_return_min, monthly_return_max, purchased_at, usdc_earnings, price')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setAgents(data as any);
      setLoadingAgents(false);
    };
    fetchRuns();
    fetchAgents();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  if (selectedAgent) {
    return (
      <PageLayout>
        <SEOHead title={`${selectedAgent.name} — XDROP`} description="Agent details" canonicalPath="/dashboard" />
        <PurchasedAgentDetail agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
      </PageLayout>
    );
  }
  const purchasedAgents = agents.filter(a => a.template_id);
  const customAgents = agents.filter(a => !a.template_id);
  const totalSimulatedEarnings = purchasedAgents.reduce((sum, a) => sum + getSimulatedEarnings(a).total, 0);
  const totalRealEarnings = runs.reduce((sum, r) => sum + (r.earnings || 0), 0);
  const activeRuns = runs.filter((r) => r.status === 'running').length;
  const completedRuns = runs.filter((r) => r.status === 'completed').length;

  return (
    <PageLayout>
      <SEOHead title="Dashboard — XDROP" description="Monitor your AI agents." canonicalPath="/dashboard" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor your agent runs & earnings</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-4 py-4 border-b border-border">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">${(totalSimulatedEarnings + totalRealEarnings).toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Total Earnings</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{purchasedAgents.length + activeRuns}</p>
            <p className="text-[10px] text-muted-foreground">Active Agents</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{completedRuns}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Purchased Agents (from Marketplace) */}
        {purchasedAgents.length > 0 && (
          <div className="border-b border-border">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Purchased Agents</h2>
              <Link to="/marketplace" className="text-xs text-primary hover:underline">Browse More →</Link>
            </div>
            <div className="space-y-3 px-4 pb-4">
              {purchasedAgents.map((agent, i) => {
                const earnings = getSimulatedEarnings(agent);
                const daysActive = agent.purchased_at
                  ? Math.floor((Date.now() - new Date(agent.purchased_at).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{agent.avatar || '🤖'}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                          <p className="text-[10px] text-muted-foreground">Active for {daysActive} days</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">
                        Running
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-secondary rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-green-500">+${earnings.total}</p>
                        <p className="text-[9px] text-muted-foreground">Total Earned</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-foreground">${earnings.monthly}/mo</p>
                        <p className="text-[9px] text-muted-foreground">Monthly Rate</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-foreground">{agent.monthly_return_min}–{agent.monthly_return_max}%</p>
                        <p className="text-[9px] text-muted-foreground">ROI Range</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* My Custom Agents */}
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
          ) : customAgents.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No custom agents yet.</p>
              <Link to="/builder" className="text-xs text-primary hover:underline mt-1 inline-block">Create your first agent →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              {customAgents.map((agent, i) => (
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
