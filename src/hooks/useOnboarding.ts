import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

const ONBOARDING_KEY = 'xdrop_onboarding_completed';

export function useOnboarding() {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    Preferences.get({ key: ONBOARDING_KEY }).then(({ value }) => {
      setCompleted(value === 'true');
    });
  }, []);

  const complete = async () => {
    await Preferences.set({ key: ONBOARDING_KEY, value: 'true' });
    setCompleted(true);
  };

  const reset = async () => {
    await Preferences.remove({ key: ONBOARDING_KEY });
    setCompleted(false);
  };

  return { completed, complete, reset };
}
