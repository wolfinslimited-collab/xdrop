import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Wallet, Copy, Coins, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

/* ── shared helpers ── */
const truncAddr = (addr: string) => addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
const copyAddr = (addr: string) => { navigator.clipboard.writeText(addr); toast.success('Address copied'); };

type SortField = 'created_at' | 'amount' | 'balance_after' | 'type' | 'updated_at' | 'balance';
type SortDir = 'asc' | 'desc';
type ViewTab = 'credits' | 'crypto';

/* ── component ── */
const AdminTransactions = ({ session }: { session: any }) => {
  const [view, setView] = useState<ViewTab>('crypto');

  return (
    <div className="p-6 space-y-5">
      {/* Tab switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('crypto')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'crypto'
              ? 'bg-accent/10 text-accent border border-accent/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Crypto Wallets
        </button>
        <button
          onClick={() => setView('credits')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === 'credits'
              ? 'bg-accent/10 text-accent border border-accent/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
          }`}
        >
          <Coins className="w-4 h-4" />
          Internal Credits
        </button>
      </div>

      {view === 'credits' ? <CreditsTable /> : <CryptoWalletsTable />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   CREDITS TABLE  (credit_transactions)
   ═══════════════════════════════════════════════════ */

interface CreditTx {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string | null;
  created_at: string;
  profile?: { display_name: string; avatar_url: string | null };
}

const creditTypeColor = (type: string) => {
  switch (type) {
    case 'manual_top_up': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    case 'agent_creation': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    case 'agent_run': return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
    case 'chat_message': return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
    case 'refund': return 'bg-red-500/15 text-red-400 border-red-500/20';
    case 'signup_bonus': return 'bg-teal-500/15 text-teal-400 border-teal-500/20';
    case 'credit_purchase': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const CreditsTable = () => {
  const [rows, setRows] = useState<CreditTx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetch_ = async () => {
    setLoading(true);
    const params: Record<string, string> = { action: 'list-transactions', page: String(page), sort: sortField, dir: sortDir };
    if (typeFilter !== 'all') params.type = typeFilter;
    if (search.trim()) params.search = search.trim();
    try {
      const { data } = await supabase.functions.invoke('admin-api?' + new URLSearchParams(params).toString());
      setRows(data?.transactions || []);
      setTotal(data?.total || 0);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [page, typeFilter, sortField, sortDir]);
  useEffect(() => { const t = setTimeout(() => { setPage(0); fetch_(); }, 400); return () => clearTimeout(t); }, [search]);

  const totalPages = Math.ceil(total / 50);
  const toggleSort = (f: SortField) => { if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortField(f); setSortDir('desc'); } };
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Coins className="w-4 h-4 text-accent" /> Internal Credit Transactions
          </h2>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} records — platform credit movements</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by user or description…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-secondary/40 border-border" />
        </div>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[170px] h-9 text-sm bg-secondary/40 border-border">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="manual_top_up">Manual Top-up</SelectItem>
            <SelectItem value="agent_creation">Agent Creation</SelectItem>
            <SelectItem value="agent_run">Agent Run</SelectItem>
            <SelectItem value="chat_message">Chat Message</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="signup_bonus">Signup Bonus</SelectItem>
            <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('type')}>
                  <span className="inline-flex items-center gap-1">Type <SortIcon field="type" /></span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                  <span className="inline-flex items-center gap-1 justify-end">Amount <SortIcon field="amount" /></span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('balance_after')}>
                  <span className="inline-flex items-center gap-1 justify-end">Balance <SortIcon field="balance_after" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                  <span className="inline-flex items-center gap-1">Date <SortIcon field="created_at" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary/60 rounded animate-pulse w-20" /></td>)}</tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No credit transactions found</td></tr>
              ) : rows.map(tx => (
                <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <span className="font-medium text-foreground truncate max-w-[140px] block text-xs">{tx.profile?.display_name || 'Unknown'}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{tx.user_id.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] capitalize ${creditTypeColor(tx.type)}`}>{tx.type.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-xs ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{tx.balance_after.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">{tx.description || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   CRYPTO WALLETS TABLE  (wallets)
   ═══════════════════════════════════════════════════ */

interface WalletRow {
  id: string;
  user_id: string;
  address: string;
  currency: string;
  network: string;
  balance: number;
  created_at: string;
  updated_at: string;
  profile?: { display_name: string; avatar_url: string | null };
}

const CryptoWalletsTable = () => {
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('funded');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetch_ = async () => {
    setLoading(true);
    const params: Record<string, string> = { action: 'list-wallets', page: String(page), sort: sortField, dir: sortDir };
    if (balanceFilter !== 'all') params.balance = balanceFilter;
    if (search.trim()) params.search = search.trim();
    try {
      const { data } = await supabase.functions.invoke('admin-api?' + new URLSearchParams(params).toString());
      setRows(data?.wallets || []);
      setTotal(data?.total || 0);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [page, balanceFilter, sortField, sortDir]);
  useEffect(() => { const t = setTimeout(() => { setPage(0); fetch_(); }, 400); return () => clearTimeout(t); }, [search]);

  const totalPages = Math.ceil(total / 50);
  const toggleSort = (f: SortField) => { if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortField(f); setSortDir('desc'); } };
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent" /> Crypto Wallet Deposits
          </h2>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} wallets — external crypto deposits to user addresses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by user or wallet address…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-secondary/40 border-border" />
        </div>
        <Select value={balanceFilter} onValueChange={v => { setBalanceFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px] h-9 text-sm bg-secondary/40 border-border">
            <SelectValue placeholder="All wallets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wallets</SelectItem>
            <SelectItem value="funded">Funded (balance {'>'} 0)</SelectItem>
            <SelectItem value="empty">Empty (balance = 0)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Wallet Address</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Network</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('balance')}>
                  <span className="inline-flex items-center gap-1 justify-end">Balance <SortIcon field="balance" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                  <span className="inline-flex items-center gap-1">Created <SortIcon field="created_at" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('updated_at')}>
                  <span className="inline-flex items-center gap-1">Last Updated <SortIcon field="updated_at" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              <TooltipProvider delayDuration={200}>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary/60 rounded animate-pulse w-20" /></td>)}</tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No wallets found</td></tr>
                ) : rows.map(w => (
                  <tr key={w.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <span className="font-medium text-foreground truncate max-w-[140px] block text-xs">{w.profile?.display_name || 'Unknown'}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{w.user_id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => copyAddr(w.address)} className="flex items-center gap-1.5 group">
                            <Wallet className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="font-mono text-[11px] text-foreground/80 group-hover:text-accent transition-colors">{truncAddr(w.address)}</span>
                            <Copy className="w-2.5 h-2.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs"><p className="font-mono text-[10px]">{w.address}</p></TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] uppercase bg-secondary/50 border-border">{w.currency} · {w.network}</Badge>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-xs ${w.balance > 0 ? 'text-emerald-400' : 'text-muted-foreground/50'}`}>
                      {w.balance.toLocaleString()} {w.currency}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(w.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(w.updated_at), 'MMM d, yyyy HH:mm')}</td>
                  </tr>
                ))}
              </TooltipProvider>
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
