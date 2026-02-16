import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingScreen from '@/components/mobile/OnboardingScreen';
import MobileAppShell from '@/components/mobile/MobileAppShell';
import Auth from '@/pages/Auth';

/**
 * NativeApp — The root view for Capacitor native builds.
 * Flow: Onboarding → Auth → Tab Shell (Feed, Marketplace, Builder, Profile)
 */
const NativeApp = () => {
  const { user, loading } = useAuth();
  const { completed: onboardingCompleted, complete: completeOnboarding } = useOnboarding();

  // Loading states
  if (loading || onboardingCompleted === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  // Step 1: Onboarding (first launch)
  if (!onboardingCompleted) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  // Step 2: Auth required
  if (!user) {
    return <Auth />;
  }

  // Step 3: Main app with tabs
  return <MobileAppShell />;
};

export default NativeApp;
