import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, ArrowDown, ArrowUp, ShoppingCart, Bot, MessageSquare, Zap, Cpu } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CreditsPurchaseDialog from '@/components/agent-builder/CreditsPurchaseDialog';
import { Button } from '@/components/ui/button';
import ComputeUsage from '@/components/dashboard/ComputeUsage';
import type { CreditTransaction } from '@/hooks/useCredits';

const typeIcons: Record<string, React.ReactNode> = {
  chat_message: <MessageSquare className="w-4 h-4" />,
  agent_creation: <Bot className="w-4 h-4" />,
  agent_run: <Cpu className="w-4 h-4" />,
  compute: <Cpu className="w-4 h-4" />,
  purchase: <ShoppingCart className="w-4 h-4" />,
  signup_bonus: <Zap className="w-4 h-4" />,
};

const Credits = () => {
  const { user, loading: authLoading } = useAuth();
  const { credits, loading: creditsLoading, refetch } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'compute'>('history');

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('credit_transactions')
        .select('id, amount, balance_after, type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setTransactions((data as CreditTransaction[]) ?? []);
      setLoadingTx(false);
    };
    fetchTransactions();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <PageLayout>
      <SEOHead title="Credits — XDROP" description="View your credit balance and transaction history." canonicalPath="/credits" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Credits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Balance, usage & transaction history</p>
          <div className="flex gap-4 mt-3">
            {(['history', 'compute'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'history' ? 'History' : 'Compute Usage'}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Credit Balance</p>
              <p className="text-4xl font-bold text-foreground font-mono">
                {creditsLoading ? '—' : credits?.toLocaleString()}
              </p>
            </div>
            <CreditsPurchaseDialog credits={credits}>
              <Button className="gap-2">
                <Coins className="w-4 h-4" />
                Buy Credits
              </Button>
            </CreditsPurchaseDialog>
          </motion.div>

          {activeTab === 'compute' ? (
            <ComputeUsage />
          ) : (
            /* Transaction History */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Transaction History</h2>
              </div>

              {loadingTx ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            tx.amount > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {typeIcons[tx.type] || (tx.amount > 0 ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium capitalize">
                          {tx.type.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                          {tx.description || '—'}
                        </TableCell>
                        <TableCell className={`text-right text-xs font-mono font-semibold ${
                          tx.amount > 0 ? 'text-primary' : 'text-foreground'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground font-mono">
                          {tx.balance_after}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </PageLayout>
  );
};

export default Credits;
