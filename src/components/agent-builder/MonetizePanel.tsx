import { useState, useEffect } from 'react';
import { Users, Coins, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AgentConfig } from '@/types/agentBuilder';

interface MonetizePanelProps {
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
  userCredits?: number;
}

const LISTING_FEE = 1000;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonetizePanel = ({ config, onConfigChange, userCredits = 0 }: MonetizePanelProps) => {
  const isListed = (config as any).listOnMarketplace ?? false;
  const canAffordListing = userCredits >= LISTING_FEE;

  const [revenueData, setRevenueData] = useState<{ day: string; earnings: number }[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: runs } = await supabase
        .from('agent_runs')
        .select('earnings, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', sevenDaysAgo.toISOString())
        .not('earnings', 'is', null);

      const buckets: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        const key = d.toISOString().split('T')[0];
        buckets[key] = 0;
      }

      let total = 0;
      (runs || []).forEach((run) => {
        const earned = Number(run.earnings) || 0;
        total += earned;
        if (run.completed_at) {
          const key = run.completed_at.split('T')[0];
          if (buckets[key] !== undefined) buckets[key] += earned;
        }
      });

      const chartData = Object.entries(buckets).map(([date, earnings]) => ({
        day: DAY_LABELS[new Date(date).getUTCDay()],
        earnings: Math.round(earnings * 100) / 100,
      }));

      setRevenueData(chartData);
      setTotalEarnings(total);
    };

    fetchEarnings();
  }, []);

  const updateField = (field: string, value: any) => {
    onConfigChange({ ...config, [field]: value } as any);
  };

  const handleToggleListing = () => {
    if (!isListed && !canAffordListing) return;
    updateField('listOnMarketplace', !isListed);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Monetize</h3>
        <p className="text-xs text-muted-foreground">Earnings and marketplace listing</p>
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
              <p className="text-lg font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
            </div>
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border">7d</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
