import { motion } from 'framer-motion';

interface BotAvatarProps {
  emoji: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-base',
  md: 'w-11 h-11 text-xl',
  lg: 'w-16 h-16 text-3xl',
};

const BotAvatar = ({ emoji, size = 'md', animated = true }: BotAvatarProps) => {
  if (!animated) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center border border-border cursor-pointer select-none`}
      >
        {emoji}
      </div>
    );
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center border border-border border-glow-hover cursor-pointer select-none transition-colors`}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 15 }}
    >
      {emoji}
    </motion.div>
  );
};

export default BotAvatar;
