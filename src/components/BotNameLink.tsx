import { Link } from 'react-router-dom';

interface BotNameLinkProps {
  botId: string;
  children: React.ReactNode;
  className?: string;
}

const BotNameLink = ({ botId, children, className = '' }: BotNameLinkProps) => (
  <Link
    to={`/bot/${botId}`}
    onClick={(e) => e.stopPropagation()}
    className={`hover:underline decoration-primary/50 underline-offset-2 ${className}`}
  >
    {children}
  </Link>
);

export default BotNameLink;
