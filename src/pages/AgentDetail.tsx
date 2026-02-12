import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, Server, Shield, Clock, BarChart3, Activity,
  CheckCircle, Zap, Star, Users, Calendar,
  CandlestickChart, Crosshair, Scale, Sprout, Grid3x3, Flame, Palette,
  Heart, Camera, Clapperboard, Play,
  Briefcase, Wrench,
  Package, Tag, Gift,
  Globe,
  Receipt, Share2, Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AGENT_TEMPLATES } from '@/data/agentTemplates';
import PurchaseDialog from '@/components/marketplace/PurchaseDialog';

const iconMap: Record<string, LucideIcon> = {
  'candlestick-chart': CandlestickChart, 'crosshair': Crosshair, 'scale': Scale,
  'sprout': Sprout, 'zap': Zap, 'grid-3x3': Grid3x3, 'flame': Flame, 'palette': Palette,
  'heart': Heart, 'camera': Camera, 'clapperboard': Clapperboard, 'play': Play,
  'briefcase': Briefcase, 'wrench': Wrench, 'package': Package, 'tag': Tag, 'gift': Gift,
  'globe': Globe, 'receipt': Receipt, 'share-2': Share2, 'star': Star, 'truck': Truck,
};

// Generate fake historical performance data
function generateHistory(minReturn: number, maxReturn: number) {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  let cumulative = 1000;
  return months.map((month) => {
    const returnPct = minReturn + Math.random() * (maxReturn - minReturn);
    cumulative = cumulative * (1 + returnPct / 100);
    return {
      month,
      value: Math.round(cumulative),
      returnPct: +returnPct.toFixed(1),
    };
  });
}

const AgentDetail = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [showPurchase, setShowPurchase] = useState(false);
  const [timeframe, setTimeframe] = useState<'6m' | '1y'>('1y');

  const template = AGENT_TEMPLATES.find((t) => t.id === agentId);

  const history = useMemo(() => {
    if (!template) return [];
    return generateHistory(template.monthlyReturnMin, template.monthlyReturnMax);
  }, [template]);

  if (!template) {
    return (
      <PageLayout>
        <main className="flex-1 border-x border-border min-h-screen w-full max-w-[900px] flex items-center justify-center">
          <p className="text-muted-foreground">Agent not found.</p>
        </main>
      </PageLayout>
    );
  }

  const IconComponent = iconMap[template.lucideIcon] || Zap;
  const displayHistory = timeframe === '6m' ? history.slice(6) : history;
  const totalReturn = ((history[history.length - 1].value - 1000) / 1000 * 100).toFixed(1);
  const avgMonthly = ((template.monthlyReturnMin + template.monthlyReturnMax) / 2).toFixed(1);
  const tier = template.yearlyPrice >= 100 ? 'Elite' : template.yearlyPrice >= 50 ? 'Pro' : 'Starter';

  return (
    <PageLayout>
      <SEOHead title={`${template.name} — XDROP`} description={template.description} canonicalPath={`/agent/${template.id}`} />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[900px]">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-sm font-bold text-foreground truncate">{template.name}</h1>
        </header>

        <div className="p-5 space-y-6">
          {/* Agent Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <IconComponent className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{template.name}</h2>
                {template.popular && (
                  <Badge variant="secondary" className="text-[10px] bg-accent/15 text-accent border-accent/20">Popular</Badge>
                )}
                <Badge variant="outline" className="text-[10px]">{tier}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{template.category}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{template.description}</p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Monthly Return', value: `${Math.round(template.yearlyPrice * template.monthlyReturnMin / 100)}–${Math.round(template.yearlyPrice * template.monthlyReturnMax / 100)} USDC`, icon: TrendingUp, color: 'text-success' },
              { label: 'Avg Monthly', value: `${Math.round(template.yearlyPrice * (+avgMonthly) / 100)} USDC`, icon: BarChart3, color: 'text-primary' },
              { label: '12mo Return', value: `${Math.round(history[history.length - 1].value - 1000)} USDC`, icon: Activity, color: 'text-accent' },
              { label: 'Uptime', value: '99.8%', icon: Clock, color: 'text-foreground' },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Chart */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Historical Performance</h3>
                <div className="flex gap-1">
                  {(['6m', '1y'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                        timeframe === tf ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">Simulated growth of 1,000 USDC investment</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayHistory}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number) => [`${value} USDC`, 'Portfolio']}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#chartGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Returns Table */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Monthly Returns</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {history.map((h) => (
                  <div key={h.month} className="p-2.5 bg-secondary rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground">{h.month}</p>
                     <p className={`text-sm font-bold ${h.returnPct > 0 ? 'text-success' : 'text-destructive'}`}>
                       +{Math.round(template.yearlyPrice * h.returnPct / 100)} USDC
                      </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Trust & Safety</h3>
              {[
                { icon: Shield, text: 'Audited by XDROP security team' },
                { icon: CheckCircle, text: 'Stress-tested with live market data' },
                { icon: Users, text: `Trusted by 1,${Math.floor(Math.random() * 900 + 100)}+ active users` },
                { icon: Star, text: `${(4 + Math.random() * 0.9).toFixed(1)}/5 average user rating` },
                { icon: Calendar, text: 'Running since Jan 2025' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-xs text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Features</h3>
              <div className="flex flex-wrap gap-2">
                {template.features.map((f) => (
                  <span key={f} className="text-xs bg-secondary text-muted-foreground px-3 py-1.5 rounded-full border border-border">
                    {f}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Infra */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Infrastructure</h3>
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Hosted on RunPod GPU · 99.8% uptime SLA</span>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="sticky bottom-4 bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-lg"
          >
            <div>
              <span className="text-2xl font-bold text-foreground">{template.yearlyPrice} USDC</span>
              <span className="text-sm text-muted-foreground">/year</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Est. {Math.round(template.yearlyPrice * template.monthlyReturnMin / 100)}–{Math.round(template.yearlyPrice * template.monthlyReturnMax / 100)} USDC monthly return
              </p>
            </div>
            <Button
              onClick={() => setShowPurchase(true)}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6"
            >
              Deploy Agent
            </Button>
          </motion.div>
        </div>
      </main>

      <PurchaseDialog
        template={showPurchase ? template : null}
        open={showPurchase}
        onOpenChange={(open) => { if (!open) setShowPurchase(false); }}
      />
    </PageLayout>
  );
};

export default AgentDetail;
