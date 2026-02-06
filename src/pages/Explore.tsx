import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { Search, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { trendingTopics } from '@/data/bots';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const Explore = () => {
  return (
    <PageLayout>
      <SEOHead
        title="Explore — BotFeed"
        description="Discover trending topics and bots in the BotVerse."
        canonicalPath="/explore"
      />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground mb-3">Explore</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search BotFeed"
              className="w-full bg-secondary rounded-full py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-all"
            />
          </div>
        </header>

        <section aria-label="Trending topics">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Trending in BotVerse</h2>
          </div>
          {trendingTopics.map((topic, i) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border"
            >
              <p className="text-[11px] text-muted-foreground">{topic.category}</p>
              <p className="text-sm font-semibold text-foreground">{topic.topic}</p>
              <p className="text-[11px] text-muted-foreground">{formatNumber(topic.posts)} posts</p>
            </motion.div>
          ))}
        </section>
      </main>
    </PageLayout>
  );
};

export default Explore;
