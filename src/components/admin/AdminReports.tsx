import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, ChevronLeft, ChevronRight, Trash2, CheckCircle, XCircle, Clock, Eye, ImageIcon, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminReports } from '@/hooks/useAdmin';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function AdminReports({ session }: { session: any }) {
  const { reports, total, page, setPage, statusFilter, setStatusFilter, loading, updateReport, deleteReport } = useAdminReports(session);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] gap-1"><Clock className="w-2.5 h-2.5" />Pending</Badge>;
      case 'in_review': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] gap-1"><Eye className="w-2.5 h-2.5" />In Review</Badge>;
      case 'resolved': return <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1"><CheckCircle className="w-2.5 h-2.5" />Resolved</Badge>;
      case 'dismissed': return <Badge className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20 text-[10px] gap-1"><XCircle className="w-2.5 h-2.5" />Dismissed</Badge>;
      default: return <Badge className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Status filter tabs */}
        <div className="flex gap-1 p-3 border-b border-border flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab.value
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground self-center">{total} report{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Reports list */}
        <div className="divide-y divide-border">
          {reports.map((report: any, i: number) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="hover:bg-secondary/20 transition-colors"
            >
              {/* Main row */}
              <div
                className="px-4 py-3.5 flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
              >
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Flag className="w-3.5 h-3.5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{report.category}</span>
                    {getStatusBadge(report.status)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>by {report.profile?.display_name || 'Unknown'}</span>
                    <span>·</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    {report.screenshot_url && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><ImageIcon className="w-2.5 h-2.5" />Screenshot</span>
                      </>
                    )}
                  </div>
                  {report.details && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{report.details}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === report.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-4 pb-4 ml-11 space-y-3"
                >
                  {report.details && (
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Details</label>
                      <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">{report.details}</p>
                    </div>
                  )}

                  {report.screenshot_url && (
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Screenshot</label>
                      <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={report.screenshot_url}
                          alt="Report screenshot"
                          className="mt-1 max-w-xs h-32 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                        />
                      </a>
                    </div>
                  )}

                  {report.admin_notes && (
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin Notes</label>
                      <p className="text-xs text-foreground mt-1">{report.admin_notes}</p>
                    </div>
                  )}

                  {/* Admin note input */}
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Add Note</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        value={noteInputs[report.id] || ''}
                        onChange={(e) => setNoteInputs(prev => ({ ...prev, [report.id]: e.target.value }))}
                        placeholder="Admin note..."
                        className="flex-1 bg-secondary rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/20 focus:outline-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px]"
                        disabled={!noteInputs[report.id]?.trim()}
                        onClick={() => {
                          updateReport(report.id, report.status, noteInputs[report.id]?.trim());
                          setNoteInputs(prev => ({ ...prev, [report.id]: '' }));
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />Save
                      </Button>
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="flex gap-2 flex-wrap">
                    {report.status !== 'in_review' && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => updateReport(report.id, 'in_review')}>
                        <Eye className="w-3 h-3 mr-1" />Mark In Review
                      </Button>
                    )}
                    {report.status !== 'resolved' && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] text-success border-success/20 hover:bg-success/10" onClick={() => updateReport(report.id, 'resolved')}>
                        <CheckCircle className="w-3 h-3 mr-1" />Resolve
                      </Button>
                    )}
                    {report.status !== 'dismissed' && (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={() => updateReport(report.id, 'dismissed')}>
                        <XCircle className="w-3 h-3 mr-1" />Dismiss
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {reports.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Flag className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">No reports found</p>
            </div>
          )}
        </div>

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
