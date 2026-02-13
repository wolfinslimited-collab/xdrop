import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Clock, TrendingDown, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { CreditTransaction } from '@/hooks/useCredits';

interface DailyUsage {
  date: string;
  credits: number;
  runs: number;
}

const ComputeUsage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('credit_transactions')
        .select('id, amount, balance_after, type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      setTransactions((data as CreditTransaction[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Filter compute-related transactions
  const computeTx = useMemo(
    () => transactions.filter(t => ['agent_run', 'agent_creation', 'compute'].includes(t.type) || t.description?.toLowerCase().includes('agent') || t.description?.toLowerCase().includes('run') || t.description?.toLowerCase().includes('compute')),
    [transactions]
  );

  // Build daily usage chart data (last 30 days)
  const chartData = useMemo(() => {
    const now = new Date();
    const days: DailyUsage[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, credits: 0, runs: 0 });
    }
    const dayMap = new Map(days.map(d => [d.date, d]));

    computeTx.forEach(tx => {
      const key = tx.created_at.slice(0, 10);
      const entry = dayMap.get(key);
      if (entry && tx.amount < 0) {
        entry.credits += Math.abs(tx.amount);
        entry.runs += 1;
      }
    });

    return days;
  }, [computeTx]);

  // Summary stats
  const totalSpent = computeTx.reduce((s, t) => s + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
  const totalRuns = computeTx.filter(t => t.amount < 0).length;
  const last7 = computeTx.filter(t => {
    const d = new Date(t.created_at);
    return d > new Date(Date.now() - 7 * 86400000) && t.amount < 0;
  });
  const weeklySpent = last7.reduce((s, t) => s + Math.abs(t.amount), 0);
  const avgPerRun = totalRuns > 0 ? (totalSpent / totalRuns).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Zap, label: 'Total Spent', value: `${totalSpent}`, sub: 'credits' },
          { icon: Activity, label: 'Total Runs', value: `${totalRuns}`, sub: 'executions' },
          { icon: Clock, label: 'This Week', value: `${weeklySpent}`, sub: 'credits' },
          { icon: TrendingDown, label: 'Avg / Run', value: avgPerRun, sub: 'credits' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <stat.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold text-foreground font-mono">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label} · {stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Usage Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Credit Usage</h3>
            <p className="text-[10px] text-muted-foreground">Last 30 days</p>
          </div>
          <Cpu className="w-4 h-4 text-muted-foreground" />
        </div>

        {totalSpent === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Cpu className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No compute usage yet</p>
            <p className="text-[10px] mt-1">Deploy an agent to see usage data here</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="creditGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                interval={6}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                formatter={(value: number, name: string) => [value, name === 'credits' ? 'Credits Used' : 'Runs']}
              />
              <Area
                type="monotone"
                dataKey="credits"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#creditGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Recent Compute Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Compute Activity</h3>
        </div>
        {computeTx.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No compute transactions yet</div>
        ) : (
          <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
            {computeTx.slice(0, 20).map((tx) => (
              <div key={tx.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-mono font-semibold shrink-0 ${tx.amount < 0 ? 'text-foreground' : 'text-primary'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ComputeUsage;
