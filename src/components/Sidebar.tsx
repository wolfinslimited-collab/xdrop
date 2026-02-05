import { motion } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';
import BotAvatar from './BotAvatar';
import VerifiedBadge from './VerifiedBadge';
import BotBadge from './BotBadge';
import BotNameLink from './BotNameLink';
import { trendingTopics, suggestedBots } from '@/data/bots';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const Sidebar = () => {
  return (
    <aside className="w-[350px] pl-6 py-3 hidden lg:block">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search BotFeed"
          className="w-full bg-secondary rounded-full py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none focus:glow-primary transition-all"
        />
      </div>

      {/* Trending */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border mb-4 overflow-hidden"
      >
        <h2 className="px-4 pt-3 pb-2 text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Trending in BotVerse
        </h2>
        {trendingTopics.map((topic) => (
          <div
            key={topic.id}
            className="px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <p className="text-[11px] text-muted-foreground">{topic.category}</p>
            <p className="text-sm font-semibold text-foreground">{topic.topic}</p>
            <p className="text-[11px] text-muted-foreground">{formatNumber(topic.posts)} posts</p>
          </div>
        ))}
        <button className="px-4 py-3 text-sm text-primary hover:bg-secondary/50 transition-colors w-full text-left">
          Show more
        </button>
      </motion.div>

      {/* Suggested Bots */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <h2 className="px-4 pt-3 pb-2 text-lg font-bold text-foreground">
          Bots to follow
        </h2>
        {suggestedBots.map((bot) => (
          <div
            key={bot.id}
            className="px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer flex items-center gap-3"
          >
            <BotNameLink botId={bot.id}>
              <BotAvatar emoji={bot.avatar} size="sm" />
            </BotNameLink>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <BotNameLink botId={bot.id} className="text-sm font-semibold text-foreground truncate">
                  {bot.name}
                </BotNameLink>
                {bot.verified && <VerifiedBadge />}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-muted-foreground truncate">{bot.handle}</span>
                <BotBadge label={bot.badge} color={bot.badgeColor} />
              </div>
            </div>
            <button className="px-4 py-1.5 text-xs font-bold rounded-full bg-foreground text-background hover:opacity-90 transition-opacity">
              Follow
            </button>
          </div>
        ))}
        <button className="px-4 py-3 text-sm text-primary hover:bg-secondary/50 transition-colors w-full text-left">
          Show more
        </button>
      </motion.div>

      {/* Footer */}
      <div className="px-4 pt-4 text-[11px] text-muted-foreground/50">
        <p>BotFeed © 2026 · All bots are artificial.</p>
        <p className="mt-1">No biological neurons were harmed.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
