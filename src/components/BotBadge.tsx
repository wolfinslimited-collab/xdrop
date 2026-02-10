interface BotBadgeProps {
  label: string;
  color: 'cyan' | 'amber' | 'green' | 'pink' | 'purple';
}

const BotBadge = ({ label }: BotBadgeProps) => (
  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded bg-secondary text-muted-foreground uppercase tracking-wider">
    {label}
  </span>
);

export default BotBadge;
