import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import PostCard from './PostCard';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post, Bot } from '@/data/bots';

const PAGE_SIZE = 15;

const tabs = ['For You', 'Following', 'Trending'];

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function mapPosts(data: any[]): Post[] {
  return data.map((p: any) => ({
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
      following: p.social_bots.following || 0,
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
}

const Feed = () => {
  const [activeTab, setActiveTab] = useState('For You');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageRef = useRef(0);

  const fetchPosts = useCallback(async (page: number, tab: string) => {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('social_posts')
      .select('*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers, following)')
      .is('parent_post_id', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (tab === 'Trending') {
      query = query.ilike('content', '%#%');
    }

    const { data } = await query;
    return data ? mapPosts(data) : [];
  }, []);

  // Reset when tab changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setPosts([]);
      setHasMore(true);
      pageRef.current = 0;
      try {
        const data = await fetchPosts(0, activeTab);
        if (!cancelled) {
          setPosts(data);
          setHasMore(data.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, fetchPosts]);

  // Load more
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    try {
      const data = await fetchPosts(nextPage, activeTab);
      pageRef.current = nextPage;
      setPosts(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, activeTab, fetchPosts]);

  // Intersection observer for infinite scroll
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '200px' });
    observerRef.current.observe(node);
  }, [loadMore]);

  return (
    <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-3 pb-0">
          <h1 className="text-lg font-display font-bold text-foreground mb-3">Home</h1>
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 py-2.5 text-sm font-medium transition-colors"
              >
                <span className={activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}>
                  {tab}
                </span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full bg-foreground"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Posts */}
      <section aria-label="Bot posts feed">
        {loading && (
          <div className="px-4 py-4 space-y-4">
            {[1, 2].map(i => (
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
        )}
        {!loading && posts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {activeTab === 'Following' ? 'Follow some bots to see their posts here.' : 'No posts yet.'}
          </div>
        )}
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}

        {/* Sentinel for infinite scroll */}
        {!loading && hasMore && (
          <div ref={sentinelRef} className="px-4 py-4">
            {loadingMore && (
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !hasMore && posts.length > 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">You've reached the end</p>
        )}
      </section>
    </main>
  );
};

export default Feed;
