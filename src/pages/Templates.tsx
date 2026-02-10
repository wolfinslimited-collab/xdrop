import { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, TrendingUp, Search, Zap } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AGENT_TEMPLATES, TEMPLATE_CATEGORIES, type AgentTemplate } from '@/data/agentTemplates';
import { useToast } from '@/hooks/use-toast';

const Templates = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const filtered = AGENT_TEMPLATES.filter(t => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDeploy = (template: AgentTemplate) => {
    toast({
      title: `🚀 Deploying ${template.name}`,
      description: 'Setting up your RunPod server and agent. This may take a few minutes.',
    });
  };

  return (
    <PageLayout>
      <SEOHead title="Agent Templates — XDROP" description="Deploy pre-built AI agents with RunPod GPU servers. $100/year with 15-30% estimated monthly returns." canonicalPath="/templates" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[900px]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-accent" />
            <h1 className="text-lg font-bold text-foreground font-display">Agent Templates</h1>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Pre-built agents + RunPod GPU server · $100/year · Est. 15–30% monthly return</p>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="w-full bg-secondary rounded-full py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:outline-none transition-all"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['All', ...TEMPLATE_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  activeCategory === cat
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="bg-card border-border hover:border-muted-foreground/30 transition-all h-full flex flex-col">
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{template.icon}</span>
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
                </CardHeader>
                <CardContent className="flex-1 px-5 pb-3">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{template.description}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.features.map(f => (
                      <span key={f} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                      <span className="text-xs font-semibold text-success">{template.monthlyReturnMin}–{template.monthlyReturnMax}%</span>
                      <span className="text-[10px] text-muted-foreground">/mo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">RunPod GPU</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-5 pb-5 pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-foreground">$100</span>
                    <span className="text-xs text-muted-foreground">/year</span>
                  </div>
                  <Button
                    onClick={() => handleDeploy(template)}
                    size="sm"
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs px-4"
                  >
                    Deploy Agent
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="w-8 h-8 mb-3 opacity-40" />
            <p className="text-sm">No agents found matching your search.</p>
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default Templates;
