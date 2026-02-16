import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Zap, TrendingUp, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AGENT_TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/agentTemplates';
import PurchaseDialog from '@/components/marketplace/PurchaseDialog';
import type { AgentTemplate } from '@/data/agentTemplates';

const MobileMarketplaceTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [purchaseTemplate, setPurchaseTemplate] = useState<AgentTemplate | null>(null);

  const templateCategories = ['All', ...TEMPLATE_CATEGORIES];

  const filteredTemplates = AGENT_TEMPLATES.filter(t => {
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-bold text-foreground font-display mb-1">Marketplace</h1>
        <p className="text-xs text-muted-foreground">Pre-built, verified AI agents ready to deploy</p>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
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
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {templateCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              (cat === 'All' && !selectedCategory) || selectedCategory === cat
                ? 'bg-foreground text-background border-foreground'
                : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4 pb-4 space-y-3">
        {filteredTemplates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link to={`/agent/${template.id}`}>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">{template.name}</h3>
                      {template.popular && (
                        <Badge variant="secondary" className="text-[10px] bg-accent/15 text-accent border-accent/20 shrink-0">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-bold text-foreground">{template.yearlyPrice} USDC</span>
                      <span className="flex items-center gap-1 text-xs text-success">
                        <TrendingUp className="w-3 h-3" />
                        {Math.round(template.yearlyPrice * template.monthlyReturnMin / 100)}–{Math.round(template.yearlyPrice * template.monthlyReturnMax / 100)}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No agents found matching your search.
          </div>
        )}
      </div>

      <PurchaseDialog
        template={purchaseTemplate}
        open={!!purchaseTemplate}
        onOpenChange={(open) => { if (!open) setPurchaseTemplate(null); }}
      />
    </div>
  );
};

export default MobileMarketplaceTab;
