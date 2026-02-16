import { useMemo, useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useBotAvatars, getFallbackAvatarFromList } from '@/hooks/useBotAvatars';
import { Skeleton } from '@/components/ui/skeleton';

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

/**
 * Extract bot number from various formats:
 * - "bot-12" (stored in DB)
 * - "/assets/avatars/bot-12.abc123.png" (vite hashed)
 * - "/avatars/bot-12.png" (public path)
 */
const getBotNumber = (str: string): number | null => {
  if (!str) return null;
  const match = str.match(/bot-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

/** Check if string is a usable image URL */
const isImageUrl = (str: string) =>
  str && (str.startsWith('http') || str.startsWith('data:') || str.startsWith('blob:'));

/** Check if string is a short emoji or missing */
const isEmojiOrEmpty = (str: string) =>
  !str || str === '🤖' || (str.length <= 4 && /^\p{Emoji}/u.test(str));

const BotAvatar = forwardRef<HTMLDivElement, BotAvatarProps>(({ emoji, size = 'md', animated = true }, ref) => {
  const avatars = useBotAvatars();
  const [imgError, setImgError] = useState(false);

  // Reset error state when emoji prop changes
  useEffect(() => { setImgError(false); }, [emoji]);

  const fallback = useMemo(
    () => getFallbackAvatarFromList(avatars, emoji || '🤖'),
    [avatars, emoji]
  );

  const resolvedSrc = useMemo(() => {
    if (!emoji) return fallback;

    // Try to extract bot-N pattern from any format
    const botNum = getBotNumber(emoji);
    if (botNum !== null && botNum >= 1 && botNum <= avatars.length) {
      return avatars[botNum - 1];
    }

    // Full image URL (http, data:, blob:)
    if (isImageUrl(emoji)) return emoji;

    // Short emoji character — use deterministic fallback
    if (isEmojiOrEmpty(emoji)) return fallback;

    // Unknown string (could be vite hash fragment like "c77abc") — use fallback
    return fallback;
  }, [emoji, fallback, avatars]);

  const base = `${sizeClasses[size]} rounded-full bg-secondary flex items-center justify-center border border-border cursor-pointer select-none overflow-hidden`;
  const px = sizePx[size];

  // Still loading avatar bundle
  const isLoading = avatars.length === 0;

  let content: React.ReactNode;

  if (isLoading) {
    content = <Skeleton className="w-full h-full rounded-full" />;
  } else if (resolvedSrc && !imgError) {
    content = (
      <img
        src={resolvedSrc}
        alt="Bot avatar"
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  } else {
    // Final emoji fallback
    content = (
      <span className={size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'}>
        🤖
      </span>
    );
  }

  if (!animated) {
    return <div ref={ref} className={base}>{content}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={base}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {content}
    </motion.div>
  );
});

BotAvatar.displayName = 'BotAvatar';

export default BotAvatar;
