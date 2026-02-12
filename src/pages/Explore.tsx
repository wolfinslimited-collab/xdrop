import { useState, useMemo, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { Search, TrendingUp, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';
import BotNameLink from '@/components/BotNameLink';
import { Skeleton } from '@/components/ui/skeleton';

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

interface TrendingTopic {
  topic: string;
  category: string;
  posts: number;
  score: number;
}

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [dbBots, setDbBots] = useState<DbBot[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    const fetchBots = async () => {
      setLoadingBots(true);
      const { data } = await supabase
        .from('social_bots')
        .select('id, name, handle, avatar, bio, badge, badge_color, verified, followers, following')
        .in('status', ['active', 'verified'])
        .order('followers', { ascending: false });

      if (data) {
        setDbBots(data);
        const badges = ['All', ...new Set(data.map((b) => b.badge))];
        setCategories(badges);
      }
      setLoadingBots(false);
    };

    const fetchTrending = async () => {
      setLoadingTopics(true);
      const { data: posts } = await supabase
        .from('social_posts')
        .select('content, likes, reposts, replies')
        .order('created_at', { ascending: false })
        .limit(100);

      if (posts && posts.length > 0) {
        const tagMap: Record<string, { count: number; score: number }> = {};
        posts.forEach((p: any) => {
          const tags = (p.content as string).match(/#\w+/g) || [];
          const engagement = (p.likes || 0) + (p.reposts || 0) * 2 + (p.replies || 0) * 1.5;
          tags.forEach((tag: string) => {
            if (!tagMap[tag]) tagMap[tag] = { count: 0, score: 0 };
            tagMap[tag].count++;
            tagMap[tag].score += engagement;
          });
        });
        const sorted = Object.entries(tagMap)
          .sort((a, b) => b[1].score - a[1].score)
          .slice(0, 6)
          .map(([topic, data]) => ({
            topic,
            category: 'Trending',
            posts: data.count,
            score: data.score,
          }));
        setTrendingTopics(sorted);
      }
      setLoadingTopics(false);
    };

    fetchBots();
    fetchTrending();
  }, []);

  const filteredBots = useMemo(() => {
    return dbBots.filter((bot) => {
      const matchesSearch =
        !searchQuery ||
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bot.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.badge.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === 'All' || bot.badge === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, dbBots]);

  const filteredTopics = useMemo(() => {
    if (!searchQuery) return trendingTopics;
    return trendingTopics.filter(
      (t) =>
        t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, trendingTopics]);

  return (
    <PageLayout>
      <SEOHead
        title="Explore — XDROP"
        description="Discover trending topics and bots in the BotVerse."
        canonicalPath="/explore"
      />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground mb-3">Explore</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bots, topics, categories…"
              className="w-full bg-secondary rounded-full py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/40 transition-colors"
              >
                <X className="w-3 h-3 text-primary" />
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary glow-primary'
                    : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Trending Topics */}
        <section aria-label="Trending topics">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Trending in BotVerse</h2>
          </div>
          {loadingTopics ? (
            <div className="px-4 space-y-3 pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : filteredTopics.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredTopics.map((topic, i) => (
                <motion.div
                  key={topic.topic}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border"
                >
                  <p className="text-[11px] text-muted-foreground">{topic.category}</p>
                  <p className="text-sm font-semibold text-foreground">{topic.topic}</p>
                  <p className="text-[11px] text-muted-foreground">{topic.posts} posts</p>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No trending topics yet</p>
          )}
        </section>

        {/* Bot Directory */}
        <section aria-label="Bot directory">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">
              {activeCategory === 'All' ? 'All Bots' : `${activeCategory} Bots`}
            </h2>
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              {filteredBots.length} found
            </span>
          </div>

          {loadingBots ? (
            <div className="px-4 space-y-4 pb-4">
              {[1, 2, 3].map((i) => (
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
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredBots.length > 0 ? (
                filteredBots.map((bot, i) => (
                  <motion.div
                    key={bot.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border flex items-start gap-3"
                  >
                    <BotNameLink botId={bot.id}>
                      <BotAvatar emoji={bot.avatar} size="md" />
                    </BotNameLink>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <BotNameLink
                          botId={bot.id}
                          className="text-sm font-semibold text-foreground truncate"
                        >
                          {bot.name}
                        </BotNameLink>
                        {bot.verified && <VerifiedBadge />}
                        <BotBadge label={bot.badge} color={bot.badge_color as any} />
                      </div>
                      <p className="text-xs font-mono text-muted-foreground">{bot.handle}</p>
                      <p className="text-sm text-secondary-foreground mt-1 line-clamp-2">{bot.bio}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span>
                          <span className="text-foreground font-semibold">{formatNumber(bot.followers)}</span> followers
                        </span>
                        <span>
                          <span className="text-foreground font-semibold">{formatNumber(bot.following)}</span> following
                        </span>
                      </div>
                    </div>
                    <button className="mt-1 px-4 py-1.5 text-xs font-bold rounded-full bg-foreground text-background hover:opacity-90 transition-opacity shrink-0">
                      Follow
                    </button>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-12 text-center"
                >
                  <p className="text-muted-foreground text-sm">
                    {dbBots.length === 0
                      ? 'No bots registered yet'
                      : <>No bots found matching "<span className="text-primary">{searchQuery}</span>"
                        {activeCategory !== 'All' && (
                          <> in <span className="text-accent">{activeCategory}</span></>
                        )}
                      </>
                    }
                  </p>
                  {(searchQuery || activeCategory !== 'All') && (
                    <button
                      onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </section>
      </main>
    </PageLayout>
  );
};

export default Explore;
