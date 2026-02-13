import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Eye, BarChart3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck, useAdminUsers, useAdminModeration, useAdminAnalytics } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type Tab = 'users' | 'moderation' | 'analytics';

const AdminPanel = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { isAdmin, checking } = useAdminCheck();
  const [tab, setTab] = useState<Tab>('analytics');

  if (authLoading || checking) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <PageLayout>
      <SEOHead title="Admin Panel — XDROP" description="Platform administration" canonicalPath="/admin" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <div className="flex gap-4">
            {(['analytics', 'users', 'moderation'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors capitalize ${
                  tab === t ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        {tab === 'analytics' && <AnalyticsTab session={session} />}
        {tab === 'users' && <UsersTab session={session} />}
        {tab === 'moderation' && <ModerationTab session={session} />}
      </main>
    </PageLayout>
  );
};

function AnalyticsTab({ session }: { session: any }) {
  const { stats, loading } = useAdminAnalytics(session);

  if (loading) return <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (!stats) return <p className="p-4 text-muted-foreground">Failed to load analytics.</p>;

  const items = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Signups (7d)', value: stats.recentSignups, icon: BarChart3 },
    { label: 'Total Bots', value: stats.totalBots, icon: Eye },
    { label: 'Total Posts', value: stats.totalPosts, icon: BarChart3 },
    { label: 'Agents Created', value: stats.totalAgents, icon: Shield },
    { label: 'Agent Purchases', value: stats.totalPurchases, icon: BarChart3 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <item.icon className="w-5 h-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-bold text-foreground">{item.value ?? 0}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

function UsersTab({ session }: { session: any }) {
  const { users, roles, total, page, setPage, loading, setRole } = useAdminUsers(session);
  const rolesMap = new Map(roles.map((r: any) => [r.user_id, r.role]));

  if (loading) return <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <div>
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">{total} total users</div>
      <div className="divide-y divide-border">
        {users.map((u: any) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {(u.display_name || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.display_name || 'Unknown'}</p>
                <p className="text-[10px] text-muted-foreground">{u.credits} credits · Joined {new Date(u.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <Select
              value={rolesMap.get(u.id) || 'user'}
              onValueChange={(val) => setRole(u.id, val === 'user' ? 'remove' : val)}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      {total > 50 && (
        <div className="flex items-center justify-center gap-4 py-3 border-t border-border">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1}</span>
          <Button variant="ghost" size="sm" disabled={(page + 1) * 50 >= total} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ModerationTab({ session }: { session: any }) {
  const { bots, posts, postsTotal, postsPage, setPostsPage, loading, updateBotStatus, deletePost } = useAdminModeration(session);
  const [section, setSection] = useState<'bots' | 'posts'>('bots');

  if (loading) return <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  return (
    <div>
      <div className="flex gap-4 px-4 py-2 border-b border-border">
        {(['bots', 'posts'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`text-xs font-medium pb-1 border-b transition-colors capitalize ${
              section === s ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
            }`}
          >
            {s} ({s === 'bots' ? bots.length : postsTotal})
          </button>
        ))}
      </div>

      {section === 'bots' && (
        <div className="divide-y divide-border">
          {bots.map((bot: any) => (
            <div key={bot.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">{bot.avatar}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{bot.name}</p>
                  <p className="text-[10px] text-muted-foreground">@{bot.handle} · {bot.followers} followers</p>
                </div>
              </div>
              <Select
                value={bot.status}
                onValueChange={(val) => updateBotStatus(bot.id, val)}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
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
          ))}
        </div>
      )}

      {section === 'posts' && (
        <div>
          <div className="divide-y divide-border">
            {posts.map((post: any) => (
              <div key={post.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{post.social_bots?.avatar}</span>
                    <span className="text-xs font-medium text-foreground">{post.social_bots?.name}</span>
                    <span className="text-[10px] text-muted-foreground">@{post.social_bots?.handle}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-destructive hover:bg-destructive/10"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  ❤️ {post.likes} · 🔁 {post.reposts} · 💬 {post.replies} · {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          {postsTotal > 50 && (
            <div className="flex items-center justify-center gap-4 py-3 border-t border-border">
              <Button variant="ghost" size="sm" disabled={postsPage === 0} onClick={() => setPostsPage(postsPage - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground">Page {postsPage + 1}</span>
              <Button variant="ghost" size="sm" disabled={(postsPage + 1) * 50 >= postsTotal} onClick={() => setPostsPage(postsPage + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
