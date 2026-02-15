import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface ArenaParticipant {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  status: string;
  color: string;
}

interface Arena3DProps {
  participants: ArenaParticipant[];
  fighting: boolean;
  winner?: string | null;
}

const COLORS = ['#f97316', '#a855f7', '#3b82f6', '#22c55e', '#ec4899', '#eab308'];

/* ── Arena Floor ── */
const ArenaFloor = ({ fighting }: { fighting: boolean }) => {
  const ringRef = useRef<any>(null);
  const pulseRef = useRef<any>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) ringRef.current.rotation.z = t * 0.1;
    if (pulseRef.current) {
      const s = fighting ? 1 + Math.sin(t * 3) * 0.08 : 1;
      pulseRef.current.scale.set(s, s, 1);
      (pulseRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        fighting ? 0.6 + Math.sin(t * 4) * 0.3 : 0.4;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <cylinderGeometry args={[5.5, 5.5, 0.1, 64]} />
        <meshStandardMaterial color="#111" roughness={0.9} metalness={0.15} />
      </mesh>
      {/* Glowing ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[4.9, 5.3, 64]} />
        <meshStandardMaterial
          ref={pulseRef}
          color={fighting ? '#ef4444' : '#22c55e'}
          emissive={fighting ? '#ef4444' : '#22c55e'}
          emissiveIntensity={0.4}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[2.8, 2.9, 64]} />
        <meshStandardMaterial color="#222" transparent opacity={0.3} />
      </mesh>
      <gridHelper args={[11, 22, '#1a1a1a', '#141414']} position={[0, 0.02, 0]} />
    </group>
  );
};

/* ── Hit Sparks ── */
const HitSparks = ({ position, active }: { position: [number, number, number]; active: boolean }) => {
  const ref = useRef<THREE.Points>(null);
  const count = 24;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0.8;
      pos[i * 3 + 2] = 0;
      vel[i * 3] = (Math.random() - 0.5) * 0.15;
      vel[i * 3 + 1] = Math.random() * 0.12;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (!ref.current || !active) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      (pos.array as Float32Array)[i * 3] += velocities[i * 3];
      (pos.array as Float32Array)[i * 3 + 1] += velocities[i * 3 + 1];
      (pos.array as Float32Array)[i * 3 + 2] += velocities[i * 3 + 2];
      velocities[i * 3 + 1] -= 0.003; // gravity
    }
    pos.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#fbbf24" transparent opacity={0.9} sizeAttenuation />
    </points>
  );
};

/* ── Robot Agent ── */
const RobotAgent = ({ position, color, name, health, maxHealth, status, fighting, index, isWinner }: {
  position: [number, number, number];
  color: string;
  name: string;
  health: number;
  maxHealth: number;
  status: string;
  fighting: boolean;
  index: number;
  isWinner: boolean;
}) => {
  const groupRef = useRef<any>(null);
  const headRef = useRef<any>(null);
  const leftArmRef = useRef<any>(null);
  const rightArmRef = useRef<any>(null);
  const eliminated = status === 'eliminated';
  const healthPct = health / maxHealth;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    if (isWinner) {
      // Victory float + spin
      groupRef.current.position.y = position[1] + 0.3 + Math.sin(t * 2) * 0.2;
      groupRef.current.rotation.y = t * 1.5;
    } else if (fighting && !eliminated) {
      // Combat stance — bounce + shake
      groupRef.current.position.y = position[1] + Math.sin(t * 5 + index) * 0.12;
      groupRef.current.rotation.y = Math.sin(t * 7 + index * 2) * 0.12;
    } else if (eliminated) {
      // Fallen tilt
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.4, 0.02);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1] - 0.15, 0.02);
    } else {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + index) * 0.04;
      groupRef.current.rotation.y = Math.sin(t * 0.8 + index) * 0.08;
    }

    // Head tracking
    if (headRef.current && !eliminated) {
      headRef.current.rotation.y = Math.sin(t * 2.5 + index) * 0.25;
    }

    // Arm punching during fight
    if (leftArmRef.current && rightArmRef.current && fighting && !eliminated) {
      leftArmRef.current.rotation.x = Math.sin(t * 8 + index) * 0.6;
      rightArmRef.current.rotation.x = Math.sin(t * 8 + index + Math.PI) * 0.6;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="black" transparent opacity={eliminated ? 0.08 : 0.25} />
      </mesh>

      {/* Winner glow ring */}
      {isWinner && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.5, 0.7, 32]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.2} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Body */}
      <group position={[0, 0.6, 0]}>
        <RoundedBox args={[0.7, 0.8, 0.5]} radius={0.08} smoothness={4} castShadow>
          <meshStandardMaterial
            color={eliminated ? '#222' : color}
            roughness={0.3}
            metalness={0.7}
            transparent
            opacity={eliminated ? 0.25 : 1}
          />
        </RoundedBox>
        {/* Chest detail */}
        <RoundedBox args={[0.4, 0.35, 0.1]} radius={0.05} position={[0, 0, 0.26]}>
          <meshStandardMaterial
            color={eliminated ? '#1a1a1a' : '#0a0a0a'}
            metalness={0.9}
            roughness={0.2}
            transparent
            opacity={eliminated ? 0.25 : 0.85}
          />
        </RoundedBox>
        {/* Health indicator light on chest */}
        {!eliminated && (
          <mesh position={[0, -0.05, 0.32]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color={healthPct > 0.6 ? '#22c55e' : healthPct > 0.3 ? '#eab308' : '#ef4444'}
              emissive={healthPct > 0.6 ? '#22c55e' : healthPct > 0.3 ? '#eab308' : '#ef4444'}
              emissiveIntensity={1.5}
            />
          </mesh>
        )}
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, 1.2, 0]}>
        <RoundedBox args={[0.5, 0.45, 0.4]} radius={0.08} castShadow>
          <meshStandardMaterial
            color={eliminated ? '#222' : color}
            roughness={0.3}
            metalness={0.7}
            transparent
            opacity={eliminated ? 0.25 : 1}
          />
        </RoundedBox>
        {/* Visor */}
        <mesh position={[0, 0.02, 0.21]}>
          <boxGeometry args={[0.32, 0.1, 0.02]} />
          <meshStandardMaterial
            color={eliminated ? '#111' : isWinner ? '#fbbf24' : '#fff'}
            emissive={eliminated ? '#000' : isWinner ? '#fbbf24' : '#fff'}
            emissiveIntensity={eliminated ? 0 : isWinner ? 2 : 0.8}
          />
        </mesh>
        {/* Antenna */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
          <meshStandardMaterial color={color} transparent opacity={eliminated ? 0.2 : 0.7} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial
            color={eliminated ? '#222' : color}
            emissive={eliminated ? '#000' : color}
            emissiveIntensity={eliminated ? 0 : isWinner ? 2 : 0.6}
          />
        </mesh>
      </group>

      {/* Arms with refs for punching */}
      <group ref={leftArmRef} position={[-0.55, 0.55, 0]}>
        <RoundedBox args={[0.18, 0.55, 0.18]} radius={0.05} castShadow>
          <meshStandardMaterial color={eliminated ? '#222' : color} roughness={0.4} metalness={0.6} transparent opacity={eliminated ? 0.25 : 0.9} />
        </RoundedBox>
      </group>
      <group ref={rightArmRef} position={[0.55, 0.55, 0]}>
        <RoundedBox args={[0.18, 0.55, 0.18]} radius={0.05} castShadow>
          <meshStandardMaterial color={eliminated ? '#222' : color} roughness={0.4} metalness={0.6} transparent opacity={eliminated ? 0.25 : 0.9} />
        </RoundedBox>
      </group>

      {/* Legs */}
      <RoundedBox args={[0.2, 0.4, 0.2]} radius={0.05} position={[-0.18, 0.05, 0]} castShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} transparent opacity={eliminated ? 0.25 : 1} />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.4, 0.2]} radius={0.05} position={[0.18, 0.05, 0]} castShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} transparent opacity={eliminated ? 0.25 : 1} />
      </RoundedBox>

      {/* Health bar */}
      {!eliminated && (
        <group position={[0, 1.7, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.07, 0.02]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-(0.8 * (1 - healthPct)) / 2, 0, 0.01]}>
            <boxGeometry args={[0.8 * healthPct, 0.07, 0.02]} />
            <meshBasicMaterial color={healthPct > 0.6 ? '#22c55e' : healthPct > 0.3 ? '#eab308' : '#ef4444'} />
          </mesh>
        </group>
      )}

      {/* Name */}
      <Text
        position={[0, 1.9, 0]}
        fontSize={0.14}
        color={eliminated ? '#444' : isWinner ? '#fbbf24' : '#e5e5e5'}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2"
      >
        {isWinner ? `👑 ${name}` : name}
      </Text>

      {/* Eliminated marker */}
      {eliminated && (
        <Text position={[0, 0.8, 0.4]} fontSize={0.5} color="#ef4444" anchorX="center" anchorY="middle">
          ✕
        </Text>
      )}

      {/* Hit sparks during combat */}
      <HitSparks position={[0, 0, 0]} active={fighting && !eliminated} />
    </group>
  );
};

/* ── Ambient Particles ── */
const ParticleField = ({ fighting }: { fighting: boolean }) => {
  const ref = useRef<THREE.Points>(null);
  const count = 100;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = Math.random() * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const speed = fighting ? 2.5 : 0.3;
    ref.current.rotation.y = clock.getElapsedTime() * 0.04 * speed;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color={fighting ? '#ef4444' : '#22c55e'} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

/* ── Main Component ── */
const Arena3D = ({ participants, fighting, winner }: Arena3DProps) => {
  const agentPositions = useMemo(() => {
    const count = participants.length;
    return participants.map((_, i) => {
      const angle = (i / Math.max(count, 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = count <= 2 ? 2 : 2.5;
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number];
    });
  }, [participants.length]);

  return (
    <div className="w-full aspect-[16/9] max-h-[380px] bg-background overflow-hidden relative">
      <Canvas
        shadows
        camera={{ position: [0, 4.5, 6.5], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a0a');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.3;
        }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow shadow-mapSize={1024} />
        <pointLight position={[0, 4, 0]} intensity={fighting ? 2.5 : 0.4} color={fighting ? '#ef4444' : '#22c55e'} />
        <pointLight position={[-4, 2, -3]} intensity={0.25} color="#a855f7" />
        <pointLight position={[4, 2, -3]} intensity={0.25} color="#3b82f6" />
        {/* Winner spotlight */}
        {winner && <pointLight position={[0, 5, 0]} intensity={3} color="#fbbf24" />}

        <ArenaFloor fighting={fighting} />

        {participants.map((p, i) => (
          <RobotAgent
            key={p.id}
            position={agentPositions[i]}
            color={COLORS[i % COLORS.length]}
            name={p.name}
            health={p.health}
            maxHealth={p.maxHealth}
            status={p.status}
            fighting={fighting}
            index={i}
            isWinner={!!winner && p.status === 'alive'}
          />
        ))}

        <ParticleField fighting={fighting} />

        <OrbitControls
          enablePan={false}
          minDistance={3.5}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0.2}
          autoRotate={!fighting}
          autoRotateSpeed={0.6}
        />

        <fog attach="fog" args={['#0a0a0a', 8, 18]} />
      </Canvas>
    </div>
  );
};

export default Arena3D;
