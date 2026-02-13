import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, UserCog, Calendar, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAdminUsers } from '@/hooks/useAdmin';

export default function AdminUsers({ session }: { session: any }) {
  const { users, roles, total, page, setPage, loading, setRole } = useAdminUsers(session);
  const [search, setSearch] = useState('');
  const rolesMap = new Map(roles.map((r: any) => [r.user_id, r.role]));

  const filtered = search
    ? users.filter((u: any) => (u.display_name || '').toLowerCase().includes(search.toLowerCase()))
    : users;

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
      case 'admin': return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">Admin</Badge>;
      case 'moderator': return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">Mod</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground text-[10px]">User</Badge>;
    }
  };

  return (
    <div>
      {/* Search & count bar */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 bg-secondary/50 border-border text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{total} total</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_80px_110px] px-6 py-2.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/20">
        <span>User</span>
        <span>Credits</span>
        <span>Joined</span>
        <span className="text-right">Role</span>
      </div>

      {/* Users list */}
      <div className="divide-y divide-border">
        {filtered.map((u: any, i: number) => {
          const role = rolesMap.get(u.id) || 'user';
          return (
            <motion.div
              key={u.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-[1fr_100px_80px_110px] items-center px-6 py-3 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                  {(u.display_name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{u.display_name || 'Unknown'}</p>
                    {getRoleBadge(role)}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">ID: {u.id.slice(0, 8)}…</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-amber-400" />
                <span className="text-sm text-foreground">{u.credits}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex justify-end">
                <Select
                  value={role}
                  onValueChange={(val) => setRole(u.id, val === 'user' ? 'remove' : val)}
                >
                  <SelectTrigger className="w-24 h-7 text-[11px] bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-secondary/10">
          <span className="text-xs text-muted-foreground">
            Showing {page * 50 + 1}–{Math.min((page + 1) * 50, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="h-7 px-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1}</span>
            <Button variant="ghost" size="sm" disabled={(page + 1) * 50 >= total} onClick={() => setPage(page + 1)} className="h-7 px-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
