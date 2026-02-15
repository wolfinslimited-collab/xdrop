import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface PostContentProps {
  content: string;
  truncate?: boolean;
}

const TRUNCATE_LENGTH = 280;

// Matches raw image/GIF URLs on their own line or inline
const IMAGE_URL_REGEX = /(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S*)?)/gi;

/**
 * Renders post content with clickable #hashtags, @mentions, markdown images/GIFs,
 * and auto-embedded image/GIF URLs
 */
const PostContent = ({ content, truncate = false }: PostContentProps) => {
  const isTruncated = truncate && content.length > TRUNCATE_LENGTH;
  const displayContent = isTruncated
    ? content.slice(0, TRUNCATE_LENGTH).trimEnd()
    : content;

  // Check if content contains markdown images or raw image URLs
  const hasMarkdownImages = /!\[.*?\]\(.*?\)/.test(displayContent);
  const hasRawImageUrls = IMAGE_URL_REGEX.test(displayContent);

  const continueReading = isTruncated && (
    <span className="text-primary text-xs font-medium ml-1">…Continue reading</span>
  );

  if (hasMarkdownImages) {
    return (
      <div className="text-foreground text-sm leading-relaxed mb-3 prose prose-sm prose-invert max-w-none [&_img]:rounded-lg [&_img]:max-h-72 [&_img]:my-2 [&_p]:my-1 [&_a]:text-primary [&_a]:underline">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => {
              const text = String(children);
              if (text.startsWith('#')) {
                const tag = text.slice(1);
                return (
                  <Link
                    to={`/tag/${tag}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:underline font-medium"
                  >
                    {text}
                  </Link>
                );
              }
              if (text.startsWith('@')) {
                return (
                  <Link
                    to={`/explore?search=${encodeURIComponent(text)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:underline font-medium"
                  >
                    {text}
                  </Link>
                );
              }
              return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
            },
          }}
        >
          {displayContent}
        </ReactMarkdown>
        {continueReading}
      </div>
    );
  }

  // Split by hashtags, mentions, AND raw image URLs
  const splitPattern = hasRawImageUrls
    ? /(#\w+|@\w+|https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S*)?)/gi
    : /(#\w+|@\w+)/g;

  const parts = displayContent.split(splitPattern);

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
          return (
            <Link
              key={i}
              to={`/explore?search=${encodeURIComponent(part)}`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        if (IMAGE_URL_REGEX.test(part)) {
          IMAGE_URL_REGEX.lastIndex = 0; // reset regex
          return (
            <img
              key={i}
              src={part}
              alt="Shared media"
              className="rounded-lg max-h-72 my-2 w-auto max-w-full"
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
      {continueReading}
    </div>
  );
};

export default PostContent;
