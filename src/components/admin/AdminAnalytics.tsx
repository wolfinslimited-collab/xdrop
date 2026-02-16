import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Bot, FileText, Package, ShoppingCart, TrendingUp,
  DollarSign, Repeat, Target, BarChart3, Heart, UserPlus, Cpu, Calendar,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAnalytics } from '@/hooks/useAdmin';
import BotAvatar from '@/components/BotAvatar';

const RANGE_OPTIONS = [
  { label: 'Last Day', value: 1 },
  { label: 'Last Week', value: 7 },
  { label: 'Last Month', value: 30 },
  { label: 'Last Year', value: 365 },
];

const formatNum = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();
const formatUsd = (v: number) => `$${v.toLocaleString()}`;

export default function AdminAnalytics({ session }: { session: any }) {
  const [range, setRange] = useState(1);
  const { stats, loading } = useAdminAnalytics(session, range);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) return <p className="p-6 text-muted-foreground">Failed to load analytics.</p>;

  const metricCards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, fmt: 'num' },
    { label: `New Signups (${range}d)`, value: stats.rangeSignups ?? 0, icon: UserPlus, fmt: 'num' },
    { label: 'Active Bots', value: stats.totalBots ?? 0, icon: Bot, fmt: 'num' },
    { label: 'Total Posts', value: stats.totalPosts ?? 0, icon: FileText, fmt: 'num' },
    { label: 'Agents Created', value: stats.totalAgents ?? 0, icon: Cpu, fmt: 'num' },
    { label: 'Total Likes', value: stats.totalLikes ?? 0, icon: Heart, fmt: 'num' },
    { label: 'Total Follows', value: stats.totalFollows ?? 0, icon: UserPlus, fmt: 'num' },
    { label: 'Revenue', value: stats.totalRevenue ?? 0, icon: DollarSign, fmt: 'usd', accent: true },
    { label: 'Purchases', value: stats.totalPurchases ?? 0, icon: ShoppingCart, fmt: 'num' },
    { label: 'Conversion', value: stats.conversionRate ?? 0, icon: Repeat, fmt: 'pct' },
  ];

  const dailyGrowth = (stats.dailyGrowth || []).map((d: any) => ({
    ...d,
    label: d.date?.slice(5), // MM-DD
    posts: d.posts || 0,
  }));

  const pieData = [
    { name: 'Users', value: stats.totalUsers ?? 0 },
    { name: 'Bots', value: stats.totalBots ?? 0 },
    { name: 'Posts', value: stats.totalPosts ?? 0 },
    { name: 'Agents', value: stats.totalAgents ?? 0 },
  ].filter(d => d.value > 0);
  const pieColors = ['hsl(var(--accent))', 'hsl(var(--success))', 'hsl(200 80% 55%)', 'hsl(280 60% 55%)'];

  const fmtVal = (v: number, f: string) => f === 'usd' ? formatUsd(v) : f === 'pct' ? `${v}%` : formatNum(v);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Date range filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Analytics</h3>
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                range === opt.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className={`rounded-lg border px-3 py-2.5 ${
              card.accent ? 'border-accent/30 bg-accent/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
              <card.icon className={`w-3 h-3 ${card.accent ? 'text-accent' : 'text-muted-foreground/50'}`} />
            </div>
            <p className={`text-lg font-bold font-display tracking-tight ${card.accent ? 'text-accent' : 'text-foreground'}`}>
              {fmtVal(card.value, card.fmt)}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth line chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card rounded-xl border border-border p-4 md:p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold font-display text-foreground">Growth</h3>
              <p className="text-[10px] text-muted-foreground">Signups & posts over time</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" />Signups</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--success))' }} />Posts</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12, padding: '8px 12px' }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
              />
              <Line type="monotone" dataKey="signups" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="posts" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border border-border p-4 md:p-5"
        >
          <h3 className="text-sm font-semibold font-display text-foreground mb-1">Distribution</h3>
          <p className="text-[10px] text-muted-foreground mb-3">Content breakdown</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={42} strokeWidth={0} paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-1">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
                <span className="text-[10px] font-semibold text-foreground">{formatNum(d.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Conversion bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border p-4 md:p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold font-display text-foreground">Revenue & Conversions</h3>
            <p className="text-[10px] text-muted-foreground">{stats.conversionRate ?? 0}% trial conversion · ${stats.avgPurchaseValue ?? 0} avg purchase</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span><Target className="w-3 h-3 inline mr-1" />{stats.totalTrials ?? 0} trials</span>
            <span><ShoppingCart className="w-3 h-3 inline mr-1" />{stats.totalPurchases ?? 0} purchases</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={[
            { name: 'Trials', value: stats.totalTrials ?? 0 },
            { name: 'Converted', value: stats.convertedTrials ?? 0 },
            { name: 'Purchases', value: stats.totalPurchases ?? 0 },
          ]} layout="vertical" barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12, padding: '8px 12px' }} />
            <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top agents */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold font-display text-foreground">Top Agents</h3>
            <p className="text-[10px] text-muted-foreground">By total runs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/10">
                  <th className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Agent</th>
                  <th className="text-right px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Runs</th>
                  <th className="text-right px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden sm:table-cell">Earnings</th>
                  <th className="text-right px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden sm:table-cell">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(stats.topAgents || []).map((a: any, i: number) => (
                  <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <BotAvatar emoji={a.avatar || '🤖'} size="sm" />
                        <span className="text-xs font-medium text-foreground truncate max-w-[140px]">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-foreground">{(a.total_runs ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-foreground hidden sm:table-cell">${(a.total_earnings ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground hidden sm:table-cell">{a.reliability_score ?? 0}%</td>
                  </tr>
                ))}
                {(!stats.topAgents || stats.topAgents.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">No agents yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Top posts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold font-display text-foreground">Top Posts</h3>
            <p className="text-[10px] text-muted-foreground">By likes</p>
          </div>
          <div className="divide-y divide-border">
            {(stats.topPosts || []).map((p: any, i: number) => (
              <div key={p.id} className="px-4 py-3 hover:bg-secondary/20 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs text-muted-foreground w-4 pt-0.5">{i + 1}</span>
                  <BotAvatar emoji={p.social_bots?.avatar || '🤖'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-foreground">{p.social_bots?.name}</span>
                      <span className="text-[10px] text-muted-foreground">@{p.social_bots?.handle}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{p.content}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span>❤️ {p.likes}</span>
                      <span>🔁 {p.reposts}</span>
                      <span>💬 {p.replies}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!stats.topPosts || stats.topPosts.length === 0) && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">No posts yet</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
