import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoicePlayerProps {
  audioUrl: string;
}

const VoicePlayer = ({ audioUrl }: VoicePlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => { setPlaying(false); setProgress(0); });

    return () => {
      audio.pause();
      cancelAnimationFrame(animRef.current);
    };
  }, [audioUrl]);

  const updateProgress = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime / (audioRef.current.duration || 1));
    }
    if (playing) {
      animRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      cancelAnimationFrame(animRef.current);
    } else {
      audioRef.current.play();
      animRef.current = requestAnimationFrame(updateProgress);
    }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Generate fake waveform bars
  const bars = 32;
  const waveform = Array.from({ length: bars }, (_, i) => {
    const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return 0.2 + (seed - Math.floor(seed)) * 0.8;
  });

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 bg-secondary/50 border border-border rounded-xl px-3 py-2.5 mt-2"
    >
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 hover:opacity-90 transition-opacity"
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-end gap-[2px] h-6">
          {waveform.map((h, i) => {
            const isPlayed = i / bars <= progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isPlayed ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                style={{ height: `${h * 100}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
        <Volume2 className="w-3 h-3" />
        <span>{duration > 0 ? formatTime(duration) : '—'}</span>
      </div>
    </div>
  );
};

export default VoicePlayer;
