import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

const BotBody = () => {
  const groupRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const antennaRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      // Breathing
      groupRef.current.scale.y = 1 + Math.sin(t * 1.5) * 0.02;
      // Subtle sway
      groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }
    // Blink
    const blinkCycle = t % 4;
    const blinkScale = (blinkCycle > 3.6 && blinkCycle < 3.8) ? 0.1 : 1;
    if (eyeLeftRef.current) eyeLeftRef.current.scale.y = blinkScale;
    if (eyeRightRef.current) eyeRightRef.current.scale.y = blinkScale;
    // Antenna bob
    if (antennaRef.current) {
      antennaRef.current.rotation.z = Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.4}>
      <group ref={groupRef} position={[0, -0.3, 0]}>
        {/* Body - rounded capsule shape */}
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.55, 0.6, 16, 32]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Body accent ring */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.56, 0.03, 8, 32]} />
          <meshStandardMaterial color="#00d4aa" emissive="#00d4aa" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial color="#16213e" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* Face visor */}
        <mesh position={[0, 0.88, 0.28]}>
          <boxGeometry args={[0.6, 0.22, 0.15]} />
          <meshStandardMaterial color="#0a0a1a" metalness={0.9} roughness={0.1} transparent opacity={0.8} />
        </mesh>

        {/* Left eye */}
        <mesh ref={eyeLeftRef} position={[-0.15, 0.9, 0.38]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={2} />
        </mesh>

        {/* Right eye */}
        <mesh ref={eyeRightRef} position={[0.15, 0.9, 0.38]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={2} />
        </mesh>

        {/* Antenna */}
        <group ref={antennaRef} position={[0, 1.35, 0]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.02, 0.25, 8]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={1.5} />
          </mesh>
        </group>

        {/* Arms */}
        <mesh position={[-0.65, 0.05, 0]}>
          <capsuleGeometry args={[0.08, 0.35, 8, 16]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.65, 0.05, 0]}>
          <capsuleGeometry args={[0.08, 0.35, 8, 16]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Chest emblem glow */}
        <mesh position={[0, 0.15, 0.55]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial color="#00d4aa" emissive="#00d4aa" emissiveIntensity={1.5} />
        </mesh>
      </group>
    </Float>
  );
};

const BotCharacter3D = () => {
  return (
    <div className="w-full h-[220px] rounded-lg overflow-hidden bg-gradient-to-b from-background to-muted/30 border border-border">
      <Canvas camera={{ position: [0, 0.5, 3], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} />
        <pointLight position={[-2, 2, 3]} intensity={0.4} color="#00d4aa" />
        <pointLight position={[2, -1, 2]} intensity={0.2} color="#4444ff" />
        <BotBody />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default BotCharacter3D;
