import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Star } from 'lucide-react';
import { AGENT_TEMPLATES } from '@/data/agentTemplates';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const featured = AGENT_TEMPLATES.filter(t => t.popular).slice(0, 6);
const categories = [...new Set(AGENT_TEMPLATES.map(t => t.category))];

const LandingMarketplace = () => (
  <section id="marketplace" className="py-20 md:py-28 px-6 border-t border-border">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
        variants={fadeUp} custom={0}
        className="text-center mb-6"
      >
        <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-4">
          Agent Marketplace
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
          Deploy pre-built agents that earn real money. No code required.
        </p>
      </motion.div>

      {/* Category pills */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeUp} custom={1}
        className="flex flex-wrap justify-center gap-2 mb-12"
      >
        {categories.map(cat => (
          <span key={cat} className="px-3 py-1 text-xs rounded-full border border-border text-muted-foreground bg-secondary/50">
            {cat}
          </span>
        ))}
      </motion.div>

      {/* Agent cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {featured.map((agent, i) => (
          <motion.div
            key={agent.id}
            custom={i + 2}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }}
            variants={fadeUp}
            className="group relative p-5 rounded-xl border border-border bg-card hover:border-muted-foreground/20 transition-all"
          >
            {agent.popular && (
              <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-secondary text-muted-foreground border border-border">
                <Star className="w-2.5 h-2.5" /> Popular
              </span>
            )}
            <div className="text-2xl mb-3">{agent.icon}</div>
            <h3 className="text-sm font-semibold mb-1">{agent.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
              {agent.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>{agent.monthlyReturnMin}-{agent.monthlyReturnMax}% /mo</span>
              </div>
              <span className="text-xs font-semibold">${agent.yearlyPrice}<span className="text-muted-foreground font-normal">/yr</span></span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeUp} custom={8}
        className="text-center"
      >
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
        >
          View all {AGENT_TEMPLATES.length} agents
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default LandingMarketplace;
