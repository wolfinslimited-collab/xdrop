import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Star, Zap, TrendingUp, Server,
  CandlestickChart, Crosshair, Scale, Sprout, Grid3x3, Flame, Palette,
  Heart, Camera, Clapperboard, Play,
  Briefcase, Wrench,
  Package, Tag, Gift,
  Globe,
  Receipt, Share2, Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AGENT_TEMPLATES, TEMPLATE_CATEGORIES, type AgentTemplate } from '@/data/agentTemplates';
import { useToast } from '@/hooks/use-toast';
import PurchaseDialog from '@/components/marketplace/PurchaseDialog';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, LucideIcon> = {
  'candlestick-chart': CandlestickChart,
  'crosshair': Crosshair,
  'scale': Scale,
  'sprout': Sprout,
  'zap': Zap,
  'grid-3x3': Grid3x3,
  'flame': Flame,
  'palette': Palette,
  'heart': Heart,
  'camera': Camera,
  'clapperboard': Clapperboard,
  'play': Play,
  'briefcase': Briefcase,
  'wrench': Wrench,
  'package': Package,
  'tag': Tag,
  'gift': Gift,
  'globe': Globe,
  'receipt': Receipt,
  'share-2': Share2,
  'star': Star,
  'truck': Truck,
};

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

type Tab = 'templates' | 'community';

const Marketplace = () => {
  const [tab, setTab] = useState<Tab>('templates');
  const [categories, setCategories] = useState<AgentCategory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [purchaseTemplate, setPurchaseTemplate] = useState<AgentTemplate | null>(null);

  // Fetch community agents when tab switches
  useEffect(() => {
    if (tab !== 'community') return;
    setLoading(true);
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
  }, [tab]);

  // Filtering for templates tab
  const filteredTemplates = AGENT_TEMPLATES.filter(t => {
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtering for community tab
  const filteredAgents = agents.filter((a) => {
    if (selectedCategory && a.category_id !== selectedCategory) return false;
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDeploy = (template: AgentTemplate) => {
    setPurchaseTemplate(template);
  };

  const getIcon = (lucideIcon: string) => {
    const IconComponent = iconMap[lucideIcon];
    return IconComponent ? <IconComponent className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-primary" />;
  };

  const templateCategories = ['All', ...TEMPLATE_CATEGORIES];
  const communityCategories = [{ id: null as string | null, name: 'All', icon: '' }, ...categories.map(c => ({ id: c.id, name: c.name, icon: c.icon || '' }))];

  return (
    <PageLayout>
      <SEOHead title="Marketplace — XDROP" description="Browse and deploy pre-built AI agents or discover community-created agents." canonicalPath="/marketplace" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[900px]">
        {/* Hero Description */}
        <section className="px-5 pt-6 pb-5 border-b border-border bg-gradient-to-b from-accent/5 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <h1 className="text-lg font-bold text-foreground font-display">Marketplace</h1>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed mb-3">
            Every AI model listed here is <span className="font-semibold text-foreground">pre-built, rigorously tested, and verified</span> by top-performing users in the XDROP community.
          </p>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Star className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <span>Curated &amp; stress-tested by experienced builders before listing</span>
            </div>
            <div className="flex items-start gap-2">
              <Scale className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <span>Performance metrics are audited — what you see is what you get</span>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <span><span className="font-semibold text-foreground">Guaranteed by XDROP</span> — deploy with confidence, backed by our platform</span>
            </div>
          </div>
        </section>

        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">

          {/* Tabs */}
          <div className="flex gap-0 border-b border-border -mx-4 px-4">
            <button
              onClick={() => { setTab('templates'); setSelectedCategory(null); setSearchQuery(''); }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${tab === 'templates' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Templates
              {tab === 'templates' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              onClick={() => { setTab('community'); setSelectedCategory(null); setSearchQuery(''); }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${tab === 'community' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Community
              {tab === 'community' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>
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

        {/* Category pills */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border scrollbar-hide">
          {tab === 'templates' ? (
            templateCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  (cat === 'All' && !selectedCategory) || selectedCategory === cat
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))
          ) : (
            communityCategories.map((cat) => (
              <button
                key={cat.id || 'all'}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </button>
            ))
          )}
        </div>

        {/* TEMPLATES TAB */}
        {tab === 'templates' && (
          <>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredTemplates.map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link to={`/agent/${template.id}`} className="block">
                    <div className="bg-card border border-border rounded-xl hover:border-muted-foreground/30 transition-all h-full flex flex-col">
                      <div className="pb-3 pt-5 px-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              {getIcon(template.lucideIcon)}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground leading-tight">{template.name}</h3>
                              <span className="text-[10px] text-muted-foreground">{template.category}</span>
                            </div>
                          </div>
                          {template.popular && (
                            <Badge variant="secondary" className="text-[10px] bg-accent/15 text-accent border-accent/20">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 px-5 pb-3">
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{template.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {template.features.map(f => (
                            <span key={f} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">{f}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-success" />
                            <span className="text-xs font-semibold text-success">{Math.round(template.yearlyPrice * template.monthlyReturnMin / 100)}–{Math.round(template.yearlyPrice * template.monthlyReturnMax / 100)} USDC</span>
                            <span className="text-[10px] text-muted-foreground">/mo</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Lovable Cloud</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-border mt-auto">
                        <div>
                          <span className="text-lg font-bold text-foreground">{template.yearlyPrice} USDC</span>
                          <p className="text-[10px] text-primary font-medium">7-day free trial</p>
                        </div>
                        <Button
                          onClick={(e) => { e.preventDefault(); handleDeploy(template); }}
                          size="sm"
                          className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs px-4"
                        >
                          Buy Agent
                        </Button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            {filteredTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Search className="w-8 h-8 mb-3 opacity-40" />
                <p className="text-sm">No agents found matching your search.</p>
              </div>
            )}
          </>
        )}

        {/* COMMUNITY TAB */}
        {tab === 'community' && (
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-4 py-4 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-3 py-3">
                    <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-full" />
                      <div className="flex gap-3">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-20">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No agents found. Be the first to create one!</p>
                <Link to="/builder" className="text-primary text-sm hover:underline mt-2 inline-block">
                  Build an Agent →
                </Link>
              </div>
            ) : (
              filteredAgents.map((agent, i) => (
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
                          <span className="text-xs font-bold text-gradient-cyber">{agent.price} USDC</span>
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
        )}
      </main>
      <PurchaseDialog
        template={purchaseTemplate}
        open={!!purchaseTemplate}
        onOpenChange={(open) => { if (!open) setPurchaseTemplate(null); }}
      />
    </PageLayout>
  );
};

export default Marketplace;
