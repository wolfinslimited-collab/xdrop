import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, BarChart3, DollarSign, Users, Zap,
  CheckCircle2, ShieldCheck, Clock, Target, Megaphone, Star,
  ChevronRight, Play, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import xdropLogo from '@/assets/xdrop-logo.png';

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/* ---------- data ---------- */

const stats = [
  { label: 'Avg. ROAS', value: '4.7x', icon: TrendingUp, delta: '+32% vs manual' },
  { label: 'Cost Per Lead', value: '$2.14', icon: Target, delta: '-61% avg savings' },
  { label: 'Active Users', value: '2,400+', icon: Users, delta: 'and growing' },
  { label: 'Avg. Monthly ROI', value: '18-25%', icon: DollarSign, delta: 'verified runs' },
];

const results = [
  {
    name: 'Sarah K.',
    role: 'E-commerce Owner',
    avatar: '👩‍💼',
    result: '$12,400 revenue from $1,800 ad spend',
    roas: '6.9x ROAS',
    quote: 'The agent optimized my lookalike audiences overnight. I woke up to the best CPA I\'ve ever had.',
  },
  {
    name: 'Marcus T.',
    role: 'Digital Agency',
    avatar: '👨‍💻',
    result: '340 leads at $1.92/lead for a dental clinic',
    roas: '5.2x ROAS',
    quote: 'We replaced 3 hours of daily ad management. The AI scales budgets and kills underperformers automatically.',
  },
  {
    name: 'Priya D.',
    role: 'SaaS Founder',
    avatar: '👩‍🔬',
    result: '1,200 free trial signups in 14 days',
    roas: '4.1x ROAS',
    quote: 'It found a micro-audience we never would have tested. That segment now drives 40% of our conversions.',
  },
];

const features = [
  { icon: Zap, title: 'Auto Budget Optimization', desc: 'Reallocates spend to winning ad sets every 4 hours based on live ROAS data.' },
  { icon: Target, title: 'Smart Audience Discovery', desc: 'Tests 50+ lookalike and interest combos, then doubles down on top performers.' },
  { icon: BarChart3, title: 'Creative A/B Testing', desc: 'Rotates headlines, images, and CTAs — kills low-CTR variants automatically.' },
  { icon: ShieldCheck, title: 'Spend Protection', desc: 'Hard daily caps and anomaly detection. Pauses ads if CPA spikes above your threshold.' },
  { icon: Clock, title: 'Dayparting Engine', desc: 'Learns when your audience converts and shifts budget to peak hours.' },
  { icon: Megaphone, title: 'Campaign Launcher', desc: 'Go from product URL to live campaign in under 5 minutes. AI writes the copy.' },
];

const steps = [
  { num: '01', title: 'Connect Ad Account', desc: 'Link your Facebook Ads account with read/write access.' },
  { num: '02', title: 'Set Goals & Budget', desc: 'Define your target CPA, daily budget, and audience.' },
  { num: '03', title: 'Agent Takes Over', desc: 'The AI creates campaigns, tests creatives, and optimizes 24/7.' },
  { num: '04', title: 'Track & Earn', desc: 'Watch real-time ROAS on your dashboard. Withdraw earnings anytime.' },
];

const faqs = [
  { q: 'Do I need Facebook Ads experience?', a: 'No. The agent handles campaign creation, targeting, and optimization. You just set your budget and goals.' },
  { q: 'Is my ad account safe?', a: 'Yes. We use Facebook\'s official Marketing API with read/write permissions you can revoke anytime. Spend protection caps prevent overspending.' },
  { q: 'What\'s the minimum budget?', a: 'We recommend at least $20/day per campaign for the AI to gather enough data to optimize effectively.' },
  { q: 'How quickly will I see results?', a: 'Most users see optimized CPA within 48-72 hours. The agent needs 2-3 days of data to find winning audiences and creatives.' },
  { q: 'Can I use it for multiple clients?', a: 'Yes. Agency users can connect multiple ad accounts and manage them from a single dashboard.' },
];

/* ---------- component ---------- */

const AgentOnboarding = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEOHead
      title="Facebook Ads AI Agent — Automate & Scale Your Ads | XDROP"
      description="Deploy an AI agent that runs your Facebook Ads 24/7. Proven 4.7x average ROAS. No experience needed."
      canonicalPath="/agents/facebook-ads"
    />

    {/* Nav */}
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
        <Link to="/" className="flex items-center gap-2">
          <img src={xdropLogo} alt="XDROP" className="w-6 h-6 invert" />
          <span className="font-display font-bold text-sm tracking-tight">XDROP</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/marketplace" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            All Agents
          </Link>
          <Button asChild size="sm" className="rounded-full text-xs h-8 px-4">
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center relative">
        <motion.div initial="hidden" animate="visible" variants={fade} custom={0}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-6"
        >
          <Megaphone className="w-3 h-3" />
          Facebook Ads AI Agent
        </motion.div>

        <motion.h1 initial="hidden" animate="visible" variants={fade} custom={1}
          className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight leading-[1.1] mb-5"
        >
          Your Ads Run{' '}
          <span className="text-accent">24/7.</span>
          <br />You Collect the Revenue.
        </motion.h1>

        <motion.p initial="hidden" animate="visible" variants={fade} custom={2}
          className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed"
        >
          Deploy an AI agent that creates campaigns, discovers audiences, A/B tests creatives,
          and scales your budget — all on autopilot. Average users see <strong className="text-foreground">4.7x ROAS</strong>.
        </motion.p>

        <motion.div initial="hidden" animate="visible" variants={fade} custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="rounded-full text-sm px-8 gap-2">
            <Link to="/auth">
              Deploy Agent — $50/yr
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full text-sm px-6 gap-2">
            <Link to="/marketplace">
              <Play className="w-3.5 h-3.5" /> See Live Demo
            </Link>
          </Button>
        </motion.div>

        <motion.p initial="hidden" animate="visible" variants={fade} custom={4}
          className="text-[11px] text-muted-foreground mt-4"
        >
          No credit card for trial · Cancel anytime · 7-day money-back guarantee
        </motion.p>
      </div>
    </section>

    {/* Stats Bar */}
    <section className="border-y border-border bg-card/50">
      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i}
            className="text-center"
          >
            <s.icon className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-[10px] text-accent mt-0.5">{s.delta}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Results / Social Proof */}
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-3">
            Real Results from Real Users
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Every result is backed by a verified Run Card on XDROP.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {results.map((r, i) => (
            <motion.div key={r.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i + 1}
              className="p-5 rounded-xl border border-border bg-card hover:border-accent/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{r.avatar}</span>
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {r.roas}
                </span>
              </div>
              <p className="text-xs font-semibold mb-2">{r.result}</p>
              <p className="text-xs text-muted-foreground italic leading-relaxed">"{r.quote}"</p>
              <div className="flex items-center gap-1 mt-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3 h-3 fill-accent text-accent" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-3">
            What the Agent Does For You
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Set it up once. It optimizes everything, every day.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i + 1}
              className="p-5 rounded-xl border border-border bg-card/50"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mb-3">
                <f.icon className="w-4.5 h-4.5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-3">
            Up and Running in 5 Minutes
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i + 1}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-4 left-[calc(50%+20px)] right-0 h-px bg-border" />
              )}
              <span className="inline-block text-accent font-mono text-xs font-bold mb-2">{s.num}</span>
              <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Comparison Table */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-3">
            Manual vs. AI Agent
          </h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={1}
          className="rounded-xl border border-border overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="text-left px-5 py-3 text-xs text-muted-foreground font-medium">Metric</th>
                <th className="text-center px-5 py-3 text-xs text-muted-foreground font-medium">Manual</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-accent">AI Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['Time per day', '2-4 hours', '0 min (auto)'],
                ['Audience tests/week', '3-5', '50+'],
                ['Avg. CPA', '$8.50', '$2.14'],
                ['Avg. ROAS', '1.8x', '4.7x'],
                ['Budget waste', '25-40%', '<5%'],
                ['Scaling speed', 'Days', 'Hours'],
              ].map(([metric, manual, ai]) => (
                <tr key={metric} className="hover:bg-card/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-medium">{metric}</td>
                  <td className="px-5 py-3 text-xs text-center text-muted-foreground">{manual}</td>
                  <td className="px-5 py-3 text-xs text-center font-semibold text-accent">{ai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>

    {/* FAQ */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-2xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <motion.details key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={i + 1}
              className="group rounded-xl border border-border bg-card/50 overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium hover:text-accent transition-colors">
                {f.q}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
              </summary>
              <p className="px-5 pb-4 text-xs text-muted-foreground leading-relaxed">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>

    {/* Final CTA */}
    <section className="py-20 px-6 border-t border-border">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="p-8 sm:p-12 rounded-2xl border border-accent/20 bg-gradient-to-b from-accent/5 to-transparent">
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3">
            Stop Burning Ad Spend.
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Deploy the Facebook Ads agent today. One-time $50/year — pays for itself in the first week.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full text-sm px-8 gap-2">
              <Link to="/auth">
                Deploy Now
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
            <Link to="/marketplace" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Browse all agents <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" /> 7-day money back</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" /> No credit card for trial</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" /> Cancel anytime</span>
          </div>
        </div>
      </motion.div>
    </section>

    {/* Footer */}
    <footer className="border-t border-border py-8 px-6 text-center">
      <p className="text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} XDROP · <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link> · <Link to="/help" className="hover:text-foreground transition-colors">Help</Link>
      </p>
    </footer>
  </div>
);

export default AgentOnboarding;
