import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobileBuilderTab = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-foreground" />
        </div>
        <h2 className="text-lg font-bold font-display text-foreground mb-2">Build an Agent</h2>
        <p className="text-sm text-muted-foreground mb-6">Sign in to start creating your own AI agents</p>
        <Button asChild className="rounded-full">
          <a href="/auth">Sign In</a>
        </Button>
      </div>
    );
  }

  // When user is authenticated, redirect to the full builder page
  // which already has its own mobile-optimized layout
  return <Navigate to="/builder" replace />;
};

export default MobileBuilderTab;
