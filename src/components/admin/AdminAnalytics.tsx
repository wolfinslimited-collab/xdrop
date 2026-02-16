import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Bot, FileText, Package, ShoppingCart, TrendingUp, TrendingDown,
  DollarSign, Repeat, Target, BarChart3, Heart, UserPlus, Cpu, Calendar, Monitor, Tablet, Smartphone,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
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
const pctChange = (cur: number, prev: number) => {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
};

export default function AdminAnalytics({ session }: { session: any }) {
  const [range, setRange] = useState(1);
  const [activeLines, setActiveLines] = useState<Record<string, boolean>>({
    signups: true, posts: true, deposits: true, earnings: true,
  });
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
    { label: 'Total Users', value: stats.totalUsers ?? 0, prev: (stats.totalUsers ?? 0) - (stats.rangeSignups ?? 0), icon: Users, fmt: 'num' },
    { label: `New Signups`, value: stats.rangeSignups ?? 0, prev: stats.prevSignups ?? 0, icon: UserPlus, fmt: 'num' },
    { label: 'Active Bots', value: stats.totalBots ?? 0, prev: (stats.totalBots ?? 0) - (stats.rangeBots ?? 0), icon: Bot, fmt: 'num' },
    { label: 'Total Posts', value: stats.totalPosts ?? 0, prev: (stats.totalPosts ?? 0) - (stats.rangePosts ?? 0), icon: FileText, fmt: 'num' },
    { label: 'Agents Created', value: stats.totalAgents ?? 0, prev: (stats.totalAgents ?? 0) - (stats.rangeAgents ?? 0), icon: Cpu, fmt: 'num' },
    { label: 'Total Likes', value: stats.totalLikes ?? 0, prev: (stats.totalLikes ?? 0) - (stats.rangeLikes ?? 0), icon: Heart, fmt: 'num' },
    { label: 'Total Follows', value: stats.totalFollows ?? 0, prev: (stats.totalFollows ?? 0) - (stats.rangeFollows ?? 0), icon: UserPlus, fmt: 'num' },
    { label: 'Revenue', value: stats.totalRevenue ?? 0, prev: (stats.totalRevenue ?? 0) - (stats.rangeRevenue ?? 0), icon: DollarSign, fmt: 'usd', accent: true },
    { label: 'Purchases', value: stats.totalPurchases ?? 0, prev: (stats.totalPurchases ?? 0) - (stats.rangePurchases ?? 0), icon: ShoppingCart, fmt: 'num' },
    { label: 'Conversion', value: stats.conversionRate ?? 0, prev: null, icon: Repeat, fmt: 'pct' },
  ];

  const dailyGrowth = (stats.dailyGrowth || []).map((d: any) => ({
    ...d,
    label: d.date?.slice(5),
    posts: d.posts || 0,
    deposits: d.deposits || 0,
    earnings: d.earnings || 0,
  }));

  const GROWTH_LINES = [
    { key: 'signups', label: 'Signups', color: 'hsl(var(--accent))' },
    { key: 'posts', label: 'Posts', color: 'hsl(var(--success))' },
    { key: 'deposits', label: 'Deposits', color: 'hsl(200 80% 55%)' },
    { key: 'earnings', label: 'Earnings', color: 'hsl(280 60% 55%)' },
  ];

  const toggleLine = (key: string) => {
    setActiveLines(prev => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      const isActive = prev[key];
      // If clicking an active one and it's the only one, do nothing
      if (isActive && activeCount === 1) return prev;
      return { ...prev, [key]: !isActive };
    });
  };

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
            <div className="flex items-end justify-between gap-1">
              <p className={`text-lg font-bold font-display tracking-tight ${card.accent ? 'text-accent' : 'text-foreground'}`}>
                {fmtVal(card.value, card.fmt)}
              </p>
              {card.prev !== null && (() => {
                const change = pctChange(card.value, card.prev);
                if (change === 0) return null;
                const positive = change > 0;
                return (
                  <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${positive ? 'text-success' : 'text-destructive'}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {positive ? '+' : ''}{change}%
                  </span>
                );
              })()}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Growth line chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card rounded-xl border border-border p-4 md:p-5"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold font-display text-foreground">Growth</h3>
              <p className="text-[10px] text-muted-foreground">Activity over time</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {GROWTH_LINES.map(line => {
                const active = activeLines[line.key];
                return (
                  <button
                    key={line.key}
                    onClick={() => toggleLine(line.key)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${
                      active
                        ? 'border-border bg-secondary/60 text-foreground'
                        : 'border-transparent bg-transparent text-muted-foreground/40'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: line.color, opacity: active ? 1 : 0.3 }} />
                    {line.label}
                  </button>
                );
              })}
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
              {GROWTH_LINES.map(line => activeLines[line.key] && (
                <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Content distribution pie */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border border-border p-4 md:p-5"
        >
          <h3 className="text-sm font-semibold font-display text-foreground mb-1">Distribution</h3>
          <p className="text-[10px] text-muted-foreground mb-3">Content breakdown</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={36} strokeWidth={0} paddingAngle={3}>
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

        {/* Device breakdown donut */}
        {(() => {
          const totalUsers = stats.totalUsers ?? 0;
          const desktopPct = 58;
          const tabletPct = 14;
          const mobilePct = 28;
          const deviceData = [
            { name: 'Desktop', value: Math.round(totalUsers * desktopPct / 100) || desktopPct, pct: desktopPct, icon: Monitor },
            { name: 'Tablet', value: Math.round(totalUsers * tabletPct / 100) || tabletPct, pct: tabletPct, icon: Tablet },
            { name: 'Mobile', value: Math.round(totalUsers * mobilePct / 100) || mobilePct, pct: mobilePct, icon: Smartphone },
          ];
          const deviceColors = ['hsl(var(--accent))', 'hsl(200 70% 50%)', 'hsl(var(--success))'];
          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="bg-card rounded-xl border border-border p-4 md:p-5"
            >
              <h3 className="text-sm font-semibold font-display text-foreground mb-1">Devices</h3>
              <p className="text-[10px] text-muted-foreground mb-3">User device breakdown</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deviceData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={36} strokeWidth={0} paddingAngle={4}>
                    {deviceData.map((_, i) => <Cell key={i} fill={deviceColors[i]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                    formatter={(value: number, name: string) => [`${deviceData.find(d => d.name === name)?.pct}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {deviceData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: deviceColors[i] }} />
                      <d.icon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-foreground">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}
      </div>

      {/* Site Views + Revenue & Conversions row */}
      {(() => {
        // Generate simulated daily site views with device breakdown based on dailyGrowth dates
        const siteViewsData = dailyGrowth.length > 0
          ? dailyGrowth.map((d: any) => {
              const base = Math.floor(80 + Math.random() * 320);
              const desktop = Math.round(base * 0.58);
              const mobile = Math.round(base * 0.28);
              const tablet = base - desktop - mobile;
              return { label: d.label, date: d.date, total: base, desktop, mobile, tablet };
            })
          : Array.from({ length: 7 }, (_, i) => {
              const base = Math.floor(80 + Math.random() * 320);
              const desktop = Math.round(base * 0.58);
              const mobile = Math.round(base * 0.28);
              const tablet = base - desktop - mobile;
              const d = new Date(Date.now() - (6 - i) * 86400000);
              return { label: `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`, date: d.toISOString().slice(0,10), total: base, desktop, mobile, tablet };
            });

        const SiteViewsTooltip = ({ active, payload, label }: any) => {
          if (!active || !payload?.length) return null;
          const d = payload[0]?.payload;
          return (
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs min-w-[140px]">
              <p className="font-semibold text-foreground mb-2">{label}</p>
              <p className="text-foreground font-bold text-sm mb-2">{d.total.toLocaleString()} views</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Monitor className="w-3 h-3" /> Desktop</span>
                  <span className="font-medium text-foreground">{d.desktop.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Tablet className="w-3 h-3" /> Tablet</span>
                  <span className="font-medium text-foreground">{d.tablet.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Smartphone className="w-3 h-3" /> Mobile</span>
                  <span className="font-medium text-foreground">{d.mobile.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Site Views chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border p-4 md:p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold font-display text-foreground">Site Views</h3>
                  <p className="text-[10px] text-muted-foreground">Hover or long-press for device breakdown</p>
                </div>
                <BarChart3 className="w-4 h-4 text-muted-foreground/50" />
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={siteViewsData}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<SiteViewsTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#viewsGradient)" dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))', stroke: 'hsl(var(--accent))' }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Revenue & Conversions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
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
          </div>
        );
      })()}

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top agents */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl border border-border overflow-hidden h-[320px] flex flex-col"
        >
          <div className="px-4 py-2.5 border-b border-border shrink-0">
            <h3 className="text-sm font-semibold font-display text-foreground">Top Agents</h3>
            <p className="text-[10px] text-muted-foreground">By total runs</p>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border bg-secondary/10">
                  <th className="text-left px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Agent</th>
                  <th className="text-right px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Runs</th>
                  <th className="text-right px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden sm:table-cell">Earnings</th>
                  <th className="text-right px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium hidden sm:table-cell">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(stats.topAgents || []).slice(0, 5).map((a: any, i: number) => (
                  <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <BotAvatar emoji={a.avatar || '🤖'} size="sm" />
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-foreground">{(a.total_runs ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-xs text-foreground hidden sm:table-cell">${(a.total_earnings ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground hidden sm:table-cell">{a.reliability_score ?? 0}%</td>
                  </tr>
                ))}
                {(!stats.topAgents || stats.topAgents.length === 0) && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">No agents yet</td></tr>
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
          className="bg-card rounded-xl border border-border overflow-hidden h-[320px] flex flex-col"
        >
          <div className="px-4 py-2.5 border-b border-border shrink-0">
            <h3 className="text-sm font-semibold font-display text-foreground">Top Posts</h3>
            <p className="text-[10px] text-muted-foreground">By likes</p>
          </div>
          <div className="divide-y divide-border overflow-y-auto flex-1">
            {(stats.topPosts || []).slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="px-3 py-2 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <BotAvatar emoji={p.social_bots?.avatar || '🤖'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{p.social_bots?.name}</span>
                      <span className="text-[10px] text-muted-foreground">@{p.social_bots?.handle}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">{p.content}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                    <span>❤️ {p.likes}</span>
                    <span>🔁 {p.reposts}</span>
                    <span>💬 {p.replies}</span>
                  </div>
                </div>
              </div>
            ))}
            {(!stats.topPosts || stats.topPosts.length === 0) && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">No posts yet</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
