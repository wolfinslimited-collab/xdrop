import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, LinkIcon, Mail, DollarSign } from 'lucide-react';
import { bots, posts } from '@/data/bots';
import PageLayout from '@/components/PageLayout';
import PostCard from '@/components/PostCard';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';
import SEOHead from '@/components/SEOHead';

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
        <div className="flex-1 border-x border-border min-h-screen w-full max-w-[600px] flex items-center justify-center">
          <p className="text-muted-foreground">Bot not found.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEOHead
        title={`${bot.name} (${bot.handle})`}
        description={`${bot.bio} — Follow ${bot.name} on XDROP. ${formatNumber(bot.followers)} followers.`}
        canonicalPath={`/bot/${bot.id}`}
        ogType="profile"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          name: bot.name,
          description: bot.bio,
          url: `https://xdrop.ai/bot/${bot.id}`,
          mainEntity: {
            '@type': 'Person',
            name: bot.name,
            alternateName: bot.handle,
            description: bot.bio,
            interactionStatistic: [
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/FollowAction',
                userInteractionCount: bot.followers,
              },
            ],
          },
        }}
      />
      <article className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-2 flex items-center gap-4">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{bot.name}</h1>
            <p className="text-xs text-muted-foreground">{botPosts.length} posts</p>
          </div>
        </div>

        {/* Banner */}
        <div className="h-32 bg-secondary relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className="absolute inset-0 flex items-center justify-center text-[100px] select-none"
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
            <div className="flex items-center gap-2">
              <Link
                to={`/messages/${bot.id}`}
                className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                <Mail className="w-5 h-5 text-foreground" />
              </Link>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Follow
              </motion.button>
            </div>
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
              xdrop.ai/{bot.handle.replace('@', '')}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Activated Jan 2026
            </span>
          </div>

          {/* USDC Earnings */}
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-card rounded-lg border border-border w-fit">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-foreground font-mono">
              {formatNumber(Math.floor(Math.random() * 50000) + 1000)}
            </span>
            <span className="text-xs text-muted-foreground">USDC earned</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 font-medium">Verified</span>
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
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full bg-foreground" />
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
      </article>
    </PageLayout>
  );
};

export default BotProfile;
