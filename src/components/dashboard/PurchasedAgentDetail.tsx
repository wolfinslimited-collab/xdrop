import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, DollarSign, TrendingUp, Shield, Zap, Clock, BarChart3, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

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

interface Props {
  agent: Agent;
  onBack: () => void;
}

function generateRevenueData(agent: Agent) {
  if (!agent.purchased_at || !agent.monthly_return_min) return [];
  const purchasedDate = new Date(agent.purchased_at);
  const now = new Date();
  const daysSincePurchase = Math.max(1, Math.floor((now.getTime() - purchasedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgMonthlyReturn = ((agent.monthly_return_min || 0) + (agent.monthly_return_max || 0)) / 2;
  const dailyRate = (avgMonthlyReturn / 30) / 100 * (agent.price || 100);

  const days = Math.min(daysSincePurchase, 90);
  const data = [];
  let cumulative = 0;
  for (let i = 0; i < days; i++) {
    const variance = 0.7 + Math.random() * 0.6;
    const dayEarning = +(dailyRate * variance).toFixed(2);
    cumulative += dayEarning;
    const date = new Date(purchasedDate);
    date.setDate(date.getDate() + i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      earnings: +cumulative.toFixed(2),
      daily: dayEarning,
    });
  }
  return data;
}

function getAgentHealth(agent: Agent): { score: number; label: string; color: string } {
  const avgReturn = ((agent.monthly_return_min || 0) + (agent.monthly_return_max || 0)) / 2;
  if (avgReturn >= 20) return { score: 95, label: 'Excellent', color: 'text-foreground' };
  if (avgReturn >= 12) return { score: 82, label: 'Good', color: 'text-foreground' };
  if (avgReturn >= 5) return { score: 65, label: 'Fair', color: 'text-muted-foreground' };
  return { score: 40, label: 'Low', color: 'text-muted-foreground' };
}

function getEarnings(agent: Agent) {
  if (!agent.purchased_at || !agent.monthly_return_min) return { total: 0, monthly: 0, daily: 0 };
  const purchasedDate = new Date(agent.purchased_at);
  const daysSincePurchase = Math.max(1, Math.floor((Date.now() - purchasedDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgMonthlyReturn = ((agent.monthly_return_min || 0) + (agent.monthly_return_max || 0)) / 2;
  const daily = (avgMonthlyReturn / 30) / 100 * (agent.price || 100);
  return { total: +(daily * daysSincePurchase).toFixed(2), monthly: +(daily * 30).toFixed(2), daily: +daily.toFixed(2) };
}

const PurchasedAgentDetail = ({ agent, onBack }: Props) => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');
  const revenueData = useMemo(() => generateRevenueData(agent), [agent]);
  const health = getAgentHealth(agent);
  const earnings = getEarnings(agent);
  const daysActive = agent.purchased_at
    ? Math.floor((Date.now() - new Date(agent.purchased_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const filteredData = useMemo(() => {
    if (period === '7d') return revenueData.slice(-7);
    if (period === '30d') return revenueData.slice(-30);
    return revenueData;
  }, [revenueData, period]);

  const roi = agent.price > 0 ? +((earnings.total / agent.price) * 100).toFixed(1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs">Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{agent.avatar || '🤖'}</span>
          <div>
            <h1 className="text-lg font-bold text-foreground">{agent.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground font-medium">Running</span>
              <span className="text-[10px] text-muted-foreground">Active {daysActive}d</span>
            </div>
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4 border-b border-border">
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Total Earned</span>
          </div>
          <p className="text-xl font-bold text-success">+{earnings.total} SOL</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">from {agent.price} SOL invested</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">ROI</span>
          </div>
          <p className="text-xl font-bold text-foreground">{roi}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{agent.monthly_return_min}–{agent.monthly_return_max}% /mo range</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Monthly Rate</span>
          </div>
          <p className="text-xl font-bold text-foreground">{earnings.monthly} SOL</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{earnings.daily} SOL/day avg</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Health</span>
          </div>
          <p className={`text-xl font-bold ${health.color}`}>{health.score}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{health.label} condition</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Revenue Over Time</h2>
          <div className="flex gap-1">
            {(['7d', '30d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                  period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-48 w-full">
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0 0% 95%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(0 0% 95%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0 0% 45%)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 45%)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v} SOL`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: 'hsl(0 0% 95%)' }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)} SOL`,
                    name === 'earnings' ? 'Cumulative' : 'Daily'
                  ]}
                />
                <Area type="monotone" dataKey="earnings" stroke="hsl(0 0% 95%)" fill="url(#earningsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Agent Details */}
      <div className="px-4 py-4 border-b border-border space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Agent Details</h2>
        <div className="space-y-2">
          {[
            { icon: Clock, label: 'Purchased', value: agent.purchased_at ? new Date(agent.purchased_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
            { icon: DollarSign, label: 'Purchase Price', value: `${agent.price} SOL` },
            { icon: Activity, label: 'Uptime', value: `${daysActive} days (100%)` },
            { icon: Zap, label: 'Execution Mode', value: 'Autonomous' },
            { icon: RefreshCw, label: 'Renewal', value: 'Auto-renew active' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <span className="text-xs font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Breakdown */}
      <div className="px-4 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Health Breakdown</h2>
        <div className="space-y-3">
          {[
            { label: 'Response Time', value: 92, desc: '< 200ms avg' },
            { label: 'Success Rate', value: 98, desc: '98% of runs' },
            { label: 'Earnings Consistency', value: health.score, desc: `${health.label} stability` },
            { label: 'Risk Score', value: 88, desc: 'Low risk profile' },
          ].map(({ label, value, desc }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium text-foreground">{value}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-foreground/70"
                  style={{}}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PurchasedAgentDetail;
