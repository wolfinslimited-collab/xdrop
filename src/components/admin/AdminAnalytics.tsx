import { motion } from 'framer-motion';
import { Users, Bot, FileText, Package, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Repeat, Target, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAnalytics } from '@/hooks/useAdmin';

export default function AdminAnalytics({ session }: { session: any }) {
  const { stats, loading } = useAdminAnalytics(session);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-[120px] w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="p-6 text-muted-foreground">Failed to load analytics.</p>;

  const platformCards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, format: 'number' },
    { label: 'New Users (7d)', value: stats.recentSignups ?? 0, icon: TrendingUp, format: 'number' },
    { label: 'Active Bots', value: stats.totalBots ?? 0, icon: Bot, format: 'number' },
    { label: 'Total Posts', value: stats.totalPosts ?? 0, icon: FileText, format: 'number' },
    { label: 'Agents', value: stats.totalAgents ?? 0, icon: Package, format: 'number' },
  ];

  const revenueCards = [
    { label: 'Total Revenue', value: stats.totalRevenue ?? 0, icon: DollarSign, format: 'usd', accent: true },
    { label: 'Purchases', value: stats.totalPurchases ?? 0, icon: ShoppingCart, format: 'number' },
    { label: 'Avg Purchase', value: stats.avgPurchaseValue ?? 0, icon: BarChart3, format: 'usd' },
    { label: 'Trials Started', value: stats.totalTrials ?? 0, icon: Target, format: 'number' },
    { label: 'Conversion Rate', value: stats.conversionRate ?? 0, icon: Repeat, format: 'percent' },
  ];

  const formatValue = (val: number, format: string) => {
    if (format === 'usd') return `$${val.toLocaleString()}`;
    if (format === 'percent') return `${val}%`;
    return val.toLocaleString();
  };

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

  const barData = platformCards.map(c => ({ name: c.label.replace(/\s*\(.*\)/, ''), value: c.value }));

  const conversionData = [
    { name: 'Trials', value: stats.totalTrials ?? 0 },
    { name: 'Converted', value: stats.convertedTrials ?? 0 },
    { name: 'Purchases', value: stats.totalPurchases ?? 0 },
  ];

  const renderCard = (card: any, i: number) => (
    <motion.div
      key={card.label}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className={`rounded-xl border p-4 transition-colors group ${
        card.accent
          ? 'bg-accent/10 border-accent/30 hover:border-accent/50'
          : 'bg-card border-border hover:border-border/80'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          card.accent ? 'bg-accent/20' : 'bg-secondary'
        }`}>
          <card.icon className={`w-4 h-4 ${card.accent ? 'text-accent' : 'text-muted-foreground'}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold font-display tracking-tight ${
        card.accent ? 'text-accent' : 'text-foreground'
      }`}>
        {formatValue(card.value, card.format)}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
    </motion.div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Platform Stats */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platform</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {platformCards.map((card, i) => renderCard(card, i))}
        </div>
      </div>

      {/* Revenue & Conversion */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Revenue & Conversions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {revenueCards.map((card, i) => renderCard(card, i + platformCards.length))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-3 bg-card rounded-xl border border-border p-5"
        >
          <div className="mb-5">
            <h3 className="text-sm font-semibold font-display text-foreground">Platform Overview</h3>
            <p className="text-[11px] text-muted-foreground">Key metrics distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
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

        {/* Conversion funnel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
        >
          <div className="mb-5">
            <h3 className="text-sm font-semibold font-display text-foreground">Trial → Purchase Funnel</h3>
            <p className="text-[11px] text-muted-foreground">{stats.conversionRate ?? 0}% conversion rate</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={conversionData} layout="vertical" barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(0 0% 45%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(0 0% 45%)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                cursor={{ fill: 'hsl(0 0% 10%)' }}
                contentStyle={{ background: 'hsl(0 0% 7%)', border: '1px solid hsl(0 0% 14%)', borderRadius: 10, fontSize: 12, padding: '8px 12px' }}
              />
              <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
        >
          <div className="mb-5">
            <h3 className="text-sm font-semibold font-display text-foreground">Content Distribution</h3>
            <p className="text-[11px] text-muted-foreground">Breakdown by type</p>
          </div>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={48} strokeWidth={0} paddingAngle={3}>
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
