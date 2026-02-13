import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Clock, ChevronLeft, ChevronRight, DollarSign, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

async function adminFetch(action: string, session: any, opts?: { page?: number }) {
  const params = new URLSearchParams({ action });
  if (opts?.page !== undefined) params.set('page', String(opts.page));
  const res = await fetch(`${FUNC_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

type View = 'purchases' | 'trials';

export default function AdminPurchases({ session }: { session: any }) {
  const [view, setView] = useState<View>('purchases');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [totalP, setTotalP] = useState(0);
  const [totalT, setTotalT] = useState(0);
  const [pageP, setPageP] = useState(0);
  const [pageT, setPageT] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback(async (p: number) => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await adminFetch('list-purchases', session, { page: p });
      setPurchases(data.purchases || []);
      setTotalP(data.total || 0);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [session]);

  const fetchTrials = useCallback(async (p: number) => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await adminFetch('list-trials', session, { page: p });
      setTrials(data.trials || []);
      setTotalT(data.total || 0);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (view === 'purchases') fetchPurchases(pageP);
    else fetchTrials(pageT);
  }, [view, pageP, pageT, fetchPurchases, fetchTrials]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getTrialStatus = (t: any) => {
    if (t.status === 'expired' || new Date(t.expires_at) < new Date()) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Expired</Badge>;
    }
    return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  const tabs = [
    { id: 'purchases' as const, label: 'Purchases', icon: ShoppingCart, count: totalP },
    { id: 'trials' as const, label: 'Trials', icon: PlayCircle, count: totalT },
  ];

  const items = view === 'purchases' ? purchases : trials;
  const total = view === 'purchases' ? totalP : totalT;
  const page = view === 'purchases' ? pageP : pageT;
  const setPage = view === 'purchases' ? setPageP : setPageT;

  return (
    <div className="p-6">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-3 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === t.id ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/60">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">User</th>
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Agent</th>
                {view === 'purchases' && (
                  <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Price</th>
                )}
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  {view === 'purchases' ? 'Status' : 'Trial Status'}
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item: any, i: number) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {item.profile?.avatar_url ? (
                        <img src={item.profile.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                          {(item.profile?.display_name || '?')[0]}
                        </div>
                      )}
                      <span className="text-sm text-foreground truncate max-w-[140px]">{item.profile?.display_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.agent?.avatar || '🤖'}</span>
                      <div>
                        <p className="text-sm text-foreground truncate max-w-[160px]">{item.agent?.name || item.template_id || 'Unknown'}</p>
                        {item.agent?.template_id && (
                          <p className="text-[10px] text-muted-foreground">{item.agent.template_id}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  {view === 'purchases' && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-accent" />
                        <span className="text-sm font-medium text-foreground">{item.price_paid} USDC</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {view === 'purchases' ? (
                      <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
                        {item.subscription_status || 'one_time'}
                      </Badge>
                    ) : (
                      getTrialStatus(item)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(view === 'purchases' ? item.purchased_at : item.started_at)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">No {view} found</p>
          </div>
        )}

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
