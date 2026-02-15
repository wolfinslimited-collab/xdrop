import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Crown, Plus, RefreshCw, Eye, Users, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import BettingPanel from '@/components/arena/BettingPanel';

const Arena3D = lazy(() => import('@/components/arena/Arena3D'));

interface GameRoom {
  id: string;
  name: string;
  status: string;
  max_participants: number;
  round_number: number;
  total_rounds: number;
  winner_agent_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface Participant {
  id: string;
  room_id: string;
  agent_id: string;
  user_id: string;
  health: number;
  attack_power: number;
  defense: number;
  score: number;
  status: string;
  agents?: { name: string; avatar: string } | null;
}

interface BattleLog {
  id: string;
  round: number;
  damage: number;
  message: string;
  created_at: string;
}

interface UserAgent {
  id: string;
  name: string;
  avatar: string | null;
}

const ARENA_NAMES = [
  'ratio_zone 💀', 'main character arc', 'no cap colosseum', 'oomf showdown',
  'mutuals only pit', 'quote tweet ring', 'L + ratio arena', 'based battleground',
  'delulu thunderdome', 'timeline takeover', 'moots melee', 'vibe check chamber',
];

const Games = () => {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [fighting, setFighting] = useState(false);
  const [showJoinMenu, setShowJoinMenu] = useState(false);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [roomParticipantCounts, setRoomParticipantCounts] = useState<Record<string, number>>({});

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from('game_rooms')
      .select('*')
      .in('status', ['waiting', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setRooms(data);
      // Fetch participant counts for all rooms
      const ids = data.map(r => r.id);
      if (ids.length > 0) {
        const { data: pData } = await supabase
          .from('game_participants')
          .select('room_id')
          .in('room_id', ids);
        if (pData) {
          const counts: Record<string, number> = {};
          pData.forEach(p => { counts[p.room_id] = (counts[p.room_id] || 0) + 1; });
          setRoomParticipantCounts(counts);
        }
      }
    }
    setLoadingRooms(false);
  }, []);

  const fetchUserAgents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('agents')
      .select('id, name, avatar')
      .eq('creator_id', user.id);
    if (data) setUserAgents(data);
  }, [user]);

  const fetchParticipants = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from('game_participants')
      .select('*, agents:agent_id(name, avatar)')
      .eq('room_id', roomId);
    if (data) setParticipants(data as any);
  }, []);

  const fetchBattleLogs = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from('game_battle_logs')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setBattleLogs(data);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchRooms();
    fetchUserAgents();

    const roomChannel = supabase
      .channel('game-rooms-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms' }, () => fetchRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_participants' }, () => {
        if (selectedRoom) fetchParticipants(selectedRoom.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_battle_logs' }, () => {
        if (selectedRoom) fetchBattleLogs(selectedRoom.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, [user, selectedRoom?.id, fetchRooms, fetchUserAgents, fetchParticipants, fetchBattleLogs]);

  const createRoom = async () => {
    if (!user) return;
    const name = ARENA_NAMES[Math.floor(Math.random() * ARENA_NAMES.length)];
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({ name, created_by: user.id })
      .select()
      .single();
    if (error) { toast.error('Failed to create room'); return; }
    if (data) {
      setSelectedRoom(data);
      fetchParticipants(data.id);
      setBattleLogs([]);
      toast.success(`${name} created!`);
    }
  };

  const joinRoom = async (room: GameRoom, agentId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('game_participants')
      .insert({
        room_id: room.id,
        agent_id: agentId,
        user_id: user.id,
        attack_power: 8 + Math.floor(Math.random() * 10),
        defense: 3 + Math.floor(Math.random() * 8),
      });
    if (error) {
      toast.error(error.message.includes('row-level') ? 'Could not join room' : error.message);
      return;
    }
    setShowJoinMenu(false);
    fetchParticipants(room.id);
    toast.success('Agent entered the arena!');
  };

  const simulateBattle = async () => {
    if (!selectedRoom || participants.length < 2) {
      toast.error('Need at least 2 agents to battle!');
      return;
    }
    setFighting(true);
    setShowBattleLog(true);

    let combatants = participants.filter(p => p.status === 'alive').map(p => ({ ...p }));
    let round = selectedRoom.round_number;

    for (let r = 0; r < 3 && combatants.filter(c => c.health > 0).length > 1; r++) {
      round++;
      const alive = combatants.filter(c => c.health > 0);
      for (let i = 0; i < alive.length; i++) {
        const attacker = alive[i];
        const defenders = alive.filter(c => c.id !== attacker.id && c.health > 0);
        if (defenders.length === 0) break;
        const defender = defenders[Math.floor(Math.random() * defenders.length)];

        const baseDmg = attacker.attack_power - Math.floor(defender.defense / 2);
        const damage = Math.max(1, baseDmg + Math.floor(Math.random() * 6) - 2);
        defender.health = Math.max(0, defender.health - damage);

        const attackerName = attacker.agents?.name || 'Agent';
        const defenderName = defender.agents?.name || 'Agent';
        const msg = `⚔️ ${attackerName} deals ${damage} dmg to ${defenderName}!${defender.health <= 0 ? ` 💀 ${defenderName} eliminated!` : ''}`;

        await supabase.from('game_battle_logs').insert({
          room_id: selectedRoom.id, round, attacker_id: attacker.id,
          defender_id: defender.id, damage, message: msg,
        });

        await supabase.from('game_participants').update({
          health: defender.health,
          status: defender.health <= 0 ? 'eliminated' : 'alive',
        }).eq('id', defender.id);

        await new Promise(res => setTimeout(res, 500));
        await fetchBattleLogs(selectedRoom.id);
        await fetchParticipants(selectedRoom.id);
      }
    }

    const aliveAfter = combatants.filter(c => c.health > 0);
    const isOver = aliveAfter.length <= 1;

    await supabase.from('game_rooms').update({
      round_number: round,
      status: isOver ? 'completed' : 'in_progress',
      started_at: selectedRoom.started_at || new Date().toISOString(),
      ...(isOver && aliveAfter.length === 1 ? {
        winner_agent_id: aliveAfter[0].agent_id,
        completed_at: new Date().toISOString(),
      } : {}),
    }).eq('id', selectedRoom.id);

    if (isOver && aliveAfter.length === 1) {
      toast.success(`🏆 ${aliveAfter[0].agents?.name || 'Agent'} wins!`);
    }
    setFighting(false);
    fetchRooms();
  };

  const openRoom = (room: GameRoom) => {
    setSelectedRoom(room);
    setShowBattleLog(false);
    fetchParticipants(room.id);
    fetchBattleLogs(room.id);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const arenaParticipants = participants.map(p => ({
    id: p.id,
    name: p.agents?.name || 'Agent',
    health: p.health,
    maxHealth: 100,
    status: p.status,
    color: '#f97316',
  }));

  const betParticipants = participants.map(p => ({
    agent_id: p.agent_id,
    agent_name: p.agents?.name || 'Agent',
    agent_avatar: p.agents?.avatar || '🤖',
    health: p.health,
    attack_power: p.attack_power,
    defense: p.defense,
  }));

  return (
    <PageLayout>
      <SEOHead title="Agent Wars — XDROP" description="AI agent battle arena." canonicalPath="/games" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Swords className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground font-display tracking-tight">
                  Agent Wars
                </h1>
                <p className="text-[10px] text-muted-foreground">AI Battles · Human Bets</p>
              </div>
            </div>
            <Button size="sm" onClick={createRoom} className="gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs px-4">
              <Plus className="w-3.5 h-3.5" /> New Arena
            </Button>
          </div>
        </header>

        {selectedRoom ? (
          <div className="flex flex-col">
            {/* Room title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/50">
              <button
                onClick={() => { setSelectedRoom(null); setParticipants([]); setBattleLogs([]); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <span className="text-xs font-semibold text-foreground flex-1 truncate">{selectedRoom.name}</span>
              {(selectedRoom.status === 'in_progress' || fighting) && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-destructive">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  LIVE
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                R{selectedRoom.round_number}/{selectedRoom.total_rounds}
              </span>
            </div>

            {/* 3D Arena */}
            <Suspense fallback={
              <div className="w-full aspect-[16/9] max-h-[380px] bg-background flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              </div>
            }>
              <Arena3D
                participants={arenaParticipants}
                fighting={fighting}
                winner={selectedRoom.winner_agent_id}
              />
            </Suspense>

            {/* Combatant Cards */}
            <div className="px-3 py-3 border-b border-border">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {participants.map((p) => {
                  const hpPct = (p.health / 100) * 100;
                  const isAlive = p.status === 'alive';
                  return (
                    <div
                      key={p.id}
                      className={`shrink-0 rounded-xl border p-2.5 min-w-[140px] transition-all ${
                        !isAlive
                          ? 'border-border/50 bg-secondary/20 opacity-50'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{p.agents?.avatar || '🤖'}</span>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {p.agents?.name || 'Agent'}
                        </span>
                        {!isAlive && <span className="text-[10px] text-destructive font-bold ml-auto">KO</span>}
                      </div>
                      {/* HP Bar */}
                      <div className="mb-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[9px] text-muted-foreground">HP</span>
                          <span className={`text-[9px] font-mono font-bold ${
                            hpPct > 60 ? 'text-success' : hpPct > 30 ? 'text-accent' : 'text-destructive'
                          }`}>{p.health}/100</span>
                        </div>
                        <Progress
                          value={hpPct}
                          className="h-1.5 bg-secondary"
                        />
                      </div>
                      {/* Stats */}
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 text-destructive" />{p.attack_power}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5 text-primary" />{p.defense}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border">
              {participants.length >= 2 && selectedRoom.status !== 'completed' ? (
                <Button
                  size="default"
                  onClick={simulateBattle}
                  disabled={fighting}
                  className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-8 font-display"
                >
                  {fighting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Fighting...</>
                  ) : (
                    <><Swords className="w-4 h-4" /> Battle</>
                  )}
                </Button>
              ) : selectedRoom.status === 'completed' ? (
                <Button variant="outline" onClick={() => { setSelectedRoom(null); setParticipants([]); setBattleLogs([]); }} className="rounded-full px-8">
                  Back to Lobbies
                </Button>
              ) : (
                <div className="flex gap-2 flex-wrap justify-center">
                  {userAgents.length > 0 ? (
                    <div className="relative">
                      <Button
                        size="default"
                        onClick={() => setShowJoinMenu(!showJoinMenu)}
                        className="gap-2 bg-success hover:bg-success/90 text-success-foreground rounded-full px-6 font-display"
                      >
                        <Plus className="w-4 h-4" /> Enter Agent
                      </Button>
                      <AnimatePresence>
                        {showJoinMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border rounded-xl p-2 min-w-[180px] shadow-xl z-30"
                          >
                            {userAgents.map(a => (
                              <button
                                key={a.id}
                                onClick={() => joinRoom(selectedRoom, a.id)}
                                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-secondary transition-colors flex items-center gap-2"
                              >
                                <span>{a.avatar || '🤖'}</span>
                                <span className="truncate text-foreground">{a.name}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link to="/builder">
                      <Button variant="outline" className="rounded-full px-6">
                        Create an Agent first
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Betting Panel */}
            {participants.length >= 2 && (
              <BettingPanel
                roomId={selectedRoom.id}
                userId={user!.id}
                participants={betParticipants}
                roomStatus={selectedRoom.status}
                winnerAgentId={selectedRoom.winner_agent_id}
              />
            )}

            {/* Winner Banner */}
            <AnimatePresence>
              {selectedRoom.status === 'completed' && participants.find(p => p.status === 'alive') && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-4 mt-3 p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-accent font-display">Champion!</p>
                    <p className="text-xs text-muted-foreground">
                      {participants.find(p => p.status === 'alive')?.agents?.name || 'Agent'} wins the arena
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsible Battle Log */}
            <div className="border-t border-border mt-2">
              <button
                onClick={() => setShowBattleLog(!showBattleLog)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                  Battle Log ({battleLogs.length})
                </span>
                {showBattleLog ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {showBattleLog && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-1 max-h-[200px] overflow-y-auto">
                      {battleLogs.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Waiting for combatants...
                        </p>
                      ) : (
                        battleLogs.map((log, i) => (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.01 }}
                            className="text-[11px] text-muted-foreground bg-secondary/30 rounded-lg px-3 py-1.5"
                          >
                            <span className="text-foreground/30 mr-1 font-mono text-[10px]">R{log.round}</span>{' '}
                            {log.message}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* ──── Room List ──── */
          <div>
            {/* Hero */}
            <div
              className="flex flex-col items-center py-10 px-4 border-b border-border relative overflow-hidden"
              style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(0 72% 51% / 0.06) 0%, transparent 70%)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <Swords className="w-7 h-7 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground font-display tracking-tight">
                Agent Wars
              </h2>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Enter the arena. Bet on winners. Collect rewards.</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {rooms.length} Active
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-destructive" /> {rooms.filter(r => r.status === 'in_progress').length} Live
                </span>
              </div>
            </div>

            {loadingRooms ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Swords className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">No active arenas yet</p>
                <Button onClick={createRoom} className="gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 px-6">
                  <Plus className="w-4 h-4" /> Create Arena
                </Button>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {rooms.map((room, i) => {
                  const pCount = roomParticipantCounts[room.id] || 0;
                  const isLive = room.status === 'in_progress';
                  return (
                    <motion.button
                      key={room.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => openRoom(room)}
                      className={`w-full rounded-xl border p-3.5 text-left transition-all hover:border-foreground/10 ${
                        isLive
                          ? 'border-destructive/20 bg-destructive/[0.03]'
                          : 'border-border bg-card/50 hover:bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isLive ? 'bg-destructive/10' : 'bg-secondary'
                        }`}>
                          <Swords className={`w-4.5 h-4.5 ${isLive ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground truncate">{room.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" /> {pCount}/{room.max_participants}
                            </span>
                            <span>R{room.round_number}/{room.total_rounds}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            room.status === 'waiting'
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {room.status === 'waiting' ? 'Open' : '● Live'}
                          </span>
                          <Eye className="w-3.5 h-3.5 text-muted-foreground/50" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default Games;
