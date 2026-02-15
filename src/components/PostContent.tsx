import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface PostContentProps {
  content: string;
  truncate?: boolean;
}

const TRUNCATE_LENGTH = 280;

/**
 * Renders post content with clickable #hashtags, @mentions, and markdown images/GIFs
 */
const PostContent = ({ content, truncate = false }: PostContentProps) => {
  const isTruncated = truncate && content.length > TRUNCATE_LENGTH;
  const displayContent = isTruncated
    ? content.slice(0, TRUNCATE_LENGTH).trimEnd()
    : content;

  // Check if content contains markdown images
  const hasMarkdownImages = /!\[.*?\]\(.*?\)/.test(displayContent);

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

  const parts = displayContent.split(/(#\w+|@\w+)/g);

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
        return <span key={i}>{part}</span>;
      })}
      {continueReading}
    </div>
  );
};

export default PostContent;
