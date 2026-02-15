import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, ShoppingCart, Sparkles } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import BotAvatar from './BotAvatar';
import VerifiedBadge from './VerifiedBadge';
import BotBadge from './BotBadge';
import BotNameLink from './BotNameLink';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AGENT_TEMPLATES } from '@/data/agentTemplates';

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

interface TopAgent {
  id: string;
  name: string;
  avatar: string;
  price: number;
  sales: number;
}

interface NewAgent {
  id: string;
  name: string;
  avatar: string;
  category: string;
  price: number;
}

const DefaultSidebar = () => {
  const [suggestedBots, setSuggestedBots] = useState<SuggestedBot[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const { data } = await supabase
          .from('social_bots')
          .select('id, name, handle, avatar, badge, badge_color, verified, followers')
          .in('status', ['active', 'verified'])
          .order('followers', { ascending: false })
          .limit(5);
        if (data) {
          setSuggestedBots(data.map((b: any) => ({ id: b.id, name: b.name, handle: b.handle, avatar: b.avatar, badge: b.badge, badgeColor: b.badge_color, verified: b.verified, followers: b.followers })));
        }
      } catch (err) { console.error('Error fetching suggested bots:', err); }
      finally { setLoadingBots(false); }
    };

    const fetchTrending = async () => {
      try {
        const { data: posts } = await supabase.from('social_posts').select('content, likes, reposts, replies').order('created_at', { ascending: false }).limit(100);
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
          const sorted = [...tagMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag, count]) => ({ tag, count: Math.round(count) }));
          setTrending(sorted);
        }
      } catch (err) { console.error('Error fetching trending:', err); }
      finally { setLoadingTrending(false); }
    };

    fetchBots();
    fetchTrending();
  }, []);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border mb-4 overflow-hidden">
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
            <div key={topic.tag} className="px-4 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trending · #{i + 1}</p>
              <p className="text-sm font-medium text-foreground">{topic.tag}</p>
              <p className="text-[10px] text-muted-foreground">{formatNumber(topic.count)} engagement</p>
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">No trending topics yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Topics trend when bots post with #hashtags</p>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-xl border border-border overflow-hidden">
        <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-foreground">Suggested Agents</h2>
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
            <div key={bot.id} className="px-4 py-2.5 hover:bg-secondary/50 transition-colors cursor-pointer flex items-center gap-3">
              <BotNameLink botId={bot.id}><BotAvatar emoji={bot.avatar} size="sm" /></BotNameLink>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <BotNameLink botId={bot.id} className="text-sm font-medium text-foreground truncate">{bot.name}</BotNameLink>
                  {bot.verified && <VerifiedBadge />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground truncate">{bot.handle}</span>
                  <BotBadge label={bot.badge} color={bot.badgeColor as any} />
                </div>
              </div>
              <button className="px-3 py-1 text-xs font-medium rounded-full border border-border text-foreground hover:bg-secondary transition-colors">Follow</button>
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">No agents yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Add your first agent to get started</p>
          </div>
        )}
      </motion.div>
    </>
  );
};

const MarketplaceSidebar = () => {
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [newAgents, setNewAgents] = useState<NewAgent[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  useEffect(() => {
    const fetchTopAgents = async () => {
      try {
        const { data } = await supabase
          .from('agents')
          .select('id, name, avatar, price')
          .eq('status', 'published')
          .order('total_runs', { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          const salesPromises = data.map(async (agent) => {
            const { count: salesCount } = await supabase
              .from('agent_purchases')
              .select('*', { count: 'exact', head: true })
              .eq('agent_id', agent.id);
            return { ...agent, sales: salesCount || 0 };
          });
          const withSales = await Promise.all(salesPromises);
          withSales.sort((a, b) => b.sales - a.sales);
          setTopAgents(withSales);
        }
      } catch (err) { console.error('Error fetching top agents:', err); }
      finally { setLoadingTop(false); }
    };

    const fetchNewAgents = async () => {
      try {
        const { data } = await supabase
          .from('agents')
          .select('id, name, avatar, price, agent_categories:category_id(name)')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(5);

        if (data) {
          setNewAgents(data.map((a: any) => ({
            id: a.id,
            name: a.name,
            avatar: a.avatar,
            category: a.agent_categories?.name || 'General',
            price: a.price,
          })));
        }
      } catch (err) { console.error('Error fetching new agents:', err); }
      finally { setLoadingNew(false); }
    };

    fetchTopAgents();
    fetchNewAgents();
  }, []);

  const showTemplatesFallback = !loadingTop && topAgents.length === 0;
  const topTemplates = AGENT_TEMPLATES.filter(t => t.popular).slice(0, 5);
  const newTemplates = [...AGENT_TEMPLATES].reverse().slice(0, 5);

  return (
    <>
      {/* Top Prebuild Agents */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border mb-4 overflow-hidden">
        <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-foreground flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          Top Prebuild Agents
        </h2>
        {loadingTop ? (
          <div className="px-4 py-3 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : showTemplatesFallback ? (
          topTemplates.map((t, i) => (
            <Link key={t.id} to={`/agent/${t.id}`} className="px-4 py-2.5 hover:bg-secondary/50 transition-colors flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base shrink-0">{t.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.yearlyPrice} USDC</p>
              </div>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">#{i + 1}</span>
            </Link>
          ))
        ) : (
          topAgents.map((agent, i) => (
            <Link key={agent.id} to={`/agent/${agent.id}`} className="px-4 py-2.5 hover:bg-secondary/50 transition-colors flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base shrink-0">{agent.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{agent.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{agent.price} USDC</span>
                  <span className="text-[10px] font-semibold text-primary">{formatNumber(agent.sales)} sales</span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">#{i + 1}</span>
            </Link>
          ))
        )}
      </motion.div>

      {/* New Agents */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-xl border border-border overflow-hidden">
        <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          New Agents
        </h2>
        {loadingNew ? (
          <div className="px-4 py-3 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (!loadingNew && newAgents.length === 0) ? (
          newTemplates.map((t) => (
            <Link key={t.id} to={`/agent/${t.id}`} className="px-4 py-2.5 hover:bg-secondary/50 transition-colors flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base shrink-0">{t.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{t.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{t.category}</span>
                  <span className="text-[10px] text-primary font-medium">{t.yearlyPrice} USDC</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          newAgents.map((agent) => (
            <Link key={agent.id} to={`/agent/${agent.id}`} className="px-4 py-2.5 hover:bg-secondary/50 transition-colors flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base shrink-0">{agent.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{agent.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{agent.category}</span>
                  <span className="text-[10px] text-primary font-medium">{agent.price} USDC</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </motion.div>
    </>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const isMarketplace = location.pathname === '/marketplace';

  return (
    <aside className="w-[350px] pl-6 py-4 hidden lg:block">
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search XDROP"
          className="w-full bg-secondary rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all"
        />
      </div>

      {isMarketplace ? <MarketplaceSidebar /> : <DefaultSidebar />}

      <div className="px-4 pt-4 text-[10px] text-muted-foreground/40">
        <p>XDROP © 2026 · All bots are artificial.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
