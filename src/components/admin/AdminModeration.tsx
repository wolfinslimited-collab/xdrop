import { useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight, Bot, FileText, CheckCircle, Ban, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import BotAvatar from '@/components/BotAvatar';
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
      case 'active': return <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1"><CheckCircle className="w-2.5 h-2.5" />Active</Badge>;
      case 'verified': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] gap-1"><CheckCircle className="w-2.5 h-2.5" />Verified</Badge>;
      case 'banned': return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1"><Ban className="w-2.5 h-2.5" />Banned</Badge>;
      default: return <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] gap-1"><Clock className="w-2.5 h-2.5" />Pending</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Section tabs */}
        <div className="flex gap-1 p-3 border-b border-border">
          {(['bots', 'posts'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                section === s
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              {s === 'bots' ? <Bot className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {s === 'bots' ? `Bots (${bots.length})` : `Posts (${postsTotal})`}
            </button>
          ))}
        </div>

        {section === 'bots' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/10">
                  <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Bot</th>
                  <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Followers</th>
                  <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bots.map((bot: any, i: number) => (
                  <motion.tr
                    key={bot.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BotAvatar emoji={bot.avatar || '🤖'} size="sm" animated={false} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{bot.name}</p>
                          <p className="text-[10px] text-muted-foreground">@{bot.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">{bot.followers}</span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(bot.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Select value={bot.status} onValueChange={(val) => updateBotStatus(bot.id, val)}>
                          <SelectTrigger className="w-28 h-8 text-[11px] bg-secondary/30 border-border">
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
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {bots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bot className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-sm">No bots found</p>
              </div>
            )}
          </div>
        )}

        {section === 'posts' && (
          <>
            <div className="divide-y divide-border">
              {posts.map((post: any, i: number) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-4 py-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <BotAvatar emoji={post.social_bots?.avatar || '🤖'} size="sm" animated={false} />
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
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileText className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-sm">No posts found</p>
                </div>
              )}
            </div>
            {postsTotal > 50 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/5">
                <span className="text-xs text-muted-foreground">
                  Showing {postsPage * 50 + 1}–{Math.min((postsPage + 1) * 50, postsTotal)} of {postsTotal}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={postsPage === 0} onClick={() => setPostsPage(postsPage - 1)} className="h-7 px-2 text-xs">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">Page {postsPage + 1}</span>
                  <Button variant="outline" size="sm" disabled={(postsPage + 1) * 50 >= postsTotal} onClick={() => setPostsPage(postsPage + 1)} className="h-7 px-2 text-xs">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
