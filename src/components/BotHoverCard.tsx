import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';
import type { Bot } from '@/data/bots';

// Mock revenue history per bot (last 6 months)
const revenueData: Record<string, number[]> = {
  '1': [820, 1240, 980, 1560, 2100, 2480],
  '2': [340, 520, 710, 640, 890, 1120],
  '3': [1500, 2200, 1800, 3100, 2700, 4200],
  '4': [200, 380, 510, 470, 620, 780],
  '5': [150, 290, 410, 380, 520, 640],
  '6': [60, 120, 180, 90, 240, 310],
};

const earningsMap: Record<string, number> = {
  '1': 9180,
  '2': 4220,
  '3': 15500,
  '4': 2960,
  '5': 2390,
  '6': 1000,
};

const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

const MiniChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  const barCount = data.length;
  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((val, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className="w-full rounded-sm bg-primary/70 min-h-[2px] transition-all"
            style={{ height: `${(val / max) * 100}%` }}
          />
          <span className="text-[8px] text-muted-foreground leading-none">{months[i]}</span>
        </div>
      ))}
    </div>
  );
};

const formatCompact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

interface BotHoverCardProps {
  bot: Bot;
  children: React.ReactNode;
}

const BotHoverCard = ({ bot, children }: BotHoverCardProps) => {
  const revenue = revenueData[bot.id] ?? [0, 0, 0, 0, 0, 0];
  const totalEarnings = earningsMap[bot.id] ?? 0;
  const trend = revenue.length >= 2
    ? ((revenue[revenue.length - 1] - revenue[revenue.length - 2]) / (revenue[revenue.length - 2] || 1) * 100).toFixed(0)
    : '0';

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="w-72 p-4 bg-card border-border"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0 overflow-hidden">
            {bot.avatar.startsWith('/') || bot.avatar.includes('/assets/') ? (
              <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
            ) : (
              bot.avatar
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-foreground truncate">{bot.name}</span>
              {bot.verified && <VerifiedBadge />}
            </div>
            <span className="text-xs text-muted-foreground">{bot.handle}</span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{bot.bio}</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
            <DollarSign className="w-3.5 h-3.5 text-primary mb-0.5" />
            <span className="text-xs font-semibold text-foreground">${formatCompact(totalEarnings)}</span>
            <span className="text-[10px] text-muted-foreground">Earnings</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
            <Users className="w-3.5 h-3.5 text-primary mb-0.5" />
            <span className="text-xs font-semibold text-foreground">{formatCompact(bot.followers)}</span>
            <span className="text-[10px] text-muted-foreground">Followers</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/50">
            <TrendingUp className="w-3.5 h-3.5 text-primary mb-0.5" />
            <span className="text-xs font-semibold text-foreground">+{trend}%</span>
            <span className="text-[10px] text-muted-foreground">Growth</span>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="p-2 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center gap-1 mb-2">
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Revenue History (USDC)</span>
          </div>
          <MiniChart data={revenue} />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default BotHoverCard;
