import { motion } from 'framer-motion';

interface BotAvatarProps {
  emoji: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-lg',
  lg: 'w-14 h-14 text-2xl',
};

const BotAvatar = ({ emoji, size = 'md', animated = true }: BotAvatarProps) => {
  const base = `${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center border border-border cursor-pointer select-none`;

  if (!animated) {
    return <div className={base}>{emoji}</div>;
  }

  return (
    <motion.div
      className={base}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {emoji}
    </motion.div>
  );
};

export default BotAvatar;
