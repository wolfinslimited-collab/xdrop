import { useState } from 'react';
import { Coins, Zap, Sparkles, Crown, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CREDIT_PACKS = [
  {
    id: 'price_1Sze7MDlHg9BacxzHcvgf1no',
    name: '500 Credits',
    baseCredits: 500,
    bonusCredits: 100,
    totalCredits: 600,
    bonusPercent: 20,
    price: '$9.99',
    icon: <Zap className="w-5 h-5" />,
    popular: false,
    perCredit: '$0.017',
  },
  {
    id: 'price_1Sze7uDlHg9Bacxzfb8GbnuD',
    name: '1,500 Credits',
    baseCredits: 1500,
    bonusCredits: 525,
    totalCredits: 2025,
    bonusPercent: 35,
    price: '$24.99',
    icon: <Sparkles className="w-5 h-5" />,
    popular: true,
    perCredit: '$0.012',
  },
  {
    id: 'price_1Sze8FDlHg9Bacxz8woqdTgr',
    name: '5,000 Credits',
    baseCredits: 5000,
    bonusCredits: 2500,
    totalCredits: 7500,
    bonusPercent: 50,
    price: '$49.99',
    icon: <Crown className="w-5 h-5" />,
    popular: false,
    perCredit: '$0.007',
  },
];

interface CreditsPurchaseDialogProps {
  credits: number | null;
  children?: React.ReactNode;
}

const CreditsPurchaseDialog = ({ credits, children }: CreditsPurchaseDialogProps) => {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (priceId: string) => {
    setLoadingPack(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to start checkout', variant: 'destructive' });
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
            <Coins className="w-3.5 h-3.5" />
            Buy Credits
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Coins className="w-5 h-5 text-primary" />
            Buy Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted border border-border">
            <span className="text-sm text-muted-foreground">Current balance</span>
            <span className="text-sm font-bold font-mono text-foreground">{credits ?? 0} credits</span>
          </div>

          <div className="space-y-2 pt-2">
            {CREDIT_PACKS.map(pack => (
              <button
                key={pack.id}
                onClick={() => handlePurchase(pack.id)}
                disabled={!!loadingPack}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  pack.popular
                    ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                    : 'border-border hover:bg-muted/50'
                } disabled:opacity-50`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  pack.popular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {pack.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{pack.totalCredits.toLocaleString()} Credits</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase">+{pack.bonusPercent}% bonus</span>
                    {pack.popular && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground uppercase">Popular</span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{pack.baseCredits.toLocaleString()} base + {pack.bonusCredits.toLocaleString()} bonus · {pack.perCredit}/credit</span>
                </div>
                <div className="text-right">
                  {loadingPack === pack.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <span className="text-sm font-bold text-foreground">{pack.price}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground mt-0.5 ml-auto" />
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center pt-2">
            Credits are non-refundable. 1 credit = 1 chat message. Agent deploy = 10 credits.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditsPurchaseDialog;
