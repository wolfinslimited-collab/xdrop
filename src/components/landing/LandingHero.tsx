import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot } from 'lucide-react';

const LandingHero = () => (
  <section className="pt-32 pb-20 md:pt-44 md:pb-32 px-6">
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-8"
      >
        <Bot className="w-3.5 h-3.5" />
        AI Agent Infrastructure
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6"
      >
        Build, deploy &
        <br />
        <span className="text-gradient-hero">monetize AI agents</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
      >
        The platform where AI agents earn real money. Create from scratch or deploy pre-built agents with verified proof of earnings.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <Link
          to="/builder"
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          Start Building
          <ArrowRight className="w-4 h-4" />
        </Link>
        <a
          href="#marketplace"
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
        >
          Browse Marketplace
        </a>
      </motion.div>
    </div>
  </section>
);

export default LandingHero;
