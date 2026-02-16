import { useState, useEffect } from 'react';

type BotAvatarModule = typeof import('@/data/botAvatars');

let cachedAvatars: string[] | null = null;
let loadPromise: Promise<BotAvatarModule> | null = null;

function loadAvatars(): Promise<BotAvatarModule> {
  if (!loadPromise) {
    loadPromise = import('@/data/botAvatars');
    loadPromise.then((mod) => {
      cachedAvatars = mod.botAvatars;
    });
  }
  return loadPromise;
}

// Kick off loading immediately on module evaluation (but non-blocking)
loadAvatars();

export function useBotAvatars() {
  const [avatars, setAvatars] = useState<string[]>(cachedAvatars || []);

  useEffect(() => {
    if (cachedAvatars) {
      setAvatars(cachedAvatars);
      return;
    }
    loadAvatars().then((mod) => {
      setAvatars(mod.botAvatars);
    });
  }, []);

  return avatars;
}

export function getBotAvatarByIndex(avatars: string[], index: number): string | null {
  if (!avatars.length) return null;
  return avatars[index % avatars.length] || null;
}

export function getFallbackAvatarFromList(avatars: string[], seed: string): string | null {
  if (!avatars.length) return null;
  const hash = Array.from(seed || '🤖').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatars[hash % avatars.length];
}
