import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Wallet, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface WalletInfo {
  address: string;
  currency: string;
  network: string;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string | null;
  created_at: string;
  metadata: any;
  profile?: { display_name: string; avatar_url: string | null };
  wallets?: WalletInfo[];
}

const truncAddr = (addr: string) => addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;

const copyAddr = (addr: string) => {
  navigator.clipboard.writeText(addr);
  toast.success('Address copied');
};

type SortField = 'created_at' | 'amount' | 'balance_after' | 'type';
type SortDir = 'asc' | 'desc';

const AdminTransactions = ({ session }: { session: any }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        action: 'list-transactions',
        page: String(page),
      };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search.trim()) params.search = search.trim();
      params.sort = sortField;
      params.dir = sortDir;

      const { data: result, error } = await supabase.functions.invoke('admin-api?' + new URLSearchParams(params).toString());
      if (error) throw error;
      setTransactions(result?.transactions || []);
      setTotal(result?.total || 0);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, sortField, sortDir]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      fetchTransactions();
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.ceil(total / 50);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />;
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'deposit': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'signup_bonus': return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
      case 'agent_run': return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
      case 'refund': return 'bg-red-500/15 text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const uniqueTypes = useMemo(() => {
    const types = new Set(transactions.map(t => t.type));
    return Array.from(types).sort();
  }, [transactions]);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold font-display text-foreground">Transactions</h2>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} total records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-secondary/40 border-border"
          />
        </div>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-secondary/40 border-border">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="signup_bonus">Signup Bonus</SelectItem>
            <SelectItem value="agent_run">Agent Run</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Wallet</th>
                <th
                  className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort('type')}
                >
                  <span className="inline-flex items-center gap-1">Type <SortIcon field="type" /></span>
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort('amount')}
                >
                  <span className="inline-flex items-center gap-1 justify-end">Amount <SortIcon field="amount" /></span>
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort('balance_after')}
                >
                  <span className="inline-flex items-center gap-1 justify-end">Balance <SortIcon field="balance_after" /></span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th
                  className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort('created_at')}
                >
                  <span className="inline-flex items-center gap-1">Date <SortIcon field="created_at" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-secondary/60 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                <TooltipProvider delayDuration={200}>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <span className="font-medium text-foreground truncate max-w-[140px] block text-xs">
                            {tx.profile?.display_name || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{tx.user_id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {tx.wallets && tx.wallets.length > 0 ? (
                          <div className="space-y-1">
                            {tx.wallets.map((w, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => copyAddr(w.address)}
                                    className="flex items-center gap-1.5 group"
                                  >
                                    <Wallet className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <span className="font-mono text-[11px] text-foreground/80 group-hover:text-accent transition-colors">
                                      {truncAddr(w.address)}
                                    </span>
                                    <Copy className="w-2.5 h-2.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <p className="font-mono text-[10px]">{w.address}</p>
                                  <p className="text-muted-foreground mt-0.5">{w.currency} · {w.network}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">No wallet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] capitalize ${typeColor(tx.type)}`}>
                          {tx.type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {tx.balance_after.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">
                        {tx.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </TooltipProvider>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
