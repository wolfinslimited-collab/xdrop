import { useState, useRef, useEffect } from 'react';
import { Play, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import type { AgentConfig } from '@/types/agentBuilder';

interface AgentRunPanelProps {
  agentId: string;
  agentConfig: AgentConfig;
}

type JobStatus = 'idle' | 'submitting' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready',
  submitting: 'Submitting…',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  idle: 'text-muted-foreground',
  submitting: 'text-muted-foreground',
  RUNNING: 'text-blue-400',
  COMPLETED: 'text-emerald-400',
  FAILED: 'text-red-400',
  CANCELLED: 'text-muted-foreground',
};

const AgentRunPanel = ({ agentId, agentConfig }: AgentRunPanelProps) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<JobStatus>('idle');
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const isRunning = status === 'submitting' || status === 'RUNNING';
  const isDone = status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED';

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    stopTimer();
    setStatus('CANCELLED');
    setError('Run cancelled by user');
  };

  const handleRun = async () => {
    setStatus('submitting');
    setOutput(null);
    setError(null);
    startTimer();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const session = await supabase.auth.getSession();
      setStatus('RUNNING');

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'run',
          agentId,
          prompt: input.trim() || undefined,
          agentConfig,
        }),
        signal: controller.signal,
      });

      const data = await resp.json();

      if (!resp.ok) {
        setStatus('FAILED');
        setError(data.error || 'Run failed');
      } else {
        setStatus('COMPLETED');
        setOutput(data.output);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setStatus('FAILED');
      setError(err.message || 'Run failed');
    } finally {
      stopTimer();
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    stopTimer();
    setStatus('idle');
    setOutput(null);
    setError(null);
    setElapsed(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Run Agent</h4>
        {isDone && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={handleReset}>
            <RefreshCw className="w-3 h-3" /> New Run
          </Button>
        )}
      </div>

      {!isRunning && !isDone && (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter task input (optional)..."
            rows={2}
            className="w-full bg-background rounded-lg py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/30 focus:outline-none resize-none"
          />
          <Button onClick={handleRun} className="w-full gap-2" size="sm">
            <Play className="w-3.5 h-3.5" /> Run {agentConfig.name || 'Agent'}
          </Button>
        </>
      )}

      {(isRunning || isDone) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
              {status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {status === 'FAILED' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
              <span className={`text-xs font-medium ${STATUS_COLORS[status] || 'text-muted-foreground'}`}>
                {STATUS_LABELS[status] || status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              {formatTime(elapsed)}
            </div>
          </div>

          {isRunning && (
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={handleCancel}>
              <StopCircle className="w-3.5 h-3.5" /> Cancel Run
            </Button>
          )}

          {isRunning && <Progress value={50} className="h-1.5" />}
          {isDone && <Progress value={100} className="h-1.5" />}

          {status === 'COMPLETED' && output && (
            <div className="p-3 rounded-lg border border-foreground/20 bg-background text-xs whitespace-pre-wrap max-h-48 overflow-y-auto text-foreground">
              {output}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs text-red-400 whitespace-pre-wrap">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentRunPanel;
