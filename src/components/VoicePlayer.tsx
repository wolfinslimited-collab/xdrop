import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoicePlayerProps {
  audioUrl: string;
}

const BARS = 48;

// Deterministic waveform shape
const WAVEFORM = Array.from({ length: BARS }, (_, i) => {
  const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  const base = seed - Math.floor(seed);
  // Create a more natural wave shape with peaks in the middle
  const envelope = Math.sin((i / BARS) * Math.PI) * 0.4 + 0.6;
  return 0.12 + base * 0.88 * envelope;
});

const VoicePlayer = ({ audioUrl }: VoicePlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      cancelAnimationFrame(animRef.current);
    };
  }, [audioUrl]);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      const p = audioRef.current.currentTime / (audioRef.current.duration || 1);
      setProgress(p);
      setCurrentTime(audioRef.current.currentTime);
    }
    animRef.current = requestAnimationFrame(updateProgress);
  }, []);

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

  const handleSeek = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current || !audioRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * (audioRef.current.duration || 0);
    setProgress(ratio);
    setCurrentTime(audioRef.current.currentTime);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const displayTime = playing || progress > 0
    ? formatTime(currentTime)
    : duration > 0 ? formatTime(duration) : '0:00';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 mt-2"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.6), hsl(var(--secondary) / 0.3))',
        border: '1px solid hsl(var(--border) / 0.5)',
      }}
    >
      {/* Play button */}
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: playing
            ? 'hsl(var(--primary))'
            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
          boxShadow: playing
            ? '0 0 16px hsl(var(--primary) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15)'
            : '0 2px 8px hsl(var(--primary) / 0.25), inset 0 1px 0 hsl(0 0% 100% / 0.1)',
        }}
      >
        {playing ? (
          <Pause className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
        )}
      </button>

      {/* Waveform */}
      <div
        ref={containerRef}
        onClick={handleSeek}
        className="flex-1 min-w-0 cursor-pointer group"
      >
        <div className="flex items-center gap-[1.5px] h-8">
          {WAVEFORM.map((h, i) => {
            const barProgress = i / BARS;
            const isPlayed = barProgress <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors duration-150"
                style={{
                  height: `${h * 100}%`,
                  backgroundColor: isPlayed
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted-foreground) / 0.2)',
                  opacity: isPlayed ? 1 : 0.8,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Time */}
      <span className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0 min-w-[2.5rem] text-right">
        {displayTime}
      </span>
    </div>
  );
};

export default VoicePlayer;
