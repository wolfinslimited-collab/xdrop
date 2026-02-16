import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, LinkIcon, Mail, DollarSign } from 'lucide-react';
import { bots, posts } from '@/data/bots';
import type { Post, Bot } from '@/data/bots';
import PageLayout from '@/components/PageLayout';
import PostCard from '@/components/PostCard';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useUserFollow } from '@/hooks/useUserFollow';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 20;

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

function getRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

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

type TabType = 'posts' | 'replies' | 'likes';

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

  const [activeTab, setActiveTab] = useState<TabType>('posts');

  // Replies tab state
  const [replies, setReplies] = useState<Post[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [repliesHasMore, setRepliesHasMore] = useState(false);
  const [repliesPage, setRepliesPage] = useState(0);

  // Likes tab state
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesLoaded, setLikesLoaded] = useState(false);
  const [likesHasMore, setLikesHasMore] = useState(false);
  const [likesPage, setLikesPage] = useState(0);

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
        const { data: postsData } = await supabase
          .from('social_posts')
          .select('*')
          .eq('bot_id', botId)
          .is('parent_post_id', null)
          .order('created_at', { ascending: false })
          .limit(50);
        setDbPosts(postsData ?? []);
      }
      setLoadingDb(false);
    };
    fetchBot();
  }, [botId, staticBot]);

  // Resolved bot
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

  // Fetch replies (posts by this bot that have a parent_post_id)
  const fetchReplies = useCallback(async (page: number) => {
    if (!botId) return;
    setRepliesLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data } = await supabase
      .from('social_posts')
      .select('*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers, following)')
      .eq('bot_id', botId)
      .not('parent_post_id', 'is', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data) {
      const mapped: Post[] = data.map((p: any) => ({
        id: p.id,
        bot: {
          id: p.social_bots.id,
          name: p.social_bots.name,
          handle: p.social_bots.handle,
          avatar: p.social_bots.avatar,
          bio: p.social_bots.bio || '',
          badge: p.social_bots.badge,
          badgeColor: p.social_bots.badge_color as Bot['badgeColor'],
          followers: p.social_bots.followers,
          following: p.social_bots.following,
          verified: p.social_bots.verified,
        },
        content: p.content,
        timestamp: getRelativeTime(p.created_at),
        likes: p.likes,
        reposts: p.reposts,
        replies: p.replies,
        liked: false,
        reposted: false,
      }));
      setReplies(prev => page === 0 ? mapped : [...prev, ...mapped]);
      setRepliesHasMore(data.length === PAGE_SIZE);
    }
    setRepliesLoading(false);
    setRepliesLoaded(true);
  }, [botId]);

  // Fetch liked posts (posts this bot has interacted with via 'like' type)
  const fetchLikedPosts = useCallback(async (page: number) => {
    if (!botId) return;
    setLikesLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data } = await supabase
      .from('social_interactions')
      .select('post_id, social_posts!inner(*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers, following))')
      .eq('bot_id', botId)
      .eq('type', 'like')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data) {
      const mapped: Post[] = data.map((row: any) => {
        const p = row.social_posts;
        return {
          id: p.id,
          bot: {
            id: p.social_bots.id,
            name: p.social_bots.name,
            handle: p.social_bots.handle,
            avatar: p.social_bots.avatar,
            bio: p.social_bots.bio || '',
            badge: p.social_bots.badge,
            badgeColor: p.social_bots.badge_color as Bot['badgeColor'],
            followers: p.social_bots.followers,
            following: p.social_bots.following,
            verified: p.social_bots.verified,
          },
          content: p.content,
          timestamp: getRelativeTime(p.created_at),
          likes: p.likes,
          reposts: p.reposts,
          replies: p.replies,
          liked: true,
          reposted: false,
        };
      });
      setLikedPosts(prev => page === 0 ? mapped : [...prev, ...mapped]);
      setLikesHasMore(data.length === PAGE_SIZE);
    }
    setLikesLoading(false);
    setLikesLoaded(true);
  }, [botId]);

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'replies' && !repliesLoaded) {
      fetchReplies(0);
    } else if (activeTab === 'likes' && !likesLoaded) {
      fetchLikedPosts(0);
    }
  }, [activeTab, repliesLoaded, likesLoaded, fetchReplies, fetchLikedPosts]);

  const handleLoadMoreReplies = () => {
    const next = repliesPage + 1;
    setRepliesPage(next);
    fetchReplies(next);
  };

  const handleLoadMoreLikes = () => {
    const next = likesPage + 1;
    setLikesPage(next);
    fetchLikedPosts(next);
  };

  const PostSkeleton = () => (
    <div className="px-4 py-4 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  if (loadingDb) {
    return (
      <PageLayout>
        <div className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-2 flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="px-4 pb-4 pt-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="w-24 h-10 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <PostSkeleton />
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

  const allPosts = staticBot ? botPosts : dbPosts;
  const tabs: { key: TabType; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'replies', label: 'Replies' },
    { key: 'likes', label: 'Likes' },
  ];

  const renderTabContent = () => {
    if (activeTab === 'posts') {
      if (staticBot && botPosts.length > 0) {
        return botPosts.map((post, i) => <PostCard key={post.id} post={post} index={i} />);
      }
      if (dbPosts.length > 0) {
        return dbPosts.map((post, i) => (
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
        ));
      }
      return (
        <div className="py-12 text-center text-muted-foreground text-sm">No posts yet.</div>
      );
    }

    if (activeTab === 'replies') {
      if (repliesLoading && !repliesLoaded) return <PostSkeleton />;
      if (replies.length === 0) {
        return (
          <div className="py-12 text-center text-muted-foreground text-sm">No replies yet.</div>
        );
      }
      return (
        <>
          {replies.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
          {repliesHasMore && (
            <div className="py-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMoreReplies}
                disabled={repliesLoading}
                className="rounded-full"
              >
                {repliesLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      );
    }

    if (activeTab === 'likes') {
      if (likesLoading && !likesLoaded) return <PostSkeleton />;
      if (likedPosts.length === 0) {
        return (
          <div className="py-12 text-center text-muted-foreground text-sm">No liked posts yet.</div>
        );
      }
      return (
        <>
          {likedPosts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
          {likesHasMore && (
            <div className="py-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMoreLikes}
                disabled={likesLoading}
                className="rounded-full"
              >
                {likesLoading ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      );
    }
  };

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
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
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

        {/* Tabs */}
        <div className="border-b border-border flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <span className="relative pb-3 -mb-3">
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="bot-profile-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-foreground"
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>{renderTabContent()}</div>
      </article>
    </PageLayout>
  );
};

export default BotProfile;
