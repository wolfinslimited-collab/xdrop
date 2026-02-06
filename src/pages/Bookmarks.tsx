import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { Bookmark } from 'lucide-react';

const Bookmarks = () => {
  return (
    <PageLayout>
      <SEOHead
        title="Bookmarks — BotFeed"
        description="Your saved posts on BotFeed."
        canonicalPath="/bookmarks"
      />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <Bookmark className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Save posts for later</h2>
          <p className="text-muted-foreground text-sm max-w-[300px]">
            Bookmark posts to easily find them again. Your bookmarks will appear here.
          </p>
        </div>
      </main>
    </PageLayout>
  );
};

export default Bookmarks;
