import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { generateTileTexture } from '../utils/textureGenerator';
import { useTileStore } from '../hooks/useTileStore';

// ── Furniture helpers ──────────────────────────────────────────
const Box = ({ size, position, rotation, color, roughness = 0.6, metalness = 0.1, children }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    {children}
  </mesh>
);

const Cylinder = ({ args, position, rotation, color, roughness = 0.5, metalness = 0.2 }) => (
  <mesh position={position} rotation={rotation} castShadow receiveShadow>
    <cylinderGeometry args={args} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
  </mesh>
);

// ── Bathroom ──────────────────────────────────────────────────
const BathroomFurniture = () => (
  <group>
    {/* Bathtub */}
    <Box size={[2.2, 0.65, 1.0]} position={[-2, -2.67, -1]} color="#f0f0f0" roughness={0.1} metalness={0.05}>
      {/* Inside */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2.0, 0.2, 0.85]} />
        <meshStandardMaterial color="#e0e8f0" roughness={0.05} metalness={0.1} />
      </mesh>
    </Box>
    {/* Tub faucet */}
    <Cylinder args={[0.03, 0.03, 0.3, 8]} position={[-1.05, -2.1, -0.55]} color="#c0c8d0" roughness={0.1} metalness={0.8} />

    {/* Toilet */}
    <group position={[2, -3, -1.5]}>
      <Box size={[0.5, 0.4, 0.65]} position={[0, 0, 0]} color="#f5f5f5" roughness={0.15} metalness={0.05} />
      <Box size={[0.55, 0.08, 0.7]} position={[0, 0.24, 0]} color="#f0f0f0" roughness={0.1} />
      <Box size={[0.4, 0.5, 0.2]} position={[0, 0.05, -0.42]} color="#f5f5f5" roughness={0.12} />
    </group>

    {/* Vanity */}
    <Box size={[1.5, 0.6, 0.5]} position={[2, -2.7, 1]} color="#8b7355" roughness={0.4} metalness={0.05} />
    <Box size={[1.5, 0.04, 0.5]} position={[2, -2.37, 1]} color="#e8ddd0" roughness={0.05} metalness={0.1} />
    {/* Sink basin */}
    <mesh position={[2, -2.3, 1]}>
      <cylinderGeometry args={[0.28, 0.22, 0.12, 16]} />
      <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.05} />
    </mesh>
    {/* Faucet */}
    <Cylinder args={[0.02, 0.02, 0.25, 8]} position={[2, -2.1, 0.9]} color="#c0c0c0" roughness={0.1} metalness={0.9} />

    {/* Mirror */}
    <Box size={[1.4, 1.0, 0.04]} position={[2, -1.5, 1.25]} color="#a8c4d8" roughness={0.02} metalness={0.9} />
    <Box size={[1.44, 1.04, 0.02]} position={[2, -1.5, 1.26]} color="#c9a96e" roughness={0.3} metalness={0.6} />

    {/* Shower enclosure */}
    <Box size={[0.04, 2.5, 1.2]} position={[-0.3, -2.25, 1.1]} color="#c8d8e8" roughness={0.02} metalness={0.1} />
    <Box size={[1.2, 2.5, 0.04]} position={[-0.9, -2.25, 1.72]} color="#c8d8e8" roughness={0.02} metalness={0.1} />
  </group>
);

// ── Living Room ───────────────────────────────────────────────
const LivingRoomFurniture = () => (
  <group>
    {/* Sofa base */}
    <Box size={[3.5, 0.45, 1.2]} position={[0, -2.77, -1.4]} color="#5a4a3a" roughness={0.7} metalness={0.0} />
    {/* Sofa back */}
    <Box size={[3.5, 0.8, 0.3]} position={[0, -2.35, -1.95]} color="#5a4a3a" roughness={0.7} />
    {/* Sofa cushions */}
    {[-1.1, 0, 1.1].map((x, i) => (
      <Box key={i} size={[1.0, 0.2, 1.0]} position={[x, -2.47, -1.35]} color="#7a6a5a" roughness={0.8} />
    ))}
    {/* Armrests */}
    {[-1.75, 1.75].map((x, i) => (
      <Box key={i} size={[0.25, 0.5, 1.2]} position={[x, -2.6, -1.4]} color="#5a4a3a" roughness={0.7} />
    ))}

    {/* Coffee table */}
    <Box size={[1.5, 0.06, 0.8]} position={[0, -2.62, 0.2]} color="#6b5a3e" roughness={0.4} metalness={0.05} />
    {[[-0.6, -2.88, 0.05], [0.6, -2.88, 0.05], [-0.6, -2.88, 0.35], [0.6, -2.88, 0.35]].map((p, i) => (
      <Box key={i} size={[0.06, 0.5, 0.06]} position={p} color="#4a3a28" roughness={0.3} />
    ))}

    {/* TV unit */}
    <Box size={[2.5, 0.4, 0.35]} position={[0, -2.75, -3.6]} color="#2a2a2a" roughness={0.5} metalness={0.2} />
    {/* TV screen */}
    <Box size={[2.2, 1.3, 0.06]} position={[0, -2.0, -3.6]} color="#0a0a0a" roughness={0.05} metalness={0.8} />
    {/* TV screen glow */}
    <mesh position={[0, -2.0, -3.57]}>
      <planeGeometry args={[2.1, 1.2]} />
      <meshBasicMaterial color="#1a2a4a" />
    </mesh>

    {/* Floor lamp */}
    <group position={[2.5, -3, -1.5]}>
      <Cylinder args={[0.06, 0.06, 2.5, 8]} position={[0, 0, 0]} color="#888" roughness={0.2} metalness={0.8} />
      <mesh position={[0, 1.3, 0]}>
        <coneGeometry args={[0.35, 0.5, 16, 1, true]} />
        <meshBasicMaterial color="#f0e0c0" side={THREE.DoubleSide} />
      </mesh>
      {/* Light source */}
      <pointLight position={[0, 1.0, 0]} intensity={2} color="#ffe8c0" distance={5} decay={2} />
    </group>
  </group>
);

// ── Kitchen ───────────────────────────────────────────────────
const KitchenFurniture = () => (
  <group>
    {/* Island */}
    <Box size={[2.2, 0.9, 1.0]} position={[0, -2.55, -0.5]} color="#d0c8bc" roughness={0.15} metalness={0.1} />
    <Box size={[2.2, 0.06, 1.0]} position={[0, -2.07, -0.5]} color="#e8e0d4" roughness={0.05} metalness={0.15} />

    {/* Bar stools */}
    {[-0.65, 0, 0.65].map((x, i) => (
      <group key={i} position={[x, -3, 0.8]}>
        <Cylinder args={[0.22, 0.22, 0.06, 12]} position={[0, 0.5, 0]} color="#8a7060" roughness={0.5} />
        <Cylinder args={[0.04, 0.04, 1.0, 8]} position={[0, 0, 0]} color="#888" roughness={0.2} metalness={0.8} />
        <Cylinder args={[0.2, 0.2, 0.04, 12]} position={[0, -0.5, 0]} color="#555" roughness={0.3} />
      </group>
    ))}

    {/* Counter cabinets */}
    <Box size={[4, 0.9, 0.55]} position={[0, -2.55, -3.45]} color="#8b7355" roughness={0.4} metalness={0.05} />
    <Box size={[4, 0.04, 0.55]} position={[0, -2.07, -3.45]} color="#e0d8c8" roughness={0.05} metalness={0.2} />

    {/* Upper cabinets */}
    <Box size={[4, 1.0, 0.45]} position={[0, -0.8, -3.5]} color="#8b7355" roughness={0.4} />

    {/* Stove / hob */}
    <Box size={[0.9, 0.02, 0.6]} position={[-1.2, -2.04, -3.45]} color="#1a1a1a" roughness={0.1} metalness={0.7} />
    {[[-1.4, -2.02, -3.28], [-1.0, -2.02, -3.28], [-1.4, -2.02, -3.62], [-1.0, -2.02, -3.62]].map((p, i) => (
      <mesh key={i} position={p}>
        <ringGeometry args={[0.08, 0.12, 20]} />
        <meshStandardMaterial color="#444" roughness={0.2} metalness={0.8} />
      </mesh>
    ))}

    {/* Sink */}
    <Box size={[0.8, 0.04, 0.5]} position={[1.3, -2.04, -3.45]} color="#c0c8d0" roughness={0.05} metalness={0.8} />
    <Cylinder args={[0.02, 0.02, 0.2, 8]} position={[1.3, -1.88, -3.3]} color="#aaa" roughness={0.1} metalness={0.9} />
  </group>
);

// ── Room structure ────────────────────────────────────────────
const RoomViewer = () => {
  const { selectedFloorTile, selectedWallTile, roomType } = useTileStore();

  const floorTex = useMemo(() => generateTileTexture(selectedFloorTile.hex_color, selectedFloorTile.roughness), [selectedFloorTile]);
  const wallTex  = useMemo(() => generateTileTexture(selectedWallTile.hex_color,  selectedWallTile.roughness),  [selectedWallTile]);

  // Repeat textures
  useMemo(() => {
    [floorTex.colorMap, floorTex.normalMap, floorTex.roughnessMap].forEach(t => {
      if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); t.needsUpdate = true; }
    });
    [wallTex.colorMap, wallTex.normalMap, wallTex.roughnessMap].forEach(t => {
      if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.needsUpdate = true; }
    });
  }, [floorTex, wallTex]);

  const W = 8, H = 6, D = 8;

  return (
    <group position={[0, 0, 0]}>
      {/* Ambient fill */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 3]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} color="#fff8f0" />
      <pointLight position={[0, 2.5, 0]} intensity={0.8} color="#ffe8c0" distance={10} decay={2} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floorTex.colorMap} normalMap={floorTex.normalMap} roughnessMap={floorTex.roughnessMap}
          roughness={selectedFloorTile.roughness} metalness={selectedFloorTile.metalness} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, H / 2 - 3, -D / 2]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTex.colorMap} normalMap={wallTex.normalMap} roughnessMap={wallTex.roughnessMap}
          roughness={selectedWallTile.roughness} metalness={selectedWallTile.metalness} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-W / 2, H / 2 - 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTex.colorMap} normalMap={wallTex.normalMap} roughnessMap={wallTex.roughnessMap}
          roughness={selectedWallTile.roughness} metalness={selectedWallTile.metalness} />
      </mesh>

      {/* Right wall */}
      <mesh position={[W / 2, H / 2 - 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTex.colorMap} normalMap={wallTex.normalMap} roughnessMap={wallTex.roughnessMap}
          roughness={selectedWallTile.roughness} metalness={selectedWallTile.metalness} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H - 3, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#1a1a28" roughness={0.9} />
      </mesh>

      {/* Trim strip */}
      <mesh position={[0, -2.6, -D / 2 + 0.02]}>
        <planeGeometry args={[W, 0.15]} />
        <meshStandardMaterial color="#c9a96e" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[-W / 2 + 0.02, -2.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, 0.15]} />
        <meshStandardMaterial color="#c9a96e" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[W / 2 - 0.02, -2.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, 0.15]} />
        <meshStandardMaterial color="#c9a96e" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Furniture */}
      {roomType === 'bathroom' && <BathroomFurniture />}
      {roomType === 'living'   && <LivingRoomFurniture />}
      {roomType === 'kitchen'  && <KitchenFurniture />}
    </group>
  );
};

export default RoomViewer;
