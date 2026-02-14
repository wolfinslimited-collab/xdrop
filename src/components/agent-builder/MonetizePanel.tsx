import { useState } from 'react';
import { DollarSign, TrendingUp, Users, Zap, Coins, Wallet, Copy, CheckCircle2, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { AgentConfig } from '@/types/agentBuilder';

interface MonetizePanelProps {
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
  userCredits?: number;
}

const PRICING_MODELS = [
  { id: 'free', label: 'Free', desc: 'Open access, no charges', icon: '🆓' },
  { id: 'per-run', label: 'Per Run', desc: 'Charge per execution', icon: '⚡' },
  { id: 'subscription', label: 'Subscription', desc: 'Monthly recurring fee', icon: '🔄' },
  { id: 'freemium', label: 'Freemium', desc: 'Free tier + paid upgrades', icon: '🎁' },
];

const LISTING_FEE = 1000;

interface AgentWalletData {
  sol_address: string;
  usdc_address: string;
  sol_balance: number;
  usdc_balance: number;
  mnemonic?: string;
  privateKey?: string;
  exists: boolean;
  warning?: string;
}

const MonetizePanel = ({ config, onConfigChange, userCredits = 0 }: MonetizePanelProps) => {
  const price = (config as any).price ?? 0;
  const subscriptionPrice = (config as any).subscriptionPrice ?? 0;
  const pricingModel = (config as any).pricingModel ?? 'free';
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

      setWalletData(data);

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
      {copied === label ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Monetize</h3>
        <p className="text-xs text-muted-foreground">Set pricing, wallets, and earn from your agent</p>
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
              Generate a Solana wallet for your bot to receive earnings, tips, and payments in SOL & USDC.
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
            {/* Wallet addresses */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
              {/* SOL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">SOL Address</span>
                  <CopyButton text={walletData.sol_address} label="sol" />
                </div>
                <p className="text-[11px] text-foreground font-mono break-all leading-relaxed">
                  {walletData.sol_address}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Balance: <span className="text-foreground font-medium">{walletData.sol_balance} SOL</span>
                </p>
              </div>

              {/* USDC */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">USDC Address</span>
                  <CopyButton text={walletData.usdc_address} label="usdc" />
                </div>
                <p className="text-[11px] text-foreground font-mono break-all leading-relaxed">
                  {walletData.usdc_address}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Balance: <span className="text-foreground font-medium">${walletData.usdc_balance.toFixed(2)} USDC</span>
                </p>
              </div>
            </div>

            {/* Secret keys (only shown on first creation) */}
            {walletData.mnemonic && walletData.privateKey && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] font-medium text-amber-400">Save these — shown only once!</p>
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

      {/* Pricing Model */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Pricing Model</label>
        <div className="grid grid-cols-2 gap-2">
          {PRICING_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => updateField('pricingModel', model.id)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                pricingModel === model.id
                  ? 'border-foreground/30 bg-muted/80'
                  : 'border-border hover:border-foreground/20 bg-muted/30'
              }`}
            >
              <span className="text-sm">{model.icon}</span>
              <p className="text-[11px] font-medium text-foreground mt-1">{model.label}</p>
              <p className="text-[9px] text-muted-foreground">{model.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Price inputs */}
      {(pricingModel === 'per-run' || pricingModel === 'freemium') && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Price per run (USDC)</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
              className="w-full bg-muted/50 rounded-lg py-2 pl-8 pr-3 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
            />
          </div>
        </div>
      )}

      {(pricingModel === 'subscription' || pricingModel === 'freemium') && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Monthly subscription (USDC)</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="number"
              min={0}
              step={1}
              value={subscriptionPrice}
              onChange={(e) => updateField('subscriptionPrice', parseFloat(e.target.value) || 0)}
              className="w-full bg-muted/50 rounded-lg py-2 pl-8 pr-3 text-xs text-foreground border border-border focus:border-foreground/30 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Revenue Estimate */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Estimated Revenue</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Zap className="w-3 h-3" />
              <span className="text-[9px]">Per Run</span>
            </div>
            <p className="text-sm font-semibold text-foreground">${price.toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[9px]">Monthly (est.)</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              ${pricingModel === 'subscription' ? subscriptionPrice.toFixed(2) : (price * config.guardrails.maxRunsPerDay * 30).toFixed(2)}
            </p>
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
