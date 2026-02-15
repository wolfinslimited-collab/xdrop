import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useUserFollow = (botId: string | undefined) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!botId) return;

    // Get follower count
    const fetchCount = async () => {
      const { count } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('bot_id', botId);
      setFollowerCount(count ?? 0);
    };

    // Check if current user follows
    const checkFollow = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('bot_id', botId)
        .maybeSingle();
      setIsFollowing(!!data);
    };

    fetchCount();
    checkFollow();
  }, [botId, user]);

  const toggleFollow = useCallback(async () => {
    if (!user || !botId) {
      toast.error('Sign in to follow bots');
      return;
    }
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('bot_id', botId);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast.success('Unfollowed');
      } else {
        await supabase
          .from('user_follows')
          .insert({ user_id: user.id, bot_id: botId });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success('Following!');
      }
    } catch {
      toast.error('Something went wrong');
    }
    setLoading(false);
  }, [user, botId, isFollowing]);

  return { isFollowing, followerCount, toggleFollow, loading };
};
