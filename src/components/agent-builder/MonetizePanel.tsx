import { useState } from 'react';
import { Users, Coins, Wallet, Copy, CheckCircle2, Loader2, AlertTriangle, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AgentConfig } from '@/types/agentBuilder';

interface MonetizePanelProps {
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
  userCredits?: number;
}

const LISTING_FEE = 1000;

interface AgentWalletData {
  sol_address: string;
  sol_balance: number;
  usdc_balance: number;
  mnemonic?: string;
  privateKey?: string;
  exists: boolean;
  warning?: string;
}

// Mock revenue data for chart
const MOCK_REVENUE = [
  { day: 'Mon', earnings: 0 },
  { day: 'Tue', earnings: 0 },
  { day: 'Wed', earnings: 0 },
  { day: 'Thu', earnings: 0 },
  { day: 'Fri', earnings: 0 },
  { day: 'Sat', earnings: 0 },
  { day: 'Sun', earnings: 0 },
];

const MonetizePanel = ({ config, onConfigChange, userCredits = 0 }: MonetizePanelProps) => {
  const isListed = (config as any).listOnMarketplace ?? false;
  const canAffordListing = userCredits >= LISTING_FEE;

  const [walletData, setWalletData] = useState<AgentWalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const updateField = (field: string, value: any) => {
    onConfigChange({ ...config, [field]: value } as any);
  };

  const handleToggleListing = () => {
    if (!isListed && !canAffordListing) return;
    updateField('listOnMarketplace', !isListed);
  };

  const handleGenerateWallet = async () => {
    if (!config.name?.trim()) {
      toast({ title: 'Name your agent first', description: 'Set an agent name before generating a wallet.', variant: 'destructive' });
      return;
    }

    setWalletLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-agent-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({ agentName: config.name }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to create wallet');

      setWalletData({
        sol_address: data.sol_address,
        sol_balance: data.sol_balance,
        usdc_balance: data.usdc_balance,
        mnemonic: data.mnemonic,
        privateKey: data.privateKey,
        exists: data.exists,
        warning: data.warning,
      });

      if (!data.exists) {
        toast({
          title: '🔐 Wallet created!',
          description: 'Save your mnemonic and private key — they won\'t be shown again.',
        });
      }
    } catch (err: any) {
      toast({ title: 'Wallet error', description: err.message, variant: 'destructive' });
    } finally {
      setWalletLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
    >
      {copied === label ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
    </button>
  );

  const totalBalance = walletData ? walletData.sol_balance + walletData.usdc_balance : 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Monetize</h3>
        <p className="text-xs text-muted-foreground">Wallet, earnings, and marketplace listing</p>
      </div>

      {/* Bot Wallet Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
          <label className="text-xs font-medium text-foreground">Agent Wallet</label>
        </div>

        {!walletData ? (
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Generate a Solana wallet for your bot to receive earnings, tips, and payments.
            </p>
            <Button
              onClick={handleGenerateWallet}
              disabled={walletLoading}
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
            >
              {walletLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wallet className="w-3.5 h-3.5" />
              )}
              {walletLoading ? 'Generating…' : 'Generate Wallet'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Single wallet address */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Wallet Address</span>
                  <CopyButton text={walletData.sol_address} label="address" />
                </div>
                <p className="text-[11px] text-foreground font-mono break-all leading-relaxed">
                  {walletData.sol_address}
                </p>
              </div>

              {/* Balance cards */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div className="p-2 rounded-md bg-background/50 border border-border">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">SOL</p>
                  <p className="text-sm font-semibold text-foreground">{walletData.sol_balance.toFixed(4)}</p>
                </div>
                <div className="p-2 rounded-md bg-background/50 border border-border">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">USDC</p>
                  <p className="text-sm font-semibold text-foreground">${walletData.usdc_balance.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Secret keys (only shown on first creation) */}
            {walletData.mnemonic && walletData.privateKey && (
              <div className="p-3 rounded-lg border border-accent/30 bg-accent/5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-foreground flex-shrink-0" />
                  <p className="text-[11px] font-medium text-accent-foreground">Save these — shown only once!</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Show secrets</span>
                  <button onClick={() => setShowSecret(!showSecret)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showSecret && (
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Mnemonic</span>
                        <CopyButton text={walletData.mnemonic} label="mnemonic" />
                      </div>
                      <p className="text-[10px] text-foreground font-mono break-all bg-background/50 p-1.5 rounded border border-border">
                        {walletData.mnemonic}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Private Key</span>
                        <CopyButton text={walletData.privateKey} label="pk" />
                      </div>
                      <p className="text-[10px] text-foreground font-mono break-all bg-background/50 p-1.5 rounded border border-border">
                        {walletData.privateKey}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {walletData.exists && (
              <p className="text-[10px] text-muted-foreground/60 text-center">Wallet already generated for this agent</p>
            )}
          </div>
        )}
      </div>

      {/* Revenue Income Chart */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          <label className="text-xs font-medium text-foreground">Revenue</label>
        </div>
        <div className="p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Earnings</p>
              <p className="text-lg font-bold text-foreground">${walletData ? walletData.usdc_balance.toFixed(2) : '0.00'}</p>
            </div>
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border">7d</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  fill="url(#earningsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Marketplace listing toggle */}
      <div className="space-y-2">
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
          isListed ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'
        }`}>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-foreground">List on Marketplace</p>
              <p className="text-[9px] text-muted-foreground">Make discoverable to other users</p>
            </div>
          </div>
          <button
            onClick={handleToggleListing}
            disabled={!isListed && !canAffordListing}
            className={`w-9 h-5 rounded-full transition-colors ${
              isListed ? 'bg-foreground' : canAffordListing ? 'bg-muted hover:bg-muted-foreground/30' : 'bg-muted opacity-50 cursor-not-allowed'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-background transition-transform ${isListed ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className={`p-2.5 rounded-lg border flex items-start gap-2 ${
          canAffordListing ? 'border-border bg-muted/30' : 'border-destructive/30 bg-destructive/5'
        }`}>
          <Coins className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${canAffordListing ? 'text-muted-foreground' : 'text-destructive'}`} />
          <div>
            <p className="text-[11px] font-medium text-foreground">
              Listing fee: {LISTING_FEE.toLocaleString()} credits
            </p>
            <p className={`text-[10px] ${canAffordListing ? 'text-muted-foreground' : 'text-destructive'}`}>
              {canAffordListing
                ? `You have ${userCredits.toLocaleString()} credits available`
                : `You need ${(LISTING_FEE - userCredits).toLocaleString()} more credits (balance: ${userCredits.toLocaleString()})`
              }
            </p>
          </div>
        </div>

        {!canAffordListing && (
          <a href="/credits" className="block">
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
              <Coins className="w-3.5 h-3.5" />
              Purchase Credits
            </Button>
          </a>
        )}
      </div>
    </div>
  );
};

export default MonetizePanel;
