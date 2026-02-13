import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle, CheckCircle, Loader2, Hexagon, Clock, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { AgentTemplate } from '@/data/agentTemplates';
import NftCard from './NftCard';

interface PurchaseDialogProps {
  template: AgentTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PurchaseDialog({ template, open, onOpenChange }: PurchaseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);
  const [mintedNft, setMintedNft] = useState<any>(null);
  const [mintingNft, setMintingNft] = useState(false);
  const [trialStarted, setTrialStarted] = useState<{ expiresAt: string } | null>(null);

  useEffect(() => {
    if (!open || !user || !template) return;
    setLoadingWallet(true);
    setCheckingTrial(true);
    setMintedNft(null);
    setTrialStarted(null);

    // Fetch wallet + check trial status in parallel
    Promise.all([
      supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .eq('currency', 'USDC')
        .maybeSingle(),
      supabase
        .from('agent_trials' as any)
        .select('id, status')
        .eq('user_id', user.id)
        .eq('template_id', template.id)
        .maybeSingle(),
    ]).then(([walletRes, trialRes]) => {
      setWalletBalance(walletRes.data?.balance ?? 0);
      setLoadingWallet(false);
      setTrialUsed(!!(trialRes.data as any));
      setCheckingTrial(false);
    });
  }, [open, user, template]);

  if (!template) return null;

  const price = template.yearlyPrice;
  const hasEnough = walletBalance !== null && walletBalance >= price;

  const handleStartTrial = async () => {
    if (!user) {
      toast({ title: 'Please sign in first', variant: 'destructive' });
      return;
    }
    setStartingTrial(true);
    try {
      const { data, error } = await supabase.functions.invoke('start-trial', {
        body: {
          templateId: template.id,
          templateName: template.name,
          templateDescription: template.description,
          templateAvatar: template.icon,
          templateCategory: template.category,
          monthlyReturnMin: template.monthlyReturnMin,
          monthlyReturnMax: template.monthlyReturnMax,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTrialStarted({ expiresAt: data.trial.expiresAt });
      toast({ title: '🎉 Free Trial Started!', description: `${template.name} is active for 7 days. Earnings are locked until you purchase.` });
      onOpenChange(false);
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Trial Failed', description: err.message, variant: 'destructive' });
    } finally {
      setStartingTrial(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({ title: 'Please sign in first', variant: 'destructive' });
      return;
    }
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-template', {
        body: {
          templateId: template.id,
          templateName: template.name,
          templateDescription: template.description,
          templateAvatar: template.icon,
          templateCategory: template.category,
          monthlyReturnMin: template.monthlyReturnMin,
          monthlyReturnMax: template.monthlyReturnMax,
          price,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: '✅ Agent Purchased!', description: `${template.name} is now active. Generating NFT card...` });
      onOpenChange(false);
      navigate('/dashboard');

      setMintingNft(true);
      setPurchasing(false);
      try {
        const { data: nftData, error: nftError } = await supabase.functions.invoke('mint-agent-nft', {
          body: {
            agentId: data.agent.id,
            agentName: template.name,
            agentDescription: template.description,
            agentCategory: template.category,
            agentAvatar: template.icon,
            pricePaid: price,
          },
        });
        if (nftError) throw nftError;
        if (nftData?.nft) {
          setMintedNft(nftData.nft);
          toast({ title: '🎨 NFT Card Generated!', description: `Your ${template.name} NFT has been created.` });
        }
      } catch (nftErr: any) {
        console.error('NFT minting error:', nftErr);
        toast({ title: 'NFT Generation Issue', description: 'Agent purchased but NFT card had an issue.', variant: 'destructive' });
      } finally {
        setMintingNft(false);
      }
    } catch (err: any) {
      toast({ title: 'Purchase Failed', description: err.message, variant: 'destructive' });
      setPurchasing(false);
    }
  };

  // Trial started success view
  if (trialStarted) {
    const expDate = new Date(trialStarted.expiresAt);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Trial Started!
            </DialogTitle>
            <DialogDescription>Your 7-day free trial is now active.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{template.name}</span> is running for free until {expDate.toLocaleDateString()}.
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Earnings during trial are locked and will be released when you purchase the agent.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!hasEnough || loadingWallet || purchasing}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {purchasing ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...</> : `Buy Now — ${price} USDC`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // NFT minting skeleton
  if (mintingNft) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hexagon className="w-5 h-5 text-primary" />
              Generating NFT Card...
            </DialogTitle>
            <DialogDescription>Creating AI artwork and minting your NFT on Solana.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>This may take a moment...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // NFT result view
  if (mintedNft) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hexagon className="w-5 h-5 text-primary" />
              Your NFT Card
            </DialogTitle>
            <DialogDescription>Your agent NFT has been generated on Solana.</DialogDescription>
          </DialogHeader>
          <NftCard nft={mintedNft} agentName={template.name} agentCategory={template.category} pricePaid={price} />
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="w-full bg-foreground text-background hover:bg-foreground/90">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{template.icon}</span>
            Deploy {template.name}
          </DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Free Trial Banner */}
          {!checkingTrial && !trialUsed && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm font-semibold text-foreground">7-Day Free Trial Available</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Try this agent free for 7 days. Earnings are locked until you purchase. One trial per agent.
              </p>
              <Button
                onClick={handleStartTrial}
                disabled={startingTrial}
                variant="outline"
                size="sm"
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
              >
                {startingTrial ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Starting Trial...</> : 'Start Free Trial'}
              </Button>
            </div>
          )}

          {!checkingTrial && trialUsed && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Free trial already used for this agent.
              </p>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
            <span className="text-sm text-muted-foreground">Lifetime Price</span>
            <span className="text-lg font-bold text-foreground">{price} USDC</span>
          </div>

          {/* Wallet balance */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Wallet Balance
            </span>
            {loadingWallet ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <span className={`text-lg font-bold ${hasEnough ? 'text-foreground' : 'text-destructive'}`}>
                {walletBalance?.toFixed(2)} USDC
              </span>
            )}
          </div>

          {/* Status */}
          {!loadingWallet && !hasEnough && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">
                Insufficient balance. You need {price - (walletBalance ?? 0)} more USDC.
              </p>
            </div>
          )}

          {!loadingWallet && hasEnough && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
              <CheckCircle className="w-4 h-4 text-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Sufficient balance. After purchase: {(walletBalance! - price).toFixed(2)} USDC remaining.
              </p>
            </div>
          )}

          {/* NFT info */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
            <Hexagon className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              An AI-generated Solana NFT card will be minted to your wallet after purchase.
            </p>
          </div>

          {/* Returns */}
          <div className="p-3 bg-secondary rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-1">Estimated Monthly Return</p>
            <p className="text-sm font-bold text-foreground">{template.monthlyReturnMin}–{template.monthlyReturnMax}%</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={purchasing || mintingNft}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!hasEnough || loadingWallet || purchasing || mintingNft}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {purchasing ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...</> : `Pay ${price} USDC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
