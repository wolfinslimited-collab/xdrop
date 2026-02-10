import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BetParticipant {
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  health: number;
  attack_power: number;
  defense: number;
}

interface ExistingBet {
  id: string;
  agent_id: string;
  amount: number;
  status: string;
  payout: number;
}

interface BettingPanelProps {
  roomId: string;
  userId: string;
  participants: BetParticipant[];
  roomStatus: string;
  winnerAgentId?: string | null;
}

const BET_AMOUNTS = [1, 5, 10, 25, 50];

const BettingPanel = ({ roomId, userId, participants, roomStatus, winnerAgentId }: BettingPanelProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(5);
  const [placing, setPlacing] = useState(false);
  const [userBets, setUserBets] = useState<ExistingBet[]>([]);
  const [allBets, setAllBets] = useState<{ agent_id: string; total: number; count: number }[]>([]);

  useEffect(() => {
    fetchBets();

    const channel = supabase
      .channel(`bets-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_bets', filter: `room_id=eq.${roomId}` }, () => {
        fetchBets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const fetchBets = async () => {
    const { data } = await supabase
      .from('game_bets')
      .select('*')
      .eq('room_id', roomId);
    
    if (data) {
      setUserBets(data.filter(b => b.user_id === userId));
      
      // Aggregate bets per agent
      const agg: Record<string, { total: number; count: number }> = {};
      data.forEach(b => {
        if (!agg[b.agent_id]) agg[b.agent_id] = { total: 0, count: 0 };
        agg[b.agent_id].total += Number(b.amount);
        agg[b.agent_id].count++;
      });
      setAllBets(Object.entries(agg).map(([agent_id, v]) => ({ agent_id, ...v })));
    }
  };

  const placeBet = async () => {
    if (!selectedAgent || betAmount <= 0) return;
    setPlacing(true);
    
    const { error } = await supabase.from('game_bets').insert({
      room_id: roomId,
      user_id: userId,
      agent_id: selectedAgent,
      amount: betAmount,
    });

    if (error) {
      toast.error('Failed to place bet');
    } else {
      toast.success(`Bet $${betAmount} USDC placed!`);
      setSelectedAgent(null);
    }
    setPlacing(false);
  };

  const hasBet = userBets.length > 0;
  const canBet = roomStatus === 'waiting' && !hasBet;
  const isCompleted = roomStatus === 'completed';

  const userWon = isCompleted && userBets.some(b => b.agent_id === winnerAgentId);

  return (
    <div className="border-b border-border">
      {/* Betting Header */}
      <div className="px-4 py-3 flex items-center gap-2 bg-accent/5 border-b border-border">
        <DollarSign className="w-4 h-4 text-accent" />
        <span className="text-xs font-bold text-accent tracking-wider uppercase">
          {isCompleted ? 'Bet Results' : canBet ? 'Place Your Bet' : 'Bets Locked'}
        </span>
        {allBets.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            Pool: ${allBets.reduce((s, b) => s + b.total, 0).toFixed(2)} USDC
          </span>
        )}
      </div>

      {/* Result Banner */}
      <AnimatePresence>
        {isCompleted && hasBet && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={`px-4 py-3 ${userWon ? 'bg-success/10' : 'bg-destructive/10'}`}
          >
            <div className="flex items-center gap-2">
              <Trophy className={`w-5 h-5 ${userWon ? 'text-success' : 'text-destructive'}`} />
              <span className={`text-sm font-bold ${userWon ? 'text-success' : 'text-destructive'}`}>
                {userWon ? 'You Won! 🎉' : 'Better luck next time'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Selection for Betting */}
      {canBet && (
        <div className="px-4 py-3 space-y-3">
          <p className="text-[10px] text-muted-foreground">Pick the agent you think will win:</p>
          <div className="grid grid-cols-2 gap-2">
            {participants.map(p => {
              const agentBets = allBets.find(b => b.agent_id === p.agent_id);
              return (
                <button
                  key={p.agent_id}
                  onClick={() => setSelectedAgent(p.agent_id)}
                  className={`relative rounded-xl border p-3 text-left transition-all ${
                    selectedAgent === p.agent_id
                      ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                      : 'border-border bg-card hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{p.agent_avatar || '🤖'}</span>
                    <span className="text-xs font-semibold text-foreground truncate">{p.agent_name}</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span>⚔️ {p.attack_power}</span>
                    <span>🛡 {p.defense}</span>
                  </div>
                  {agentBets && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-accent">
                      <TrendingUp className="w-3 h-3" />
                      ${agentBets.total} ({agentBets.count} bet{agentBets.count > 1 ? 's' : ''})
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Amount Selection */}
          <AnimatePresence>
            {selectedAgent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                <p className="text-[10px] text-muted-foreground">Bet amount (USDC):</p>
                <div className="flex gap-2 flex-wrap">
                  {BET_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        betAmount === amt
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={placeBet}
                  disabled={placing}
                  className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full mt-2"
                >
                  {placing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Placing...</>
                  ) : (
                    <><DollarSign className="w-4 h-4" /> Bet ${betAmount} on {participants.find(p => p.agent_id === selectedAgent)?.agent_name}</>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Existing User Bet */}
      {hasBet && !isCompleted && (
        <div className="px-4 py-3">
          {userBets.map(bet => {
            const agent = participants.find(p => p.agent_id === bet.agent_id);
            return (
              <div key={bet.id} className="flex items-center gap-3 bg-accent/5 rounded-xl p-3 border border-accent/20">
                <span className="text-lg">{agent?.agent_avatar || '🤖'}</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">Your bet: {agent?.agent_name}</p>
                  <p className="text-[10px] text-accent font-mono">${Number(bet.amount).toFixed(2)} USDC</p>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{bet.status}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Odds Overview */}
      {allBets.length > 0 && !canBet && !isCompleted && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          {allBets.map(ab => {
            const agent = participants.find(p => p.agent_id === ab.agent_id);
            return (
              <div key={ab.agent_id} className="shrink-0 bg-secondary/50 rounded-lg px-3 py-1.5 text-[10px]">
                <span className="text-foreground font-medium">{agent?.agent_name}</span>
                <span className="text-accent ml-1">${ab.total}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BettingPanel;
