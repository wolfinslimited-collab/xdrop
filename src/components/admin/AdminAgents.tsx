import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Cpu, Globe, ChevronLeft, ChevronRight, Zap, Link2, AlertCircle, CheckCircle, Clock, Archive } from 'lucide-react';
import BotAvatar from '@/components/BotAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`;

async function adminFetch(action: string, session: any, opts?: { method?: string; body?: any; page?: number }) {
  const params = new URLSearchParams({ action });
  if (opts?.page !== undefined) params.set('page', String(opts.page));
  const res = await fetch(`${FUNC_URL}?${params}`, {
    method: opts?.method || 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export default function AdminAgents({ session }: { session: any }) {
  const [agents, setAgents] = useState<any[]>([]);
  const [manifests, setManifests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'api-connected' | 'draft' | 'published' | 'archived'>('all');

  const fetchAgents = useCallback(async (p: number) => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await adminFetch('list-agents', session, { page: p });
      setAgents(data.agents || []);
      setManifests(data.manifests || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchAgents(page); }, [page, fetchAgents]);

  const updateStatus = async (agentId: string, status: string) => {
    try {
      await adminFetch('update-agent-status', session, { method: 'POST', body: { agentId, status } });
      toast({ title: 'Agent status updated' });
      fetchAgents(page);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const getManifest = (agentId: string) => manifests.find((m: any) => m.agent_id === agentId);

  const hasApiConnection = (agent: any) => {
    const manifest = getManifest(agent.id);
    const hasIntegrations = agent.required_integrations && agent.required_integrations.length > 0;
    const hasTriggers = manifest?.triggers && Array.isArray(manifest.triggers) && manifest.triggers.length > 0;
    const hasTools = manifest?.tool_permissions && Array.isArray(manifest.tool_permissions) && manifest.tool_permissions.length > 0;
    return hasIntegrations || hasTriggers || hasTools;
  };

  const filteredAgents = agents.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'api-connected') return hasApiConnection(a);
    return a.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1"><CheckCircle className="w-2.5 h-2.5" />Published</Badge>;
      case 'archived': return <Badge className="bg-muted text-muted-foreground border-border text-[10px] gap-1"><Archive className="w-2.5 h-2.5" />Archived</Badge>;
      default: return <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] gap-1"><Clock className="w-2.5 h-2.5" />Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  const filterButtons = [
    { id: 'all' as const, label: 'All Agents', icon: Bot },
    { id: 'api-connected' as const, label: 'API Connected', icon: Link2 },
    { id: 'published' as const, label: 'Published', icon: Globe },
    { id: 'draft' as const, label: 'Drafts', icon: Clock },
  ];

  return (
    <div className="p-6">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-1 p-3 border-b border-border">
          {filterButtons.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground pr-2">{filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Agent</th>
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Integrations</th>
                <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAgents.map((agent: any, i: number) => {
                const manifest = getManifest(agent.id);
                const integrations = agent.required_integrations || [];
                const connected = hasApiConnection(agent);
                const creatorName = agent.profiles?.display_name || 'Unknown';

                return (
                  <motion.tr
                    key={agent.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BotAvatar emoji={agent.avatar || '🤖'} size="sm" animated={false} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">by {creatorName}</span>
                            {agent.total_runs > 0 && (
                              <span className="text-[10px] text-muted-foreground">· {agent.total_runs} runs</span>
                            )}
                            {agent.price > 0 && (
                              <span className="text-[10px] text-accent font-medium">${agent.price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {connected ? (
                          <>
                            <Zap className="w-3.5 h-3.5 text-success" />
                            <span className="text-[10px] text-success font-medium">{integrations.length || (manifest ? '✓' : '—')}</span>
                            {integrations.slice(0, 2).map((int: string) => (
                              <Badge key={int} variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border">
                                {int}
                              </Badge>
                            ))}
                            {integrations.length > 2 && (
                              <span className="text-[9px] text-muted-foreground">+{integrations.length - 2}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 opacity-40" />None
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(agent.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Select value={agent.status} onValueChange={(val) => updateStatus(agent.id, val)}>
                          <SelectTrigger className="w-28 h-8 text-[11px] bg-secondary/30 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Cpu className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">No agents found</p>
          </div>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/5">
            <span className="text-xs text-muted-foreground">
              Showing {page * 50 + 1}–{Math.min((page + 1) * 50, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} className="h-7 px-2 text-xs">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">Page {page + 1}</span>
              <Button variant="outline" size="sm" disabled={(page + 1) * 50 >= total} onClick={() => setPage(page + 1)} className="h-7 px-2 text-xs">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
