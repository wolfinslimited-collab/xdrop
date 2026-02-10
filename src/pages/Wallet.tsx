import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Copy, ArrowDownToLine, ArrowUpFromLine, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WalletData {
  address: string;
  balance: number;
  network: string;
  currency: string;
}

const Wallet = () => {
  const { user, loading } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKeys, setShowKeys] = useState<{ mnemonic: string; privateKey: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchWallet = async () => {
      const { data } = await supabase
        .from('wallets')
        .select('address, balance, network, currency')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setWallet(data as WalletData);
      setLoadingWallet(false);
    };
    fetchWallet();
  }, [user]);

  const createWallet = async () => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('create-wallet', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      const result = res.data;
      setWallet({ address: result.address, balance: 0, network: 'solana', currency: 'USDC' });
      if (!result.exists && result.mnemonic) {
        setShowKeys({ mnemonic: result.mnemonic, privateKey: result.privateKey });
      }
      toast.success('Wallet created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create wallet');
    } finally {
      setCreating(false);
    }
  };

  const copyAddress = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <PageLayout>
      <SEOHead title="Wallet — XDROP" description="Manage your USDC wallet." canonicalPath="/wallet" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Wallet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Solana · USDC</p>
        </header>

        <div className="p-4 space-y-4">
          {loadingWallet ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !wallet ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 space-y-4"
            >
              <WalletIcon className="w-16 h-16 text-muted-foreground mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">No Wallet Yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Create a Solana wallet to receive and send USDC earnings from your agents.
              </p>
              <Button onClick={createWallet} disabled={creating} className="mt-2">
                {creating ? 'Creating...' : 'Create Wallet'}
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-6 text-center"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">USDC Balance</p>
                <p className="text-4xl font-bold text-foreground font-mono">
                  ${wallet.balance.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Solana Network</p>
              </motion.div>

              {/* Address */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <p className="text-xs text-muted-foreground mb-2">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-foreground bg-secondary rounded-lg px-3 py-2 truncate font-mono">
                    {wallet.address}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyAddress}>
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-3"
              >
                <button className="bg-card rounded-xl border border-border p-4 hover:bg-secondary/50 transition-colors text-center">
                  <ArrowDownToLine className="w-5 h-5 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium text-foreground">Deposit</p>
                  <p className="text-[10px] text-muted-foreground">Send USDC to your address</p>
                </button>
                <button className="bg-card rounded-xl border border-border p-4 hover:bg-secondary/50 transition-colors text-center">
                  <ArrowUpFromLine className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-foreground">Withdraw</p>
                  <p className="text-[10px] text-muted-foreground">Send USDC out</p>
                </button>
              </motion.div>

              {/* Keys warning (shown only once after creation) */}
              {showKeys && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                    <p className="text-sm font-semibold text-foreground">Save Your Keys — Shown Only Once</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Mnemonic</p>
                    <code className="block text-xs text-foreground bg-secondary rounded-lg px-3 py-2 break-all font-mono">
                      {showKeys.mnemonic}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Private Key</p>
                    <code className="block text-xs text-foreground bg-secondary rounded-lg px-3 py-2 break-all font-mono">
                      {showKeys.privateKey}
                    </code>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Store these securely offline. XDROP does not store your private key.</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowKeys(null)} className="w-full">
                    I've Saved My Keys
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </PageLayout>
  );
};

export default Wallet;
