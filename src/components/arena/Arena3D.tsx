import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, RoundedBox, Ring } from '@react-three/drei';
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

const ArenaFloor = () => {
  const ringRef = useRef<any>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5, 0.1, 64]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Ring border */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[4.6, 5, 64]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} transparent opacity={0.6} />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[3, 3.1, 64]} />
        <meshStandardMaterial color="#333" transparent opacity={0.4} />
      </mesh>
      {/* Grid lines on floor */}
      <gridHelper args={[10, 20, '#222', '#181818']} position={[0, 0.02, 0]} />
    </group>
  );
};

const RobotAgent = ({ position, color, name, health, maxHealth, status, fighting, index }: {
  position: [number, number, number];
  color: string;
  name: string;
  health: number;
  maxHealth: number;
  status: string;
  fighting: boolean;
  index: number;
}) => {
  const groupRef = useRef<any>(null);
  const headRef = useRef<any>(null);
  const eliminated = status === 'eliminated';

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    if (fighting && !eliminated) {
      // Bouncing idle + fighting shake
      groupRef.current.position.y = position[1] + Math.sin(t * 4 + index) * 0.15;
      groupRef.current.rotation.y = Math.sin(t * 6 + index * 2) * 0.15;
    } else if (!eliminated) {
      // Gentle idle bob
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + index) * 0.05;
    }

    if (headRef.current && !eliminated) {
      headRef.current.rotation.y = Math.sin(t * 2 + index) * 0.2;
    }
  });

  const healthPct = health / maxHealth;

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="black" transparent opacity={eliminated ? 0.1 : 0.3} />
      </mesh>

      {/* Body */}
      <group position={[0, 0.6, 0]}>
        <RoundedBox args={[0.7, 0.8, 0.5]} radius={0.08} smoothness={4} castShadow>
          <meshStandardMaterial
            color={eliminated ? '#333' : color}
            roughness={0.3}
            metalness={0.7}
            transparent
            opacity={eliminated ? 0.3 : 1}
          />
        </RoundedBox>
        {/* Chest plate */}
        <RoundedBox args={[0.4, 0.35, 0.1]} radius={0.05} position={[0, 0, 0.26]}>
          <meshStandardMaterial color={eliminated ? '#222' : '#111'} metalness={0.9} roughness={0.2} transparent opacity={eliminated ? 0.3 : 0.8} />
        </RoundedBox>
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, 1.2, 0]}>
        <RoundedBox args={[0.5, 0.45, 0.4]} radius={0.08} castShadow>
          <meshStandardMaterial
            color={eliminated ? '#333' : color}
            roughness={0.3}
            metalness={0.7}
            transparent
            opacity={eliminated ? 0.3 : 1}
          />
        </RoundedBox>
        {/* Eyes */}
        <mesh position={[-0.12, 0.02, 0.21]}>
          <boxGeometry args={[0.1, 0.08, 0.02]} />
          <meshStandardMaterial color={eliminated ? '#333' : '#fff'} emissive={eliminated ? '#000' : '#fff'} emissiveIntensity={eliminated ? 0 : 1} />
        </mesh>
        <mesh position={[0.12, 0.02, 0.21]}>
          <boxGeometry args={[0.1, 0.08, 0.02]} />
          <meshStandardMaterial color={eliminated ? '#333' : '#fff'} emissive={eliminated ? '#000' : '#fff'} emissiveIntensity={eliminated ? 0 : 1} />
        </mesh>
        {/* Antenna */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
          <meshStandardMaterial color={color} transparent opacity={eliminated ? 0.3 : 0.8} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={eliminated ? '#333' : color} emissive={eliminated ? '#000' : color} emissiveIntensity={eliminated ? 0 : 0.8} />
        </mesh>
      </group>

      {/* Arms */}
      <RoundedBox args={[0.18, 0.55, 0.18]} radius={0.05} position={[-0.55, 0.55, 0]} castShadow>
        <meshStandardMaterial color={eliminated ? '#333' : color} roughness={0.4} metalness={0.6} transparent opacity={eliminated ? 0.3 : 0.9} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.55, 0.18]} radius={0.05} position={[0.55, 0.55, 0]} castShadow>
        <meshStandardMaterial color={eliminated ? '#333' : color} roughness={0.4} metalness={0.6} transparent opacity={eliminated ? 0.3 : 0.9} />
      </RoundedBox>

      {/* Legs */}
      <RoundedBox args={[0.2, 0.4, 0.2]} radius={0.05} position={[-0.18, 0.05, 0]} castShadow>
        <meshStandardMaterial color={eliminated ? '#222' : '#222'} roughness={0.5} metalness={0.5} transparent opacity={eliminated ? 0.3 : 1} />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.4, 0.2]} radius={0.05} position={[0.18, 0.05, 0]} castShadow>
        <meshStandardMaterial color={eliminated ? '#222' : '#222'} roughness={0.5} metalness={0.5} transparent opacity={eliminated ? 0.3 : 1} />
      </RoundedBox>

      {/* Health bar */}
      {!eliminated && (
        <group position={[0, 1.65, 0]}>
          {/* BG bar */}
          <mesh>
            <boxGeometry args={[0.8, 0.08, 0.02]} />
            <meshBasicMaterial color="#333" />
          </mesh>
          {/* Health fill */}
          <mesh position={[-(0.8 * (1 - healthPct)) / 2, 0, 0.01]}>
            <boxGeometry args={[0.8 * healthPct, 0.08, 0.02]} />
            <meshBasicMaterial color={healthPct > 0.6 ? '#22c55e' : healthPct > 0.3 ? '#eab308' : '#ef4444'} />
          </mesh>
        </group>
      )}

      {/* Name label */}
      <Text
        position={[0, 1.85, 0]}
        fontSize={0.15}
        color={eliminated ? '#555' : '#fff'}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2"
      >
        {name}
      </Text>

      {/* Eliminated X */}
      {eliminated && (
        <Text
          position={[0, 0.8, 0.4]}
          fontSize={0.6}
          color="#ef4444"
          anchorX="center"
          anchorY="middle"
        >
          ✕
        </Text>
      )}
    </group>
  );
};

const ParticleField = ({ fighting }: { fighting: boolean }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 80;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    const t = clock.getElapsedTime();
    const speed = fighting ? 2 : 0.3;
    particlesRef.current.rotation.y = t * 0.05 * speed;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={fighting ? '#ef4444' : '#22c55e'} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
};

const Arena3D = ({ participants, fighting, winner }: Arena3DProps) => {
  const agentPositions = useMemo(() => {
    const count = participants.length;
    return participants.map((_, i) => {
      const angle = (i / Math.max(count, 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = 2.5;
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number];
    });
  }, [participants.length]);

  return (
    <div className="w-full aspect-[4/3] max-h-[420px] bg-background rounded-none overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 5, 7], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a0a');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow shadow-mapSize={1024} />
        <pointLight position={[0, 4, 0]} intensity={fighting ? 2 : 0.5} color={fighting ? '#ef4444' : '#22c55e'} />
        <pointLight position={[-3, 2, -3]} intensity={0.3} color="#a855f7" />
        <pointLight position={[3, 2, -3]} intensity={0.3} color="#3b82f6" />

        {/* Arena floor */}
        <ArenaFloor />

        {/* Robots */}
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
          />
        ))}

        {/* Particles */}
        <ParticleField fighting={fighting} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0.3}
          autoRotate={!fighting}
          autoRotateSpeed={0.5}
        />

        {/* Fog */}
        <fog attach="fog" args={['#0a0a0a', 8, 18]} />
      </Canvas>
    </div>
  );
};

export default Arena3D;
