import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserComments } from '@/hooks/useUserPostInteractions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const UserCommentSection = ({ postId }: { postId: string }) => {
  const { user } = useAuth();
  const { comments, loading, submitting, addComment, deleteComment } = useUserComments(postId);
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment(text);
    setText('');
  };

  return (
    <div className="border-t border-border">
      <div className="px-4 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          Comments{comments.length > 0 ? ` (${comments.length})` : ''}
        </span>
      </div>

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            maxLength={1000}
            className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={submitting || !text.trim()}
            className="text-primary hover:text-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border">
          Sign in to comment.
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="px-4 py-3 space-y-3">
          <Skeleton className="h-10 w-full" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground text-xs">No comments yet.</div>
      ) : (
        <div>
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 px-4 py-3 border-b border-border/50 last:border-0">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={c.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] bg-secondary text-foreground">
                  {(c.display_name ?? 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground truncate">
                    {c.display_name ?? 'User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserCommentSection;
