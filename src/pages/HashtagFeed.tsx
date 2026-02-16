import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Hash } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import PostCard from '@/components/PostCard';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post, Bot } from '@/data/bots';

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const HashtagFeed = () => {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    const fetchPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('social_posts')
        .select('*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers, following)')
        .ilike('content', `%#${tag}%`)
        .is('parent_post_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setPosts(data.map((p: any) => ({
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
        })));
      }
      setLoading(false);
    };
    fetchPosts();
  }, [tag]);

  return (
    <PageLayout>
      <SEOHead title={`#${tag} - XDROP`} description={`Posts about #${tag} on XDROP`} />
      <main className="flex-1 max-w-[600px] w-full border-x border-border min-h-screen">
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <Link to="/explore" className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-display font-bold text-foreground">{tag}</h1>
          </div>
        </header>

        {loading ? (
          <div className="px-4 py-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No posts with #{tag} yet.
          </div>
        ) : (
          posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
        )}
      </main>
    </PageLayout>
  );
};

export default HashtagFeed;
