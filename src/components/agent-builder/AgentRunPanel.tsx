import { useState, useEffect, useRef } from 'react';
import { Play, Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface AgentRunPanelProps {
  endpointId: string;
  usePlatformKey: boolean;
  agentName: string;
}

type JobStatus = 'idle' | 'submitting' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMED_OUT';

const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready',
  submitting: 'Submitting…',
  IN_QUEUE: 'In Queue',
  IN_PROGRESS: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  TIMED_OUT: 'Timed Out',
};

const STATUS_COLORS: Record<string, string> = {
  idle: 'text-muted-foreground',
  submitting: 'text-muted-foreground',
  IN_QUEUE: 'text-amber-400',
  IN_PROGRESS: 'text-blue-400',
  COMPLETED: 'text-emerald-400',
  FAILED: 'text-red-400',
  CANCELLED: 'text-muted-foreground',
  TIMED_OUT: 'text-red-400',
};

const AgentRunPanel = ({ endpointId, usePlatformKey, agentName }: AgentRunPanelProps) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<JobStatus>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [output, setOutput] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isRunning = status === 'submitting' || status === 'IN_QUEUE' || status === 'IN_PROGRESS';
  const isDone = status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED' || status === 'TIMED_OUT';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const pollJobStatus = async (eid: string, jid: string) => {
    const session = await supabase.auth.getSession();
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-to-runpod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'job-status',
          endpointId: eid,
          jobId: jid,
          usePlatformKey,
        }),
      });
      const data = await resp.json();
      const jobStatus = data.status?.status;

      if (jobStatus === 'COMPLETED') {
        setStatus('COMPLETED');
        setOutput(data.status?.output);
        stopTimer();
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (jobStatus === 'FAILED') {
        setStatus('FAILED');
        setError(data.status?.error || 'Job failed');
        stopTimer();
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (jobStatus === 'CANCELLED' || jobStatus === 'TIMED_OUT') {
        setStatus(jobStatus);
        stopTimer();
        if (pollRef.current) clearInterval(pollRef.current);
      } else if (jobStatus) {
        setStatus(jobStatus);
      }
    } catch {
      // Keep polling
    }
  };

  const handleRun = async () => {
    setStatus('submitting');
    setOutput(null);
    setError(null);
    setJobId(null);
    startTimer();

    try {
      const session = await supabase.auth.getSession();
      const inputPayload = input.trim() ? { prompt: input.trim() } : {};

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-to-runpod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'run',
          endpointId,
          input: inputPayload,
          usePlatformKey,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setStatus('FAILED');
        setError(data.error || 'Failed to submit job');
        stopTimer();
        return;
      }

      const jid = data.job?.id;
      setJobId(jid);
      setStatus('IN_QUEUE');

      // Start polling every 2 seconds
      pollRef.current = setInterval(() => {
        pollJobStatus(endpointId, jid);
      }, 2000);
    } catch (err: any) {
      setStatus('FAILED');
      setError(err.message || 'Failed to submit job');
      stopTimer();
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    stopTimer();
    setStatus('idle');
    setOutput(null);
    setError(null);
    setJobId(null);
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

      {/* Input */}
      {!isRunning && !isDone && (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter task input (optional)..."
            rows={2}
            className="w-full bg-background rounded-lg py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:border-foreground/30 focus:outline-none resize-none"
          />
          <Button onClick={handleRun} disabled={!endpointId} className="w-full gap-2" size="sm">
            <Play className="w-3.5 h-3.5" /> Run {agentName || 'Agent'}
          </Button>
        </>
      )}

      {/* Live Status */}
      {(isRunning || isDone) && (
        <div className="space-y-3">
          {/* Status indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
              {status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {(status === 'FAILED' || status === 'TIMED_OUT') && <XCircle className="w-3.5 h-3.5 text-red-400" />}
              <span className={`text-xs font-medium ${STATUS_COLORS[status] || 'text-muted-foreground'}`}>
                {STATUS_LABELS[status] || status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              {formatTime(elapsed)}
            </div>
          </div>

          {/* Progress bar */}
          {isRunning && (
            <Progress
              value={status === 'IN_PROGRESS' ? 60 : status === 'IN_QUEUE' ? 20 : 10}
              className="h-1.5"
            />
          )}
          {isDone && <Progress value={100} className="h-1.5" />}

          {/* Job ID */}
          {jobId && (
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              Job: {jobId}
            </p>
          )}

          {/* Output */}
          {status === 'COMPLETED' && output && (
            <div className="p-3 rounded-lg border border-foreground/20 bg-background text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto text-foreground">
              {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs text-red-400 font-mono whitespace-pre-wrap">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentRunPanel;
