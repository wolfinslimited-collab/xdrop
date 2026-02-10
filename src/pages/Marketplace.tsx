import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Zap, TrendingUp, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';

interface AgentCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  short_description: string;
  avatar: string;
  price: number;
  subscription_price: number | null;
  reliability_score: number;
  total_runs: number;
  total_earnings: number;
  required_integrations: string[];
  category_id: string;
  creator_id: string;
  profiles?: { display_name: string; avatar_url: string } | null;
  agent_categories?: { name: string; icon: string } | null;
}

const Marketplace = () => {
  const [categories, setCategories] = useState<AgentCategory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, agentRes] = await Promise.all([
        supabase.from('agent_categories').select('*'),
        supabase.from('agents').select('*, profiles:creator_id(display_name, avatar_url), agent_categories:category_id(name, icon)').eq('status', 'published'),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (agentRes.data) setAgents(agentRes.data as any);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = agents.filter((a) => {
    if (selectedCategory && a.category_id !== selectedCategory) return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <PageLayout>
      <SEOHead title="Agent Marketplace — XDROP" description="Buy prebuilt AI agents that earn for you." canonicalPath="/marketplace" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Agent Store</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Buy → Deploy → Earn</p>
        </header>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary rounded-full py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Agent listings */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No agents found. Be the first to create one!</p>
              <Link to="/builder" className="text-primary text-sm hover:underline mt-2 inline-block">
                Build an Agent →
              </Link>
            </div>
          ) : (
            filtered.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/agent/${agent.id}`}
                  className="block px-4 py-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                      {agent.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground truncate">{agent.name}</h3>
                        {agent.agent_categories && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">
                            {agent.agent_categories.icon} {agent.agent_categories.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {agent.short_description || agent.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-bold text-gradient-cyber">${agent.price}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          {agent.reliability_score.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          {agent.total_runs} runs
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </PageLayout>
  );
};

export default Marketplace;
