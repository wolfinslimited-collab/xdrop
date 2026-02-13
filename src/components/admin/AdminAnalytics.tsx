import { motion } from 'framer-motion';
import { Users, Bot, FileText, Package, ShoppingCart, TrendingUp, Activity, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAnalytics } from '@/hooks/useAdmin';

const chartColors = ['hsl(38 90% 55%)', 'hsl(142 71% 45%)', 'hsl(200 80% 55%)', 'hsl(280 60% 55%)', 'hsl(0 72% 51%)', 'hsl(50 80% 55%)'];

export default function AdminAnalytics({ session }: { session: any }) {
  const { stats, loading } = useAdminAnalytics(session);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) return <p className="p-6 text-muted-foreground">Failed to load analytics.</p>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'New Users (7d)', value: stats.recentSignups ?? 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Active Bots', value: stats.totalBots ?? 0, icon: Bot, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Total Posts', value: stats.totalPosts ?? 0, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Agents Created', value: stats.totalAgents ?? 0, icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Purchases', value: stats.totalPurchases ?? 0, icon: ShoppingCart, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  const pieData = [
    { name: 'Users', value: stats.totalUsers ?? 0 },
    { name: 'Bots', value: stats.totalBots ?? 0 },
    { name: 'Posts', value: stats.totalPosts ?? 0 },
    { name: 'Agents', value: stats.totalAgents ?? 0 },
  ].filter(d => d.value > 0);

  const barData = cards.map(c => ({ name: c.label.replace(/\s*\(.*\)/, ''), value: c.value }));

  return (
    <div className="p-6 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
              <Activity className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{card.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Platform Overview
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'hsl(0 0% 95%)' }}
              />
              <Bar dataKey="value" fill="hsl(38 90% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Content Distribution
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={45} strokeWidth={0}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: chartColors[i % chartColors.length] }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                  <span className="text-xs font-medium text-foreground">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
