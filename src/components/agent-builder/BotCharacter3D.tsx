import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

export type BotTier = 'clawd' | 'moltbot' | 'openclaw';

export interface BotAppearance {
  tier: BotTier;
  bodyColor: string;
  eyeColor: string;
  accentColor: string;
}

export const DEFAULT_APPEARANCE: BotAppearance = {
  tier: 'clawd',
  bodyColor: '#8B3A3A',
  eyeColor: '#00ffcc',
  accentColor: '#00d4aa',
};

/* ── Clawd: small round cute bot ── */
const ClawdBody = ({ bodyColor, eyeColor, accentColor }: Omit<BotAppearance, 'tier'>) => {
  const groupRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const antennaRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.scale.y = 1 + Math.sin(t * 1.5) * 0.03;
      groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.04;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.12;
    }
    const blinkCycle = t % 3.5;
    const blinkScale = (blinkCycle > 3.1 && blinkCycle < 3.3) ? 0.1 : 1;
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = blinkScale;
    if (eyeRightRef.current) eyeRightRef.current.scale.y = blinkScale;
    if (antennaRef.current) antennaRef.current.rotation.z = Math.sin(t * 2.5) * 0.2;
  });

  return (
    <Float speed={2.5} rotationIntensity={0.15} floatIntensity={0.5}>
      <group ref={groupRef} position={[0, -0.2, 0]}>
        {/* Round body */}
        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Eyes */}
        <mesh ref={eyeLeftRef} position={[-0.18, 0.15, 0.5]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2} />
        </mesh>
        <mesh ref={eyeRightRef} position={[0.18, 0.15, 0.5]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2} />
        </mesh>
        {/* Tiny arms */}
        <mesh position={[-0.55, -0.1, 0]}>
          <capsuleGeometry args={[0.06, 0.15, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0.55, -0.1, 0]}>
          <capsuleGeometry args={[0.06, 0.15, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Tiny legs */}
        <mesh position={[-0.2, -0.6, 0]}>
          <capsuleGeometry args={[0.06, 0.12, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0.2, -0.6, 0]}>
          <capsuleGeometry args={[0.06, 0.12, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Antenna */}
        <group ref={antennaRef} position={[0, 0.6, 0]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.02, 0.2, 8]} />
            <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.5} />
          </mesh>
        </group>
      </group>
    </Float>
  );
};

/* ── Moltbot: medium armored bot ── */
const MoltbotBody = ({ bodyColor, eyeColor, accentColor }: Omit<BotAppearance, 'tier'>) => {
  const groupRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.scale.y = 1 + Math.sin(t * 1.2) * 0.02;
      groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.02;
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
    }
    const blinkCycle = t % 4;
    const blinkScale = (blinkCycle > 3.6 && blinkCycle < 3.8) ? 0.1 : 1;
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = blinkScale;
    if (eyeRightRef.current) eyeRightRef.current.scale.y = blinkScale;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.08} floatIntensity={0.3}>
      <group ref={groupRef} position={[0, -0.3, 0]}>
        {/* Torso - wider, armored */}
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.5, 0.5, 16, 32]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Armor plates */}
        <mesh position={[0, 0.15, 0.45]}>
          <boxGeometry args={[0.6, 0.4, 0.1]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Shoulder pads */}
        <mesh position={[-0.6, 0.3, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.6, 0.3, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Horn spike */}
        <mesh position={[0, 1.15, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.06, 0.2, 8]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Side horns */}
        <mesh position={[-0.25, 1.0, 0]} rotation={[0, 0, 0.4]}>
          <coneGeometry args={[0.04, 0.15, 8]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.25, 1.0, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.04, 0.15, 8]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Eyes - angular/fierce */}
        <mesh ref={eyeLeftRef} position={[-0.13, 0.78, 0.32]}>
          <boxGeometry args={[0.1, 0.04, 0.05]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2.5} />
        </mesh>
        <mesh ref={eyeRightRef} position={[0.13, 0.78, 0.32]}>
          <boxGeometry args={[0.1, 0.04, 0.05]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={2.5} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.65, -0.05, 0]}>
          <capsuleGeometry args={[0.1, 0.35, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0.65, -0.05, 0]}>
          <capsuleGeometry args={[0.1, 0.35, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.22, -0.6, 0]}>
          <capsuleGeometry args={[0.1, 0.25, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0.22, -0.6, 0]}>
          <capsuleGeometry args={[0.1, 0.25, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Chest emblem */}
        <mesh position={[0, 0.15, 0.52]}>
          <circleGeometry args={[0.07, 16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.5} />
        </mesh>
      </group>
    </Float>
  );
};

/* ── OpenClaw: large armored boss bot ── */
const OpenClawBody = ({ bodyColor, eyeColor, accentColor }: Omit<BotAppearance, 'tier'>) => {
  const groupRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.scale.y = 1 + Math.sin(t * 1.0) * 0.015;
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.015;
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.06;
    }
    const blinkCycle = t % 5;
    const blinkScale = (blinkCycle > 4.5 && blinkCycle < 4.7) ? 0.1 : 1;
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = blinkScale;
    if (eyeRightRef.current) eyeRightRef.current.scale.y = blinkScale;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={groupRef} position={[0, -0.4, 0]} scale={0.85}>
        {/* Massive torso */}
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.6, 0.7, 16, 32]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Chest armor plates */}
        <mesh position={[0, 0.2, 0.5]}>
          <boxGeometry args={[0.8, 0.5, 0.12]} />
          <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.1, 0.48]}>
          <boxGeometry args={[0.7, 0.3, 0.1]} />
          <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Massive shoulders */}
        <mesh position={[-0.75, 0.35, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.75, 0.35, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Shoulder spikes */}
        <mesh position={[-0.85, 0.55, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.06, 0.25, 8]} />
          <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.85, 0.55, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.06, 0.25, 8]} />
          <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Crown of spikes */}
        {[0, 0.8, 1.6, 2.4, 3.2, 4.0].map((angle, i) => (
          <mesh key={i} position={[Math.sin(angle) * 0.28, 1.15 + Math.cos(angle) * 0.05, Math.cos(angle) * 0.28]} rotation={[Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3]}>
            <coneGeometry args={[0.04, 0.2, 6]} />
            <meshStandardMaterial color={bodyColor} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* Angry eyes - narrow slits */}
        <mesh ref={eyeLeftRef} position={[-0.12, 0.88, 0.3]}>
          <boxGeometry args={[0.12, 0.035, 0.05]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={3} />
        </mesh>
        <mesh ref={eyeRightRef} position={[0.12, 0.88, 0.3]}>
          <boxGeometry args={[0.12, 0.035, 0.05]} />
          <meshStandardMaterial color={eyeColor} emissive={eyeColor} emissiveIntensity={3} />
        </mesh>
        {/* Heavy arms */}
        <mesh position={[-0.8, -0.1, 0]}>
          <capsuleGeometry args={[0.13, 0.45, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.8, -0.1, 0]}>
          <capsuleGeometry args={[0.13, 0.45, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Clawed fists */}
        <mesh position={[-0.8, -0.45, 0.1]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.8, -0.45, 0.1]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Heavy legs */}
        <mesh position={[-0.25, -0.7, 0]}>
          <capsuleGeometry args={[0.13, 0.3, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.25, -0.7, 0]}>
          <capsuleGeometry args={[0.13, 0.3, 8, 16]} />
          <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Chest emblem */}
        <mesh position={[0, 0.25, 0.58]}>
          <circleGeometry args={[0.1, 6]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2} />
        </mesh>
      </group>
    </Float>
  );
};

interface BotCharacter3DProps {
  appearance?: BotAppearance;
}

const BotCharacter3D = ({ appearance = DEFAULT_APPEARANCE }: BotCharacter3DProps) => {
  const { tier, bodyColor, eyeColor, accentColor } = appearance;

  return (
    <div className="w-full h-[220px] rounded-lg overflow-hidden bg-gradient-to-b from-background to-muted/30 border border-border">
      <Canvas camera={{ position: [0, 0.5, 3], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} />
        <pointLight position={[-2, 2, 3]} intensity={0.4} color={accentColor} />
        <pointLight position={[2, -1, 2]} intensity={0.2} color="#4444ff" />
        {tier === 'clawd' && <ClawdBody bodyColor={bodyColor} eyeColor={eyeColor} accentColor={accentColor} />}
        {tier === 'moltbot' && <MoltbotBody bodyColor={bodyColor} eyeColor={eyeColor} accentColor={accentColor} />}
        {tier === 'openclaw' && <OpenClawBody bodyColor={bodyColor} eyeColor={eyeColor} accentColor={accentColor} />}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default BotCharacter3D;