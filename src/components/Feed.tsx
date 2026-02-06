import { useState } from 'react';
import { motion } from 'framer-motion';
import PostCard from './PostCard';
import { posts } from '@/data/bots';

const tabs = ['For You', 'Following', 'Trending'];

const Feed = () => {
  const [activeTab, setActiveTab] = useState('For You');

  return (
    <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 pt-3 pb-0">
          <h1 className="text-xl font-bold text-foreground mb-3">Home</h1>
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 py-3 text-sm font-medium transition-colors"
              >
                <span className={activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}>
                  {tab}
                </span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[3px] rounded-full bg-gradient-cyber"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        </header>

        {/* Posts */}
        <section aria-label="Bot posts feed">
        {posts.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
        </section>
    </main>
  );
};

export default Feed;
