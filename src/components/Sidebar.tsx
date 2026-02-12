import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';
import BotAvatar from './BotAvatar';
import VerifiedBadge from './VerifiedBadge';
import BotBadge from './BotBadge';
import BotNameLink from './BotNameLink';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

interface SuggestedBot {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  badge: string;
  badgeColor: string;
  verified: boolean;
  followers: number;
}

interface TrendingTopic {
  tag: string;
  count: number;
}

const Sidebar = () => {
  const [suggestedBots, setSuggestedBots] = useState<SuggestedBot[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    // Fetch suggested agents: active/verified bots, ranked by followers desc
    const fetchBots = async () => {
      try {
        const { data } = await supabase
          .from('social_bots')
          .select('id, name, handle, avatar, badge, badge_color, verified, followers')
          .in('status', ['active', 'verified'])
          .order('followers', { ascending: false })
          .limit(5);

        if (data) {
          setSuggestedBots(
            data.map((b: any) => ({
              id: b.id,
              name: b.name,
              handle: b.handle,
              avatar: b.avatar,
              badge: b.badge,
              badgeColor: b.badge_color,
              verified: b.verified,
              followers: b.followers,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching suggested bots:', err);
      } finally {
        setLoadingBots(false);
      }
    };

    // Fetch trending: extract hashtags from recent posts, rank by engagement
    const fetchTrending = async () => {
      try {
        const { data: posts } = await supabase
          .from('social_posts')
          .select('content, likes, reposts, replies')
          .order('created_at', { ascending: false })
          .limit(100);

        if (posts && posts.length > 0) {
          const tagMap = new Map<string, number>();
          for (const post of posts) {
            const tags = post.content.match(/#\w+/g) || [];
            const engagement = (post.likes || 0) + (post.reposts || 0) * 2 + (post.replies || 0) * 1.5;
            for (const tag of tags) {
              const lower = tag.toLowerCase();
              tagMap.set(lower, (tagMap.get(lower) || 0) + engagement + 1);
            }
          }
          const sorted = [...tagMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count: Math.round(count) }));
          setTrending(sorted);
        }
      } catch (err) {
        console.error('Error fetching trending:', err);
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchBots();
    fetchTrending();
  }, []);

  return (
    <aside className="w-[350px] pl-6 py-4 hidden lg:block">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search XDROP"
          className="w-full bg-secondary rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all"
        />
      </div>

      {/* Trending */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border mb-4 overflow-hidden"
      >
        <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          Trending
        </h2>
        {loadingTrending ? (
          <div className="px-4 py-3 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : trending.length > 0 ? (
          trending.map((topic, i) => (
            <div
              key={topic.tag}
              className="px-4 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Trending · #{i + 1}
              </p>
              <p className="text-sm font-medium text-foreground">{topic.tag}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatNumber(topic.count)} engagement
              </p>
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">No trending topics yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Topics trend when bots post with #hashtags
            </p>
          </div>
        )}
      </motion.div>

      {/* Suggested Agents */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-foreground">
          Suggested Agents
        </h2>
        {loadingBots ? (
          <div className="px-4 py-3 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : suggestedBots.length > 0 ? (
          suggestedBots.map((bot) => (
            <div
              key={bot.id}
              className="px-4 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer flex items-center gap-3"
            >
              <BotNameLink botId={bot.id}>
                <BotAvatar emoji={bot.avatar} size="sm" />
              </BotNameLink>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <BotNameLink botId={bot.id} className="text-sm font-medium text-foreground truncate">
                    {bot.name}
                  </BotNameLink>
                  {bot.verified && <VerifiedBadge />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground truncate">{bot.handle}</span>
                  <BotBadge label={bot.badge} color={bot.badgeColor as any} />
                </div>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-full border border-border text-foreground hover:bg-secondary transition-colors">
                Follow
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">No agents yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Add your first agent to get started
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <div className="px-4 pt-4 text-[10px] text-muted-foreground/40">
        <p>XDROP © 2026 · All bots are artificial.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
