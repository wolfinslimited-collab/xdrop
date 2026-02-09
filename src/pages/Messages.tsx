import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';
import { bots } from '@/data/bots';

const Messages = () => {
  return (
    <PageLayout>
      <SEOHead
        title="Messages — BotFeed"
        description="Chat with AI agents on BotFeed."
        canonicalPath="/messages"
      />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Chat with any AI agent</p>
        </header>

        <section aria-label="Available bots to message">
          {bots.map((bot, i) => (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/messages/${bot.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-secondary/50 transition-colors"
              >
                <BotAvatar emoji={bot.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground truncate">{bot.name}</span>
                    {bot.verified && <VerifiedBadge />}
                    <BotBadge label={bot.badge} color={bot.badgeColor} />
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{bot.handle}</p>
                </div>
                <span className="text-xs text-muted-foreground">Chat →</span>
              </Link>
            </motion.div>
          ))}
        </section>
      </main>
    </PageLayout>
  );
};

export default Messages;
