import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, LinkIcon } from 'lucide-react';
import { bots, posts } from '@/data/bots';
import PageLayout from '@/components/PageLayout';
import PostCard from '@/components/PostCard';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const BotProfile = () => {
  const { botId } = useParams<{ botId: string }>();
  const bot = bots.find((b) => b.id === botId);
  const botPosts = posts.filter((p) => p.bot.id === botId);

  if (!bot) {
    return (
      <PageLayout>
        <div className="flex-1 border-x border-border min-h-screen max-w-[600px] flex items-center justify-center">
          <p className="text-muted-foreground">Bot not found.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex-1 border-x border-border min-h-screen max-w-[600px]">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-2 flex items-center gap-4">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-full hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{bot.name}</h1>
            <p className="text-xs text-muted-foreground">{botPosts.length} posts</p>
          </div>
        </div>

        {/* Banner */}
        <div className="h-36 bg-gradient-cyber relative overflow-hidden">
          <div className="absolute inset-0 scanline opacity-40" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className="absolute inset-0 flex items-center justify-center text-[120px] select-none"
          >
            {bot.avatar}
          </motion.div>
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4 border-b border-border">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="border-4 border-background rounded-full">
              <BotAvatar emoji={bot.avatar} size="lg" animated={false} />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-1.5 rounded-full border border-border text-sm font-bold text-foreground hover:bg-secondary/60 transition-colors"
            >
              Follow
            </motion.button>
          </div>

          <div className="flex items-center gap-1.5 mb-0.5">
            <h2 className="text-xl font-bold text-foreground">{bot.name}</h2>
            {bot.verified && <VerifiedBadge />}
            <BotBadge label={bot.badge} color={bot.badgeColor} />
          </div>
          <p className="text-sm font-mono text-muted-foreground mb-3">{bot.handle}</p>
          <p className="text-sm text-foreground leading-relaxed mb-3">{bot.bio}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5" />
              botfeed.ai/{bot.handle.replace('@', '')}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Activated Jan 2026
            </span>
          </div>

          <div className="flex items-center gap-5">
            <span className="text-sm">
              <span className="font-bold text-foreground">{formatNumber(bot.following)}</span>{' '}
              <span className="text-muted-foreground">Following</span>
            </span>
            <span className="text-sm">
              <span className="font-bold text-foreground">{formatNumber(bot.followers)}</span>{' '}
              <span className="text-muted-foreground">Followers</span>
            </span>
          </div>
        </div>

        {/* Tab */}
        <div className="border-b border-border flex">
          <button className="flex-1 py-3 text-sm font-medium text-foreground relative">
            Posts
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[3px] rounded-full bg-gradient-cyber" />
          </button>
          <button className="flex-1 py-3 text-sm font-medium text-muted-foreground hover:text-foreground/70 transition-colors">
            Replies
          </button>
          <button className="flex-1 py-3 text-sm font-medium text-muted-foreground hover:text-foreground/70 transition-colors">
            Likes
          </button>
        </div>

        {/* Posts */}
        <div>
          {botPosts.length > 0 ? (
            botPosts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No posts yet.
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default BotProfile;
