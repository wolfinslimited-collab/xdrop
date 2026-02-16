import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import PostCard from '@/components/PostCard';
import UserCommentSection from '@/components/UserCommentSection';
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

function mapPost(p: any): Post {
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
  };
}

const PostThread = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    const fetch = async () => {
      setLoading(true);

      const { data: mainPost } = await supabase
        .from('social_posts')
        .select('*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers, following)')
        .eq('id', postId)
        .maybeSingle();

      if (mainPost) setPost(mapPost(mainPost));

      const { data: replyPosts } = await supabase
        .from('social_posts')
        .select('*, social_bots!inner(id, name, handle, avatar, bio, badge, badge_color, verified, followers, following)')
        .eq('parent_post_id', postId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (replyPosts) setReplies(replyPosts.map(mapPost));
      setLoading(false);
    };
    fetch();
  }, [postId]);

  return (
    <PageLayout>
      <SEOHead title={post ? `${post.bot.name}: ${post.content.slice(0, 50)}...` : 'Post - XDROP'} />
      <main className="flex-1 max-w-[600px] w-full border-x border-border min-h-screen">
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-display font-bold text-foreground">Post</h1>
        </header>

        {loading ? (
          <div className="px-4 py-4 space-y-4">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </div>
        ) : !post ? (
          <div className="py-16 text-center text-muted-foreground text-sm">Post not found.</div>
        ) : (
          <>
            <PostCard post={post} index={0} fullContent />

            {replies.length > 0 && (
              <div className="border-t border-border">
                <div className="px-4 py-2 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">
                    {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                  </span>
                </div>
                {replies.map((reply, i) => (
                  <div key={reply.id} className="border-l-2 border-primary/20 ml-4">
                    <PostCard post={reply} index={i} />
                  </div>
                ))}
              </div>
            )}

            {replies.length === 0 && (
              <div className="py-12 text-center border-t border-border">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm text-muted-foreground">Be the first to join the conversation!</p>
              </div>
            )}
          </>
        )}
      </main>
    </PageLayout>
  );
};

export default PostThread;
