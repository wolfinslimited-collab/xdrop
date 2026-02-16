import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Coins, Users, UserPlus, UserCheck, UserMinus, ExternalLink, Bot, FileText, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminUsers } from '@/hooks/useAdmin';

export default function AdminUsers({ session }: { session: any }) {
  const { users, roles, total, page, setPage, loading, setRole } = useAdminUsers(session);
  const [search, setSearch] = useState('');
  const rolesMap = new Map(roles.map((r: any) => [r.user_id, r.role]));

  const filtered = search
    ? users.filter((u: any) => (u.display_name || '').toLowerCase().includes(search.toLowerCase()))
    : users;

  // Compute user summary metrics (must be before early returns)
  const userMetrics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();

    const newToday = users.filter((u: any) => u.created_at >= todayStart).length;
    const active = users.filter((u: any) => u.credits !== 25 || u.created_at >= thirtyDaysAgo).length;
    const cohort = users.filter((u: any) => u.created_at >= sixtyDaysAgo && u.created_at < thirtyDaysAgo);
    const churned = cohort.filter((u: any) => u.credits === 25).length;
    const churnRate = cohort.length > 0 ? Math.round((churned / cohort.length) * 100) : 0;

    return { newToday, active, churnRate };
  }, [users]);

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-medium">Admin</Badge>;
      case 'moderator': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-medium">Mod</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">User</Badge>;
    }
  };

  const summaryCards = [
    { label: 'Total Users', value: total, icon: Users, color: 'text-foreground' },
    { label: 'Active Users', value: userMetrics.active, icon: UserCheck, color: 'text-success' },
    { label: 'New Today', value: userMetrics.newToday, icon: UserPlus, color: 'text-accent' },
    { label: 'Churn Rate', value: `${userMetrics.churnRate}%`, icon: UserMinus, color: 'text-destructive' },
  ];

  const formatLastActive = (date: string | null) => {
    if (!date) return '—';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-card rounded-lg border border-border px-3 py-2.5"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-muted-foreground">{card.label}</span>
              <card.icon className={`w-3.5 h-3.5 ${card.color} opacity-60`} />
            </div>
            <p className={`text-lg font-bold font-display tracking-tight ${card.color}`}>
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-secondary/30 border-border text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{total} users</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">User</th>
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Role</th>
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Credits</th>
                <th className="text-center px-3 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium" title="Deposits">Dep.</th>
                <th className="text-center px-3 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium" title="Agents Created">Agents</th>
                <th className="text-center px-3 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium" title="Bots Deployed">Bots</th>
                <th className="text-center px-3 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium" title="Posts Created">Posts</th>
                <th className="text-center px-3 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium" title="Follows">Follows</th>
                <th className="text-left px-3 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Last Active</th>
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Joined</th>
                <th className="text-right px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u: any, i: number) => {
                const role = rolesMap.get(u.id) || 'user';
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-secondary text-muted-foreground">
                            {(u.display_name || '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{u.display_name || 'Unknown'}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(role)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3 h-3 text-accent" />
                        <span className="text-sm text-foreground font-medium">{u.credits}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => window.open(`/credits`, '_blank')}
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors cursor-pointer group"
                        title="View transactions"
                      >
                        {u.deposit_count || 0}
                        <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm text-foreground">{u.agent_count || 0}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm text-foreground">{u.bot_count || 0}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm text-foreground">{u.post_count || 0}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm text-foreground">{u.follow_count || 0}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatLastActive(u.last_active)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Select value={role} onValueChange={(val) => setRole(u.id, val === 'user' ? 'remove' : val)}>
                          <SelectTrigger className="w-28 h-8 text-[11px] bg-secondary/30 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/5">
            <span className="text-xs text-muted-foreground">
              Showing {page * 50 + 1}–{Math.min((page + 1) * 50, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="h-7 px-2 text-xs">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">Page {page + 1}</span>
              <Button variant="outline" size="sm" disabled={(page + 1) * 50 >= total} onClick={() => setPage(page + 1)} className="h-7 px-2 text-xs">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
