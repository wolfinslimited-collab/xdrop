import { motion } from 'framer-motion';
import { Users, Bot, FileText, Package, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAnalytics } from '@/hooks/useAdmin';

export default function AdminAnalytics({ session }: { session: any }) {
  const { stats, loading } = useAdminAnalytics(session);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[320px] w-full rounded-xl" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return <p className="p-6 text-muted-foreground">Failed to load analytics.</p>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, trend: '+12%', up: true },
    { label: 'New Users (7d)', value: stats.recentSignups ?? 0, icon: TrendingUp, trend: '+8%', up: true },
    { label: 'Active Bots', value: stats.totalBots ?? 0, icon: Bot, trend: '+24%', up: true },
    { label: 'Total Posts', value: stats.totalPosts ?? 0, icon: FileText, trend: '+156', up: true },
    { label: 'Agents', value: stats.totalAgents ?? 0, icon: Package, trend: '+3', up: true },
    { label: 'Purchases', value: stats.totalPurchases ?? 0, icon: ShoppingCart, trend: '—', up: false },
  ];

  const pieData = [
    { name: 'Users', value: stats.totalUsers ?? 0 },
    { name: 'Bots', value: stats.totalBots ?? 0 },
    { name: 'Posts', value: stats.totalPosts ?? 0 },
    { name: 'Agents', value: stats.totalAgents ?? 0 },
  ].filter(d => d.value > 0);

  const pieColors = [
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(200 80% 55%)',
    'hsl(280 60% 55%)',
  ];

  const barData = cards.map(c => ({ name: c.label.replace(/\s*\(.*\)/, ''), value: c.value }));

  return (
    <div className="p-6 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card rounded-xl border border-border p-4 hover:border-border/80 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <card.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              {card.trend !== '—' && (
                <div className={`flex items-center gap-0.5 text-[10px] font-medium ${card.up ? 'text-success' : 'text-destructive'}`}>
                  {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.trend}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold font-display text-foreground tracking-tight">
              {card.value.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar chart - larger */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-3 bg-card rounded-xl border border-border p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold font-display text-foreground">Platform Overview</h3>
              <p className="text-[11px] text-muted-foreground">Key metrics distribution</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'hsl(0 0% 10%)' }}
                contentStyle={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: 10, fontSize: 12, padding: '8px 12px' }}
                labelStyle={{ color: 'hsl(0 0% 95%)', fontWeight: 600, marginBottom: 4 }}
              />
              <Bar dataKey="value" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
        >
          <div className="mb-5">
            <h3 className="text-sm font-semibold font-display text-foreground">Content Distribution</h3>
            <p className="text-[11px] text-muted-foreground">Breakdown by type</p>
          </div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50} strokeWidth={0} paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: 10, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                  <span className="text-[11px] text-muted-foreground">{d.name}</span>
                  <span className="text-[11px] font-semibold text-foreground">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
