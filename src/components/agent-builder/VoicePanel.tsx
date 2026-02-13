import { useState, useRef } from 'react';
import { Volume2, Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { AgentConfig } from '@/types/agentBuilder';

const VOICE_OPTIONS = [
  { id: 'roger', name: 'Roger', desc: 'Deep, authoritative male' },
  { id: 'sarah', name: 'Sarah', desc: 'Warm, friendly female' },
  { id: 'charlie', name: 'Charlie', desc: 'Casual, young male' },
  { id: 'alice', name: 'Alice', desc: 'Clear, professional female' },
  { id: 'brian', name: 'Brian', desc: 'Confident narrator' },
  { id: 'lily', name: 'Lily', desc: 'Soft, gentle female' },
  { id: 'eric', name: 'Eric', desc: 'Energetic male' },
  { id: 'jessica', name: 'Jessica', desc: 'Articulate, precise female' },
  { id: 'daniel', name: 'Daniel', desc: 'Calm, measured male' },
  { id: 'chris', name: 'Chris', desc: 'Upbeat, dynamic male' },
  { id: 'matilda', name: 'Matilda', desc: 'Elegant, refined female' },
  { id: 'river', name: 'River', desc: 'Neutral, versatile' },
  { id: 'george', name: 'George', desc: 'Warm British male' },
  { id: 'callum', name: 'Callum', desc: 'Friendly Scottish male' },
  { id: 'liam', name: 'Liam', desc: 'Smooth, youthful male' },
];

interface VoicePanelProps {
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
}

const VoicePanel = ({ config, onConfigChange }: VoicePanelProps) => {
  const [previewing, setPreviewing] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voiceEnabled = (config as any).voiceEnabled ?? false;
  const selectedVoice = (config as any).voiceId ?? '';

  const handleToggle = (enabled: boolean) => {
    onConfigChange({ ...config, voiceEnabled: enabled } as any);
  };

  const handleSelectVoice = (voiceId: string) => {
    onConfigChange({ ...config, voiceId: voiceId, voiceEnabled: true } as any);
  };

  const handlePreview = async (voiceId: string) => {
    if (previewing === voiceId) {
      audioRef.current?.pause();
      setPreviewing(null);
      return;
    }

    setPreviewing(voiceId);
    try {
      const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-voice?action=preview&voice=${voiceId}&text=${encodeURIComponent(`Hi, I'm ${voice?.name}. This is how your bot will sound!`)}`;
      
      const resp = await fetch(url, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!resp.ok) throw new Error('Preview failed');

      const blob = await resp.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPreviewing(null);
      await audio.play();
    } catch {
      toast.error('Failed to preview voice');
      setPreviewing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Bot Voice</h3>
        </div>
        <Switch checked={voiceEnabled} onCheckedChange={handleToggle} />
      </div>

      <p className="text-xs text-muted-foreground">
        Give your bot a unique voice. Voice tweets cost 3 credits each.
      </p>

      <div className="grid gap-1.5">
        {VOICE_OPTIONS.map(voice => (
          <button
            key={voice.id}
            onClick={() => handleSelectVoice(voice.id)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all text-xs ${
              selectedVoice === voice.id
                ? 'bg-primary/10 border border-primary/30 text-foreground'
                : 'bg-secondary/30 border border-transparent hover:bg-secondary/60 text-muted-foreground'
            }`}
          >
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground">{voice.name}</span>
              <span className="text-muted-foreground ml-2">{voice.desc}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={(e) => { e.stopPropagation(); handlePreview(voice.id); }}
            >
              {previewing === voice.id ? (
                <Square className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </Button>
          </button>
        ))}
      </div>

      {selectedVoice && (
        <div className="bg-secondary/30 rounded-lg p-3 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">API Usage</p>
          <code className="text-xs text-foreground block">
            POST /bot-voice<br />
            {`{ "text": "Hello world", "post_as_tweet": true }`}
          </code>
        </div>
      )}
    </div>
  );
};

export default VoicePanel;
