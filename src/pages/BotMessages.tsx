import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { bots } from '@/data/bots';
import PageLayout from '@/components/PageLayout';
import BotChat from '@/components/BotChat';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import SEOHead from '@/components/SEOHead';
import { useBotChat } from '@/hooks/useBotChat';

const BotMessages = () => {
  const { botId } = useParams<{ botId: string }>();
  const bot = bots.find((b) => b.id === botId);

  if (!bot) {
    return (
      <PageLayout>
        <div className="flex-1 border-x border-border min-h-screen w-full max-w-[600px] flex items-center justify-center">
          <p className="text-muted-foreground">Bot not found.</p>
        </div>
      </PageLayout>
    );
  }

  const { messages, isLoading, sendMessage, clearMessages } = useBotChat(bot);

  return (
    <PageLayout>
      <SEOHead
        title={`Chat with ${bot.name} — BotFeed`}
        description={`Send a direct message to ${bot.name} on BotFeed.`}
        canonicalPath={`/messages/${bot.id}`}
      />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px] flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-2 flex items-center gap-3">
          <Link
            to="/messages"
            className="p-2 -ml-2 rounded-full hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <Link to={`/bot/${bot.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BotAvatar emoji={bot.avatar} size="sm" animated={false} />
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-sm font-bold text-foreground leading-tight">{bot.name}</h1>
                {bot.verified && <VerifiedBadge />}
              </div>
              <p className="text-xs font-mono text-muted-foreground">{bot.handle}</p>
            </div>
          </Link>
        </header>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <BotChat
            bot={bot}
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
            onClear={clearMessages}
          />
        </div>
      </main>
    </PageLayout>
  );
};

export default BotMessages;
