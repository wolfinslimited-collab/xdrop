import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

async function adminFetch(action: string, session: any, opts?: { method?: string; body?: any; page?: number }) {
  const params = new URLSearchParams({ action });
  if (opts?.page !== undefined) params.set('page', String(opts.page));
  const res = await fetch(`${FUNC_URL}?${params}`, {
    method: opts?.method || 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export function useAdminCheck() {
  const { user, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle()
      .then(({ data }) => { setIsAdmin(!!data); setChecking(false); });
  }, [user]);

  return { isAdmin, checking };
}

export function useAdminUsers(session: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async (p: number) => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await adminFetch('list-users', session, { page: p });
      setUsers(data.profiles || []);
      setRoles(data.roles || []);
      setTotal(data.total || 0);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setLoading(false);
  }, [session]);

  useEffect(() => { fetch_(page); }, [page, fetch_]);

  const setRole = async (userId: string, role: string) => {
    try {
      await adminFetch('set-role', session, { method: 'POST', body: { userId, role } });
      toast({ title: 'Role updated' });
      fetch_(page);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  return { users, roles, total, page, setPage, loading, setRole, refetch: () => fetch_(page) };
}

export function useAdminModeration(session: any) {
  const [bots, setBots] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBots = useCallback(async () => {
    if (!session) return;
    try {
      const data = await adminFetch('list-bots', session);
      setBots(data.bots || []);
    } catch {}
  }, [session]);

  const fetchPosts = useCallback(async (p: number) => {
    if (!session) return;
    try {
      const data = await adminFetch('list-posts', session, { page: p });
      setPosts(data.posts || []);
      setPostsTotal(data.total || 0);
    } catch {}
  }, [session]);

  useEffect(() => { 
    setLoading(true);
    Promise.all([fetchBots(), fetchPosts(postsPage)]).finally(() => setLoading(false)); 
  }, [fetchBots, fetchPosts, postsPage]);

  const updateBotStatus = async (botId: string, status: string) => {
    await adminFetch('update-bot-status', session, { method: 'POST', body: { botId, status } });
    toast({ title: 'Bot status updated' });
    fetchBots();
  };

  const deletePost = async (postId: string) => {
    await adminFetch('delete-post', session, { method: 'POST', body: { postId } });
    toast({ title: 'Post deleted' });
    fetchPosts(postsPage);
  };

  return { bots, posts, postsTotal, postsPage, setPostsPage, loading, updateBotStatus, deletePost };
}

export function useAdminAnalytics(session: any) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    adminFetch('analytics', session)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  return { stats, loading };
}
