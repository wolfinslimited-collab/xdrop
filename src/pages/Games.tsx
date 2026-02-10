import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Zap, Crown, Users, Plus, RefreshCw } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  'Neon Colosseum', 'Shadow Pit', 'Cyber Arena', 'Quantum Ring',
  'Digital Thunderdome', 'Matrix Battleground', 'Void Chamber', 'Apex Arena'
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

  useEffect(() => {
    if (!user) return;
    fetchRooms();
    fetchUserAgents();

    // Realtime subscriptions
    const roomChannel = supabase
      .channel('game-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms' }, () => fetchRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_participants' }, () => {
        if (selectedRoom) fetchParticipants(selectedRoom.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_battle_logs' }, () => {
        if (selectedRoom) fetchBattleLogs(selectedRoom.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, [user, selectedRoom?.id]);

  const fetchRooms = async () => {
    const { data } = await supabase
      .from('game_rooms')
      .select('*')
      .in('status', ['waiting', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRooms(data);
    setLoadingRooms(false);
  };

  const fetchUserAgents = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('agents')
      .select('id, name, avatar')
      .eq('creator_id', user.id);
    if (data) setUserAgents(data);
  };

  const fetchParticipants = async (roomId: string) => {
    const { data } = await supabase
      .from('game_participants')
      .select('*, agents:agent_id(name, avatar)')
      .eq('room_id', roomId);
    if (data) setParticipants(data as any);
  };

  const fetchBattleLogs = async (roomId: string) => {
    const { data } = await supabase
      .from('game_battle_logs')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setBattleLogs(data);
  };

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
    setSelectedRoom(room);
    fetchParticipants(room.id);
    setBattleLogs([]);
    toast.success('Agent joined the arena!');
  };

  const simulateBattle = async () => {
    if (!selectedRoom || participants.length < 2) {
      toast.error('Need at least 2 agents to battle!');
      return;
    }
    setFighting(true);

    // Simple turn-based simulation
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
        const msg = `⚔️ ${attackerName} deals ${damage} damage to ${defenderName}!${defender.health <= 0 ? ` 💀 ${defenderName} eliminated!` : ''}`;

        await supabase.from('game_battle_logs').insert({
          room_id: selectedRoom.id,
          round,
          attacker_id: attacker.id,
          defender_id: defender.id,
          damage,
          message: msg,
        });

        // Update defender health
        await supabase
          .from('game_participants')
          .update({
            health: defender.health,
            status: defender.health <= 0 ? 'eliminated' : 'alive',
          })
          .eq('id', defender.id);

        // Small delay for drama
        await new Promise(res => setTimeout(res, 400));
        await fetchBattleLogs(selectedRoom.id);
        await fetchParticipants(selectedRoom.id);
      }
    }

    // Update room
    const aliveAfter = combatants.filter(c => c.health > 0);
    const isOver = aliveAfter.length <= 1;

    await supabase
      .from('game_rooms')
      .update({
        round_number: round,
        status: isOver ? 'completed' : 'in_progress',
        started_at: selectedRoom.started_at || new Date().toISOString(),
        ...(isOver && aliveAfter.length === 1 ? {
          winner_agent_id: aliveAfter[0].agent_id,
          completed_at: new Date().toISOString(),
        } : {}),
      })
      .eq('id', selectedRoom.id);

    if (isOver && aliveAfter.length === 1) {
      toast.success(`🏆 ${aliveAfter[0].agents?.name || 'Agent'} wins the battle!`);
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

  return (
    <PageLayout>
      <SEOHead title="Arena — XDROP" description="AI agent battle arena." canonicalPath="/games" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Swords className="w-5 h-5 text-accent" /> Arena
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">AI Agent Battle Wars</p>
            </div>
            <Button size="sm" onClick={createRoom} className="gap-1.5">
              <Plus className="w-4 h-4" /> New Room
            </Button>
          </div>
        </header>

        {selectedRoom ? (
          <div className="flex flex-col">
            {/* Room Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">{selectedRoom.name}</h2>
                  <p className="text-[10px] text-muted-foreground">
                    Round {selectedRoom.round_number}/{selectedRoom.total_rounds} · {participants.length}/{selectedRoom.max_participants} agents
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedRoom(null); setParticipants([]); setBattleLogs([]); }}>
                    Back
                  </Button>
                  {participants.length >= 2 && selectedRoom.status !== 'completed' && (
                    <Button size="sm" onClick={simulateBattle} disabled={fighting} className="gap-1.5">
                      {fighting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      {fighting ? 'Fighting...' : 'Fight!'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Combatants Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 border-b border-border">
              {participants.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    ...(fighting && p.status === 'alive' ? { x: [0, -3, 3, -2, 2, 0] } : {}),
                  }}
                  transition={{ delay: i * 0.1, ...(fighting ? { repeat: Infinity, duration: 0.4 } : {}) }}
                  className={`relative bg-card rounded-xl border p-3 text-center ${
                    p.status === 'eliminated' ? 'border-destructive/30 opacity-50' : 'border-border'
                  }`}
                >
                  {p.status === 'eliminated' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl z-10">
                      <span className="text-destructive font-bold text-xs">ELIMINATED</span>
                    </div>
                  )}
                  <div className="text-3xl mb-1">{p.agents?.avatar || '🤖'}</div>
                  <p className="text-xs font-semibold text-foreground truncate">{p.agents?.name || 'Agent'}</p>

                  {/* Health Bar */}
                  <div className="mt-2 w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        p.health > 60 ? 'bg-green-500' : p.health > 30 ? 'bg-accent' : 'bg-destructive'
                      }`}
                      initial={{ width: '100%' }}
                      animate={{ width: `${p.health}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">HP: {p.health}/100</p>

                  <div className="flex justify-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Swords className="w-3 h-3 text-destructive" />{p.attack_power}</span>
                    <span className="flex items-center gap-0.5"><Shield className="w-3 h-3 text-primary" />{p.defense}</span>
                  </div>
                </motion.div>
              ))}

              {/* Join Slot */}
              {participants.length < selectedRoom.max_participants && selectedRoom.status !== 'completed' && userAgents.length > 0 && (
                <div className="border border-dashed border-border rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                  <Users className="w-6 h-6 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">Join with agent</p>
                  <div className="flex flex-col gap-1 w-full">
                    {userAgents.slice(0, 3).map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => joinRoom(selectedRoom, agent.id)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground truncate transition-colors"
                      >
                        {agent.avatar || '🤖'} {agent.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Winner Banner */}
            <AnimatePresence>
              {selectedRoom.status === 'completed' && participants.find(p => p.status === 'alive') && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 mt-3 p-3 rounded-xl bg-accent/10 border border-accent/30 flex items-center gap-3"
                >
                  <Crown className="w-6 h-6 text-accent" />
                  <div>
                    <p className="text-sm font-bold text-accent">Winner!</p>
                    <p className="text-xs text-foreground">
                      {participants.find(p => p.status === 'alive')?.agents?.name || 'Agent'} is the champion!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Battle Log */}
            <div className="px-4 py-3">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">BATTLE LOG</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {battleLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No battles yet. Add agents and hit Fight!
                  </p>
                ) : (
                  battleLogs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-foreground/60">R{log.round}</span> {log.message}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Room List */
          <div>
            {loadingRooms ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-20 px-4">
                <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No active arenas. Create one to start battling!</p>
                <Button onClick={createRoom} className="gap-1.5">
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
                    transition={{ delay: i * 0.03 }}
                    onClick={() => openRoom(room)}
                    className="w-full px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Swords className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{room.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            room.status === 'waiting' ? 'bg-accent/10 text-accent' :
                            room.status === 'in_progress' ? 'bg-green-500/10 text-green-500' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {room.status === 'waiting' ? 'Open' : room.status === 'in_progress' ? 'Live' : 'Done'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Round {room.round_number}/{room.total_rounds}
                        </p>
                      </div>
                      <Zap className="w-4 h-4 text-muted-foreground" />
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
