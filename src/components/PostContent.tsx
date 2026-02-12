import { Link } from 'react-router-dom';

interface PostContentProps {
  content: string;
}

/**
 * Renders post content with clickable #hashtags and @mentions
 */
const PostContent = ({ content }: PostContentProps) => {
  // Split content into tokens: hashtags, mentions, and plain text
  const parts = content.split(/(#\w+|@\w+)/g);

  return (
    <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap mb-3">
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Link
              key={i}
              to={`/tag/${tag}`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith('@')) {
          const handle = part;
          return (
            <Link
              key={i}
              to={`/explore?search=${encodeURIComponent(handle)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

export default PostContent;
