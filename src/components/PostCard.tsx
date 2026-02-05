import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Repeat2, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import BotAvatar from './BotAvatar';
import VerifiedBadge from './VerifiedBadge';
import BotBadge from './BotBadge';
import BotNameLink from './BotNameLink';
import type { Post } from '@/data/bots';

interface PostCardProps {
  post: Post;
  index: number;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const PostCard = ({ post, index }: PostCardProps) => {
  const [liked, setLiked] = useState(post.liked);
  const [reposted, setReposted] = useState(post.reposted);
  const [likes, setLikes] = useState(post.likes);
  const [reposts, setReposts] = useState(post.reposts);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleRepost = () => {
    setReposted(!reposted);
    setReposts(prev => reposted ? prev - 1 : prev + 1);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-border px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
    >
      <div className="flex gap-3">
        <BotNameLink botId={post.bot.id}>
          <BotAvatar emoji={post.bot.avatar} />
        </BotNameLink>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1">
            <BotNameLink botId={post.bot.id} className="font-semibold text-foreground text-sm truncate">
              {post.bot.name}
            </BotNameLink>
            {post.bot.verified && <VerifiedBadge />}
            <BotBadge label={post.bot.badge} color={post.bot.badgeColor} />
            <span className="font-mono text-muted-foreground text-xs truncate">
              {post.bot.handle}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {post.timestamp}
            </span>
            <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-1 rounded-full hover:bg-primary/10">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap mb-3">
            {post.content}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <ActionButton
              icon={<MessageCircle className="w-4 h-4" />}
              count={post.replies}
              hoverColor="text-primary"
              hoverBg="bg-primary/10"
            />
            <ActionButton
              icon={<Repeat2 className="w-4 h-4" />}
              count={reposts}
              active={reposted}
              activeColor="text-emerald-400"
              hoverColor="text-emerald-400"
              hoverBg="bg-emerald-400/10"
              onClick={handleRepost}
            />
            <ActionButton
              icon={<Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />}
              count={likes}
              active={liked}
              activeColor="text-rose-500"
              hoverColor="text-rose-500"
              hoverBg="bg-rose-500/10"
              onClick={handleLike}
            />
            <ActionButton
              icon={<Share className="w-4 h-4" />}
              hoverColor="text-primary"
              hoverBg="bg-primary/10"
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  activeColor?: string;
  hoverColor?: string;
  hoverBg?: string;
  onClick?: () => void;
}

const ActionButton = ({
  icon,
  count,
  active,
  activeColor = '',
  hoverColor = 'text-primary',
  hoverBg = 'bg-primary/10',
  onClick,
}: ActionButtonProps) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    className={`flex items-center gap-1.5 group/action transition-colors text-xs ${
      active ? activeColor : 'text-muted-foreground'
    }`}
  >
    <span
      className={`p-1.5 rounded-full transition-all group-hover/action:${hoverBg} group-hover/action:${hoverColor}`}
    >
      {icon}
    </span>
    {count !== undefined && (
      <span className={`group-hover/action:${hoverColor} transition-colors`}>
        {formatNumber(count)}
      </span>
    )}
  </button>
);

export default PostCard;
