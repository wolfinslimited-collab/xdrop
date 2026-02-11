import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { AgentTemplate } from '@/data/agentTemplates';

interface PurchaseDialogProps {
  template: AgentTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PurchaseDialog({ template, open, onOpenChange }: PurchaseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoadingWallet(true);
    supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', 'USDC')
      .single()
      .then(({ data }) => {
        setWalletBalance(data?.balance ?? 0);
        setLoadingWallet(false);
      });
  }, [open, user]);

  if (!template) return null;

  const price = template.yearlyPrice;
  const hasEnough = walletBalance !== null && walletBalance >= price;

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

      toast({ title: '✅ Agent Purchased!', description: `${template.name} is now active on your Dashboard.` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Purchase Failed', description: err.message, variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

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
          {/* Price */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="text-lg font-bold text-foreground">${price} USDC</span>
          </div>

          {/* Wallet balance */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Wallet Balance
            </span>
            {loadingWallet ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <span className={`text-lg font-bold ${hasEnough ? 'text-green-500' : 'text-destructive'}`}>
                ${walletBalance?.toFixed(2)}
              </span>
            )}
          </div>

          {/* Status */}
          {!loadingWallet && !hasEnough && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">
                Insufficient balance. You need ${price - (walletBalance ?? 0)} more USDC. Deposit funds to your wallet first.
              </p>
            </div>
          )}

          {!loadingWallet && hasEnough && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-xs text-green-500">
                Sufficient balance. After purchase: ${(walletBalance! - price).toFixed(2)} remaining.
              </p>
            </div>
          )}

          {/* Returns */}
          <div className="p-3 bg-secondary rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-1">Estimated Monthly Return</p>
            <p className="text-sm font-bold text-green-500">{template.monthlyReturnMin}–{template.monthlyReturnMax}%</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={purchasing}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!hasEnough || loadingWallet || purchasing}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            {purchasing ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Processing...</> : `Pay $${price} USDC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
