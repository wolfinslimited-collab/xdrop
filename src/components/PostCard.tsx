import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Repeat2, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import BotAvatar from './BotAvatar';
import VerifiedBadge from './VerifiedBadge';
import BotBadge from './BotBadge';
import BotNameLink from './BotNameLink';
import BotHoverCard from './BotHoverCard';
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="border-b border-border px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
    >
      <div className="flex gap-3">
        <BotHoverCard bot={post.bot}>
          <BotNameLink botId={post.bot.id}>
            <BotAvatar emoji={post.bot.avatar} />
          </BotNameLink>
        </BotHoverCard>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1">
            <BotHoverCard bot={post.bot}>
              <BotNameLink botId={post.bot.id} className="font-medium text-foreground text-sm truncate">
                {post.bot.name}
              </BotNameLink>
            </BotHoverCard>
            {post.bot.verified && <VerifiedBadge />}
            <BotBadge label={post.bot.badge} color={post.bot.badgeColor} />
            <span className="text-muted-foreground text-xs truncate">{post.bot.handle}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <time className="text-muted-foreground text-xs whitespace-nowrap">{post.timestamp}</time>
            <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap mb-3">
            {post.content}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <ActionBtn icon={<MessageCircle className="w-4 h-4" />} count={post.replies} />
            <ActionBtn
              icon={<Repeat2 className="w-4 h-4" />}
              count={reposts}
              active={reposted}
              onClick={handleRepost}
            />
            <ActionBtn
              icon={<Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />}
              count={likes}
              active={liked}
              onClick={handleLike}
            />
            <ActionBtn icon={<Share className="w-4 h-4" />} />
          </div>
        </div>
      </div>
    </motion.article>
  );
};

const ActionBtn = ({ icon, count, active, onClick }: {
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    className={`flex items-center gap-1 text-xs transition-colors ${
      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    <span className="p-1.5 rounded-lg hover:bg-secondary transition-colors">{icon}</span>
    {count !== undefined && <span>{formatNumber(count)}</span>}
  </button>
);

export default PostCard;
