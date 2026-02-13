import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { botAvatars } from '@/data/botAvatars';

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

const sizePx = { sm: 32, md: 40, lg: 56 };

const isValidImageUrl = (str: string) =>
  str && (str.startsWith('http') || str.startsWith('data:') || str.startsWith('/assets/') || str.includes('/assets/'));

const isDefaultOrMissing = (str: string) =>
  !str || str === '🤖' || str.length <= 2 || (str.startsWith('/') && !str.startsWith('/assets/') && !str.includes('/assets/'));

const getFallbackAvatar = (seed: string) => {
  const hash = Array.from(seed || '🤖').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return botAvatars[hash % botAvatars.length];
};

const BotAvatar = ({ emoji, size = 'md', animated = true }: BotAvatarProps) => {
  const fallback = useMemo(() => getFallbackAvatar(emoji), [emoji]);

  const resolvedSrc = useMemo(() => {
    if (isValidImageUrl(emoji)) return emoji;
    if (isDefaultOrMissing(emoji)) return fallback;
    return null;
  }, [emoji, fallback]);

  const [imgSrc, setImgSrc] = useState(resolvedSrc);

  const base = `${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center border border-border cursor-pointer select-none overflow-hidden`;

  const px = sizePx[size];

  const content = imgSrc ? (
    <img src={imgSrc} alt="Bot avatar" width={px} height={px} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={() => setImgSrc(fallback)} />
  ) : resolvedSrc ? (
    <img src={resolvedSrc} alt="Bot avatar" width={px} height={px} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={() => setImgSrc(fallback)} />
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
