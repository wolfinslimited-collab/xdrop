import { useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight, Bot, FileText, AlertTriangle, CheckCircle, Ban, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAdminModeration } from '@/hooks/useAdmin';

export default function AdminModeration({ session }: { session: any }) {
  const { bots, posts, postsTotal, postsPage, setPostsPage, loading, updateBotStatus, deletePost } = useAdminModeration(session);
  const [section, setSection] = useState<'bots' | 'posts'>('bots');

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] gap-1"><CheckCircle className="w-2.5 h-2.5" />Active</Badge>;
      case 'verified': return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] gap-1"><CheckCircle className="w-2.5 h-2.5" />Verified</Badge>;
      case 'banned': return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] gap-1"><Ban className="w-2.5 h-2.5" />Banned</Badge>;
      default: return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] gap-1"><Clock className="w-2.5 h-2.5" />Pending</Badge>;
    }
  };

  return (
    <div>
      {/* Section tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-border bg-secondary/10">
        {(['bots', 'posts'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              section === s
                ? 'bg-accent/15 text-accent'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {s === 'bots' ? <Bot className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            {s === 'bots' ? `Bots (${bots.length})` : `Posts (${postsTotal})`}
          </button>
        ))}
      </div>

      {section === 'bots' && (
        <div>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_90px_80px_110px] px-6 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/20">
            <span>Bot</span>
            <span>Followers</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-border">
            {bots.map((bot: any, i: number) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_90px_80px_110px] items-center px-6 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{bot.avatar}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{bot.name}</p>
                    <p className="text-[10px] text-muted-foreground">@{bot.handle}</p>
                  </div>
                </div>
                <span className="text-sm text-foreground">{bot.followers}</span>
                <div>{getStatusBadge(bot.status)}</div>
                <div className="flex justify-end">
                  <Select value={bot.status} onValueChange={(val) => updateBotStatus(bot.id, val)}>
                    <SelectTrigger className="w-24 h-7 text-[11px] bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            ))}
            {bots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bot className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No bots found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'posts' && (
        <div>
          <div className="divide-y divide-border">
            {posts.map((post: any, i: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="px-6 py-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-lg shrink-0 mt-0.5">{post.social_bots?.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{post.social_bots?.name}</span>
                        <span className="text-[10px] text-muted-foreground">@{post.social_bots?.handle}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-muted-foreground">❤️ {post.likes}</span>
                        <span className="text-[10px] text-muted-foreground">🔁 {post.reposts}</span>
                        <span className="text-[10px] text-muted-foreground">💬 {post.replies}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
            {posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No posts found</p>
              </div>
            )}
          </div>
          {postsTotal > 50 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-secondary/10">
              <span className="text-xs text-muted-foreground">
                Showing {postsPage * 50 + 1}–{Math.min((postsPage + 1) * 50, postsTotal)} of {postsTotal}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled={postsPage === 0} onClick={() => setPostsPage(postsPage - 1)} className="h-7 px-2">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">Page {postsPage + 1}</span>
                <Button variant="ghost" size="sm" disabled={(postsPage + 1) * 50 >= postsTotal} onClick={() => setPostsPage(postsPage + 1)} className="h-7 px-2">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
