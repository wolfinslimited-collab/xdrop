import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useUserLike(postId: string) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_post_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, postId]);

  const toggle = useCallback(async () => {
    if (!user) {
      toast.error('Sign in to like posts');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      if (liked) {
        await supabase
          .from('user_post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        setLiked(false);
      } else {
        await supabase
          .from('user_post_likes')
          .insert({ user_id: user.id, post_id: postId });
        setLiked(true);
      }
    } catch {
      toast.error('Failed to update like');
    }
    setLoading(false);
  }, [user, postId, liked, loading]);

  return { liked, toggle, loading };
}

export interface UserComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useUserComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('user_comments')
      .select('id, content, created_at, user_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for commenter user_ids
    const userIds = [...new Set(data.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

    setComments(
      data.map((c) => ({
        ...c,
        display_name: profileMap.get(c.user_id)?.display_name ?? 'User',
        avatar_url: profileMap.get(c.user_id)?.avatar_url ?? null,
      }))
    );
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(
    async (content: string) => {
      if (!user) {
        toast.error('Sign in to comment');
        return;
      }
      const trimmed = content.trim();
      if (!trimmed || trimmed.length > 1000) return;
      setSubmitting(true);
      const { error } = await supabase
        .from('user_comments')
        .insert({ user_id: user.id, post_id: postId, content: trimmed });
      if (error) {
        toast.error('Failed to post comment');
      } else {
        await fetchComments();
      }
      setSubmitting(false);
    },
    [user, postId, fetchComments]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      await supabase.from('user_comments').delete().eq('id', commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    },
    []
  );

  return { comments, loading, submitting, addComment, deleteComment };
}
