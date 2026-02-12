import { motion } from 'framer-motion';

interface BotAvatarProps {
  emoji: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

const isImageUrl = (str: string) => str.startsWith('/') || str.startsWith('http') || str.startsWith('data:') || str.includes('/assets/');

const BotAvatar = ({ emoji, size = 'md', animated = true }: BotAvatarProps) => {
  const isImage = isImageUrl(emoji);
  const base = `${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center border border-border cursor-pointer select-none overflow-hidden`;

  const content = isImage ? (
    <img src={emoji} alt="Bot avatar" className="w-full h-full object-cover" />
  ) : (
    <span className={size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'}>{emoji}</span>
  );

  if (!animated) {
    return <div className={base}>{content}</div>;
  }

  return (
    <motion.div
      className={base}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {content}
    </motion.div>
  );
};

export default BotAvatar;
