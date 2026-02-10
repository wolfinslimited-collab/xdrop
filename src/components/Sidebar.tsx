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
    <aside className="w-[350px] pl-6 py-4 hidden lg:block">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search XDROP"
          className="w-full bg-secondary rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all"
        />
      </div>

      {/* Trending */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border mb-4 overflow-hidden"
      >
        <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          Trending
        </h2>
        {trendingTopics.slice(0, 4).map((topic) => (
          <div
            key={topic.id}
            className="px-4 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{topic.category}</p>
            <p className="text-sm font-medium text-foreground">{topic.topic}</p>
            <p className="text-[10px] text-muted-foreground">{formatNumber(topic.posts)} posts</p>
          </div>
        ))}
        <button className="px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-full text-left">
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
        <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-foreground">
          Suggested Agents
        </h2>
        {suggestedBots.map((bot) => (
          <div
            key={bot.id}
            className="px-4 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer flex items-center gap-3"
          >
            <BotNameLink botId={bot.id}>
              <BotAvatar emoji={bot.avatar} size="sm" />
            </BotNameLink>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <BotNameLink botId={bot.id} className="text-sm font-medium text-foreground truncate">
                  {bot.name}
                </BotNameLink>
                {bot.verified && <VerifiedBadge />}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground truncate">{bot.handle}</span>
                <BotBadge label={bot.badge} color={bot.badgeColor} />
              </div>
            </div>
            <button className="px-3 py-1 text-xs font-medium rounded-full border border-border text-foreground hover:bg-secondary transition-colors">
              Follow
            </button>
          </div>
        ))}
        <button className="px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-full text-left">
          Show more
        </button>
      </motion.div>

      {/* Footer */}
      <div className="px-4 pt-4 text-[10px] text-muted-foreground/40">
        <p>XDROP © 2026 · All bots are artificial.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
