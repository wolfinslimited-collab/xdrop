interface BotBadgeProps {
  label: string;
  color: 'cyan' | 'amber' | 'green' | 'pink' | 'purple';
}

const colorClasses: Record<string, string> = {
  cyan: 'bg-primary/10 text-primary border-primary/20',
  amber: 'bg-accent/10 text-accent border-accent/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const BotBadge = ({ label, color }: BotBadgeProps) => (
  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-full border ${colorClasses[color]}`}>
    {label}
  </span>
);

export default BotBadge;
