import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Crown, Users, Plus, RefreshCw, Eye } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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

const CrossedSwords = () => (
  <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
    <rect x="2" y="1" width="2" height="2" fill="#4ade80" />
    <rect x="4" y="3" width="2" height="2" fill="#4ade80" />
    <rect x="6" y="5" width="2" height="2" fill="#4ade80" />
    <rect x="12" y="1" width="2" height="2" fill="#4ade80" />
    <rect x="10" y="3" width="2" height="2" fill="#4ade80" />
    <rect x="8" y="5" width="2" height="2" fill="#4ade80" />
    <rect x="6" y="7" width="4" height="2" fill="#facc15" />
    <rect x="5" y="8" width="6" height="1" fill="#facc15" />
    <rect x="4" y="9" width="2" height="3" fill="#a16207" />
    <rect x="10" y="9" width="2" height="3" fill="#a16207" />
  </svg>
);

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

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from('game_rooms')
      .select('*')
      .in('status', ['waiting', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRooms(data);
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
    fetchParticipants(room.id);
    fetchBattleLogs(room.id);
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  // Map participants for 3D arena
  const arenaParticipants = participants.map(p => ({
    id: p.id,
    name: p.agents?.name || 'Agent',
    health: p.health,
    maxHealth: 100,
    status: p.status,
    color: '#f97316',
  }));

  // Map for betting panel
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
              <CrossedSwords />
              <div>
                <h1 className="text-lg font-bold text-foreground font-display">
                  Agent <span className="text-green-400">Wars</span>
                </h1>
                <p className="text-[10px] text-muted-foreground">AI Battles, Human Bets</p>
              </div>
            </div>
            <Button size="sm" onClick={createRoom} className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <Plus className="w-4 h-4" /> New Arena
            </Button>
          </div>
        </header>

        {selectedRoom ? (
          <div className="flex flex-col">
            {/* 3D Arena */}
            <Suspense fallback={
              <div className="w-full aspect-[4/3] max-h-[420px] bg-background flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <Arena3D
                participants={arenaParticipants}
                fighting={fighting}
                winner={selectedRoom.winner_agent_id}
              />
            </Suspense>

            {/* LIVE Badge overlay */}
            {(selectedRoom.status === 'in_progress' || fighting) && (
              <div className="flex justify-center -mt-10 relative z-10 mb-2">
                <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-4 py-1 rounded-full tracking-wider shadow-lg">
                  🔴 LIVE
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-center gap-3 px-4 py-4 border-b border-border">
              {participants.length >= 2 && selectedRoom.status !== 'completed' ? (
                <Button
                  size="lg"
                  onClick={simulateBattle}
                  disabled={fighting}
                  className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-8"
                >
                  {fighting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Fighting...</>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" /> Watch Battle Live</>
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
                        size="lg"
                        onClick={() => setShowJoinMenu(!showJoinMenu)}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-foreground rounded-full px-8"
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
                  <Button variant="ghost" onClick={() => { setSelectedRoom(null); setParticipants([]); setBattleLogs([]); }} className="rounded-full">
                    Back
                  </Button>
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-4 mt-3 p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-center gap-3"
                >
                  <Crown className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-lg font-bold text-accent font-display">Champion!</p>
                    <p className="text-sm text-foreground">
                      {participants.find(p => p.status === 'alive')?.agents?.name || 'Agent'} wins the arena!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-0 border-b border-border">
              {participants.map((p, i) => (
                <div key={p.id} className={`text-center py-2 px-2 ${i > 0 ? 'border-l border-border' : ''}`}>
                  <span className="text-xs font-semibold text-foreground truncate block">{p.agents?.name || 'Agent'}</span>
                  <div className="flex items-center justify-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Swords className="w-3 h-3 text-destructive" />{p.attack_power}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Shield className="w-3 h-3 text-primary" />{p.defense}
                    </span>
                    <span className={`text-[10px] font-bold ${p.health > 50 ? 'text-green-500' : p.health > 0 ? 'text-accent' : 'text-destructive'}`}>
                      {p.health}HP
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Battle Log */}
            <div className="px-4 py-3">
              <h3 className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-2">BATTLE LOG</h3>
              <div className="space-y-1 max-h-[250px] overflow-y-auto">
                {battleLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Waiting for combatants...
                  </p>
                ) : (
                  battleLogs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-foreground/40 mr-1">R{log.round}</span> {log.message}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Room List */
          <div>
            {/* Hero */}
            <div className="flex flex-col items-center py-8 px-4 border-b border-border"
              style={{ background: 'radial-gradient(ellipse at center, hsl(0 0% 8%) 0%, hsl(0 0% 4%) 100%)' }}
            >
              <CrossedSwords />
              <h2 className="text-xl font-bold text-foreground font-display mt-3">
                Agent <span className="text-green-400">Wars</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">AI Battles, Human Bets</p>
            </div>

            {loadingRooms ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No active arenas. Create one to start battling!</p>
                <Button onClick={createRoom} className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-6">
                  <Plus className="w-4 h-4" /> Create Arena
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {rooms.map((room, i) => (
                  <motion.button
                    key={room.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => openRoom(room)}
                    className="w-full px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'radial-gradient(circle, hsl(0 0% 14%), hsl(0 0% 7%))' }}
                      >
                        <Swords className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{room.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            room.status === 'waiting' ? 'bg-green-500/10 text-green-400' :
                            room.status === 'in_progress' ? 'bg-destructive/10 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {room.status === 'waiting' ? 'Open' : room.status === 'in_progress' ? '🔴 Live' : 'Done'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Round {room.round_number}/{room.total_rounds}
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default Games;
