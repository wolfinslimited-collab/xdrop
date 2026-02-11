import { Terminal, CheckCircle2, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DeployLog } from './TestDeployPanel';
import { useRef, useEffect } from 'react';

interface LogsPanelProps {
  logs: DeployLog[];
  onClear?: () => void;
}

const logTypeStyles: Record<DeployLog['type'], string> = {
  info: 'text-muted-foreground',
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
};

const logTypeIcons: Record<DeployLog['type'], React.ReactNode> = {
  info: <Terminal className="w-3 h-3" />,
  success: <CheckCircle2 className="w-3 h-3" />,
  error: <XCircle className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

const LogsPanel = ({ logs, onClear }: LogsPanelProps) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Agent Logs</h3>
          <p className="text-xs text-muted-foreground">Deploy & runtime logs</p>
        </div>
        {logs.length > 0 && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-xs text-muted-foreground">
            <Trash2 className="w-3 h-3" /> Clear
          </Button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Terminal className="w-8 h-8 mb-3 opacity-30" />
          <p className="text-xs">No logs yet</p>
          <p className="text-[10px] mt-1 opacity-60">Deploy your agent to see logs here</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background/80 max-h-[400px] overflow-y-auto">
          <div className="p-2 space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={`flex items-start gap-1.5 text-[11px] font-mono ${logTypeStyles[log.type]}`}>
                <span className="flex-shrink-0 mt-px">{logTypeIcons[log.type]}</span>
                <span className="text-muted-foreground/50 flex-shrink-0">{formatTime(log.timestamp)}</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>
      )}

      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Stats</p>
        <div className="grid grid-cols-3 gap-2">
          {(['info', 'warning', 'error'] as const).map(type => (
            <div key={type} className="text-center">
              <p className={`text-sm font-semibold ${logTypeStyles[type]}`}>{logs.filter(l => l.type === type).length}</p>
              <p className="text-[9px] text-muted-foreground capitalize">{type}s</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogsPanel;
