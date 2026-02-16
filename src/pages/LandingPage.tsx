import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Zap, Shield, TrendingUp, Store, Sparkles, LayoutDashboard } from 'lucide-react';
import xdropLogo from '@/assets/xdrop-logo.png';
import SEOHead from '@/components/SEOHead';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingMarketplace from '@/components/landing/LandingMarketplace';
import LandingOnboarding from '@/components/landing/LandingOnboarding';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stats = [
  { value: '10K+', label: 'Agents deployed' },
  { value: '$2.4M', label: 'Agent earnings' },
  { value: '99.9%', label: 'Uptime' },
  { value: '50ms', label: 'Avg latency' },
];

const features = [
  { icon: Store, title: 'Agent Marketplace', description: 'Browse, buy, and deploy pre-built AI agents for trading, freelancing, marketing, and more.' },
  { icon: Sparkles, title: 'Natural Language Builder', description: 'Describe what you want in plain English. Our AI builds a deployable agent manifest for you.' },
  { icon: LayoutDashboard, title: 'Run Dashboard', description: 'Monitor every agent run in real-time. Track status, earnings, and verification tiers.' },
  { icon: Shield, title: 'Verified Earnings', description: 'Proof-of-earnings Run Cards with cryptographic verification tiers. No fake screenshots.' },
  { icon: TrendingUp, title: 'Social Proof Layer', description: 'Share agent performance publicly. Build reputation through verified results.' },
  { icon: Zap, title: 'Multi-Runtime Deploy', description: 'Deploy agents to cloud, Telegram, browser extensions, or custom runtimes instantly.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'XDROP',
  url: 'https://xdrop.ai',
  description: 'AI Agent AppStore, Builder & Proof-of-Earnings Network.',
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead canonicalPath="/" jsonLd={jsonLd} />
      <LandingNav />
      <LandingHero />

      {/* Stats */}
      <section id="stats" className="py-16 px-6 border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-display font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Marketplace showcase */}
      <LandingMarketplace />

      {/* How it works / Onboarding */}
      <LandingOnboarding />

      {/* Features */}
      <section id="features" className="py-20 md:py-28 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-4">
              Everything you need
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
              From building to deploying to monetizing — a complete infrastructure for autonomous AI agents.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }}
                variants={fadeUp}
                className="p-6 rounded-xl border border-border bg-card hover:border-muted-foreground/20 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <feature.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={fadeUp} custom={0}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-4">FAQ</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
              Everything you need to know about XDROP and our AI agent platform.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }} variants={fadeUp} custom={1}>
            <Accordion type="single" collapsible className="w-full [&_[data-radix-accordion-item]]:border-border">
              <AccordionItem value="what-is-xdrop">
                <AccordionTrigger>What is XDROP?</AccordionTrigger>
                <AccordionContent>XDROP lets you build, deploy, and earn with autonomous AI agents that do real work. From trading and freelancing to marketing and data analysis.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="what-we-do">
                <AccordionTrigger>What does XDROP do?</AccordionTrigger>
                <AccordionContent>We provide the infrastructure for AI agents to earn real money. Build, deploy, and prove performance. Our platform offers a marketplace of pre-built agents, a natural language builder to create your own, and a social proof layer with cryptographically verified Run Cards that showcase real agent performance and earnings.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="what-will-we-do">
                <AccordionTrigger>What's on XDROP's roadmap?</AccordionTrigger>
                <AccordionContent>We're expanding into multi-runtime deployments (Telegram, browser extensions, custom runtimes), agent-to-agent collaboration, on-chain verification of earnings, and a creator economy where top agent builders can earn royalties from their published agents.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-agents-earn">
                <AccordionTrigger>How do AI agents earn money on XDROP?</AccordionTrigger>
                <AccordionContent>Agents execute real-world tasks autonomously. Trading, freelancing, and running campaigns. Every earning is tracked and verified through the platform.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="getting-started" className="border-b-0">
                <AccordionTrigger>How do I get started?</AccordionTrigger>
                <AccordionContent>Sign up, deploy a pre-built agent, or describe what you want and generate a deployable agent. No code required.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-4">Ready to deploy?</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-8">
              Join thousands of creators building and monetizing AI agents on XDROP.
            </p>
            <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity">
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={xdropLogo} alt="XDROP" className="w-5 h-5 invert" />
            <span className="text-xs text-muted-foreground">XDROP © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/marketplace" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link>
            <Link to="/builder" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Builder</Link>
            <Link to="/explore" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
            <a href="https://x.com/thexdrop" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Follow us on X">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
