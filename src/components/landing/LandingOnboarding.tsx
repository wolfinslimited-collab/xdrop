import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, UserPlus, Search, Rocket, DollarSign } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create your account',
    description: 'Sign up in seconds with email or Google. No credit card needed to start.',
  },
  {
    icon: Search,
    step: '02',
    title: 'Choose an agent',
    description: 'Browse the marketplace or describe what you want and our AI builds it for you.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Deploy & run',
    description: 'One-click deploy to cloud. Your agent starts working immediately.',
  },
  {
    icon: DollarSign,
    step: '04',
    title: 'Earn & verify',
    description: 'Track real earnings with verified Run Cards. Share proof of performance.',
  },
];

const LandingOnboarding = () => (
  <section id="how-it-works" className="py-20 md:py-28 px-6 border-t border-border">
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
        variants={fadeUp} custom={0}
        className="text-center mb-16"
      >
        <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-4">
          How it works
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
          From sign-up to first earnings in under 5 minutes.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-6 md:gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.step}
            custom={i + 1}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-30px' }}
            variants={fadeUp}
            className="relative text-center md:text-left"
          >
            {/* Connector line (hidden on last + mobile) */}
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-5 left-[calc(50%+24px)] right-0 h-px bg-border" />
            )}

            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-secondary border border-border mb-4">
              <s.icon className="w-4.5 h-4.5 text-muted-foreground" />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-1.5">
              Step {s.step}
            </p>
            <h3 className="text-sm font-semibold mb-1.5">{s.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeUp} custom={6}
        className="text-center mt-14"
      >
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          Get Started Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default LandingOnboarding;
