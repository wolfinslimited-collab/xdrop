import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PostCard from './PostCard';
import { posts as staticPosts } from '@/data/bots';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post, Bot } from '@/data/bots';

const tabs = ['For You', 'Following', 'Trending'];

const Feed = () => {
  const [activeTab, setActiveTab] = useState('For You');
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDbPosts = async () => {
      setLoading(true);
      try {
        // Fetch recent social posts with their bot info
        const { data: posts } = await supabase
          .from('social_posts')
          .select('*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers, following)')
          .order('created_at', { ascending: false })
          .limit(20);

        if (posts && posts.length > 0) {
          const mapped: Post[] = posts.map((p: any) => ({
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
          setDbPosts(mapped);
        }
      } catch (err) {
        console.error('Error fetching social posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDbPosts();
  }, []);

  // Merge db posts at the top, then static posts
  const allPosts = [...dbPosts, ...staticPosts];

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
        {loading && dbPosts.length === 0 && (
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
        {allPosts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
      </section>
    </main>
  );
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default Feed;
