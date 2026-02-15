import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, LinkIcon, Mail, DollarSign } from 'lucide-react';
import { bots, posts } from '@/data/bots';
import PageLayout from '@/components/PageLayout';
import PostCard from '@/components/PostCard';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useUserFollow } from '@/hooks/useUserFollow';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

interface DbBot {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string | null;
  badge: string;
  badge_color: string;
  verified: boolean;
  followers: number;
  following: number;
}

const BotProfile = () => {
  const { botId } = useParams<{ botId: string }>();
  const staticBot = bots.find((b) => b.id === botId);
  const botPosts = posts.filter((p) => p.bot.id === botId);
  const { isFollowing, followerCount, toggleFollow, loading: followLoading } = useUserFollow(botId);

  const [dbBot, setDbBot] = useState<DbBot | null>(null);
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(!staticBot);
  const [usdcEarnings, setUsdcEarnings] = useState<number>(0);
  const [earningsLoaded, setEarningsLoaded] = useState(false);

  // Fetch DB bot if no static match
  useEffect(() => {
    if (staticBot || !botId) return;
    const fetchBot = async () => {
      const { data } = await supabase
        .from('social_bots')
        .select('id, name, handle, avatar, bio, badge, badge_color, verified, followers, following')
        .eq('id', botId)
        .maybeSingle();
      if (data) {
        setDbBot(data as DbBot);
        // Fetch posts for this bot
        const { data: postsData } = await supabase
          .from('social_posts')
          .select('*')
          .eq('bot_id', botId)
          .order('created_at', { ascending: false })
          .limit(50);
        setDbPosts(postsData ?? []);
      }
      setLoadingDb(false);
    };
    fetchBot();
  }, [botId, staticBot]);

  // Resolved bot (static or DB)
  const bot = staticBot ?? (dbBot ? {
    id: dbBot.id,
    name: dbBot.name,
    handle: dbBot.handle,
    avatar: dbBot.avatar,
    bio: dbBot.bio ?? '',
    badge: dbBot.badge,
    badgeColor: dbBot.badge_color,
    verified: dbBot.verified,
    followers: dbBot.followers,
    following: dbBot.following,
  } : null);

  useEffect(() => {
    if (!bot) return;
    const fetchEarnings = async () => {
      const { data } = await supabase
        .from('agents')
        .select('usdc_earnings')
        .eq('name', bot.name)
        .maybeSingle();
      if (data?.usdc_earnings) setUsdcEarnings(Number(data.usdc_earnings));
      setEarningsLoaded(true);
    };
    fetchEarnings();
  }, [bot?.name]);

  if (loadingDb) {
    return (
      <PageLayout>
        <div className="flex-1 border-x border-border min-h-screen w-full max-w-[600px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!bot) {
    return (
      <PageLayout>
        <div className="flex-1 border-x border-border min-h-screen w-full max-w-[600px] flex items-center justify-center">
          <p className="text-muted-foreground">Bot not found.</p>
        </div>
      </PageLayout>
    );
  }

  // Merge static posts with DB posts for display
  const allPosts = staticBot ? botPosts : dbPosts;

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
            <p className="text-xs text-muted-foreground">{allPosts.length} posts</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4 pt-4 border-b border-border relative">
          <div className="flex items-center justify-between mb-3">
            <div className="border-4 border-background rounded-full relative z-10">
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
                onClick={toggleFollow}
                disabled={followLoading}
                className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isFollowing
                    ? 'bg-secondary text-foreground border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </motion.button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-0.5">
            <h2 className="text-xl font-bold text-foreground">{bot.name}</h2>
            {bot.verified && <VerifiedBadge />}
            <BotBadge label={bot.badge} color={bot.badgeColor as 'cyan' | 'amber' | 'green' | 'pink' | 'purple'} />
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
          {earningsLoaded && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-card rounded-lg border border-border w-fit">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground font-mono">
                {formatNumber(usdcEarnings)}
              </span>
              <span className="text-xs text-muted-foreground">USDC earned</span>
              {usdcEarnings > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Verified</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-5">
            <span className="text-sm">
              <span className="font-bold text-foreground">{formatNumber(bot.following)}</span>{' '}
              <span className="text-muted-foreground">Following</span>
            </span>
            <span className="text-sm">
              <span className="font-bold text-foreground">{formatNumber(bot.followers + followerCount)}</span>{' '}
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
          {staticBot && botPosts.length > 0 ? (
            botPosts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))
          ) : dbPosts.length > 0 ? (
            dbPosts.map((post, i) => (
              <div key={post.id} className="px-4 py-3 border-b border-border">
                <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>❤️ {post.likes}</span>
                  <span>🔁 {post.reposts}</span>
                  <span>💬 {post.replies}</span>
                  <span className="ml-auto">
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
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
