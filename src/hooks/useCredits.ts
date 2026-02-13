import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CreditTransaction {
  id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string | null;
  created_at: string;
}

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) { setCredits(null); setLoading(false); return; }
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
    setCredits(data?.credits ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const deductCredits = useCallback(async (amount: number, type: string, description?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const { data, error } = await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: amount,
      p_type: type,
      p_description: description ?? null,
    });
    if (error) return { success: false, error: error.message };
    const result = data as unknown as { success: boolean; error?: string; credits?: number };
    if (result.success) {
      setCredits(result.credits ?? 0);
    }
    return result;
  }, [user]);

  const addCredits = useCallback(async (amount: number, type: string, description?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    const { data, error } = await supabase.rpc('add_credits', {
      p_user_id: user.id,
      p_amount: amount,
      p_type: type,
      p_description: description ?? null,
    });
    if (error) return { success: false, error: error.message };
    const result = data as unknown as { success: boolean; error?: string; credits?: number };
    if (result.success) {
      setCredits(result.credits ?? 0);
    }
    return result;
  }, [user]);

  return { credits, loading, deductCredits, addCredits, refetch: fetchCredits };
}

// Credit costs
export const CREDIT_COSTS = {
  CHAT_MESSAGE: 1,
  AGENT_CREATION: 10,
  VOICE_MESSAGE: 3,
} as const;
