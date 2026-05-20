import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { generateTileTexture } from '../utils/textureGenerator';
import { useTileStore } from '../hooks/useTileStore';

// ─── Single floating tile slab ──────────────────────────────────────────
const TileSlab = ({ tileData, initialPosition, index, onSelect }) => {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [launched, setLaunched] = useState(false);

  const { gravityMode, explodeMode, orbitMode } = useTileStore();
  const setHoveredTile = useTileStore((s) => s.setHoveredTile);

  const { colorMap, normalMap, roughnessMap } = useMemo(
    () => generateTileTexture(tileData.hex_color, tileData.roughness, tileData.metalness),
    [tileData.hex_color, tileData.roughness, tileData.metalness]
  );

  // Stable per-tile random parameters
  const params = useMemo(() => ({
    timeOffset: Math.random() * Math.PI * 2,
    driftSpeed: 0.3 + Math.random() * 0.4,
    driftRadius: 0.8 + Math.random() * 1.2,
    rotSpeed: (Math.random() - 0.5) * 0.4,
    rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
    orbitRadius: 8 + Math.random() * 6,
    orbitSpeed: 0.15 + Math.random() * 0.2,
    orbitPhase: (index / 30) * Math.PI * 2,
    orbitTilt: (Math.random() - 0.5) * 0.6,
  }), [index]);

  const velocity = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(...initialPosition));
  const explodeFired = useRef(false);

  useEffect(() => {
    if (explodeMode && !explodeFired.current) {
      explodeFired.current = true;
      const dir = pos.current.clone().normalize();
      velocity.current.set(
        dir.x * (15 + Math.random() * 20),
        dir.y * (15 + Math.random() * 20) + 5,
        dir.z * (15 + Math.random() * 20)
      );
    }
    if (!explodeMode) explodeFired.current = false;
  }, [explodeMode]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const mesh = meshRef.current;

    if (gravityMode) {
      velocity.current.y -= 9.8 * delta;
      pos.current.addScaledVector(velocity.current, delta);
      if (pos.current.y < -8) {
        pos.current.y = -8;
        velocity.current.y *= -0.4;
        velocity.current.x *= 0.85;
        velocity.current.z *= 0.85;
      }
      mesh.position.copy(pos.current);
      mesh.rotateOnAxis(params.rotAxis, delta * 0.5);
    } else if (orbitMode) {
      const angle = params.orbitPhase + t * params.orbitSpeed;
      mesh.position.set(
        Math.cos(angle) * params.orbitRadius,
        Math.sin(t * 0.3 + params.timeOffset) * 1.5 + params.orbitTilt * params.orbitRadius * 0.5,
        Math.sin(angle) * params.orbitRadius
      );
      mesh.rotation.y = angle + Math.PI / 2;
      mesh.rotation.x = params.orbitTilt;
      pos.current.copy(mesh.position);
      velocity.current.set(0, 0, 0);
    } else {
      // Antigravity drift
      if (explodeFired.current) {
        // Slow back down after explosion
        velocity.current.multiplyScalar(0.97);
        pos.current.addScaledVector(velocity.current, delta);
        // Gently return to home
        const home = new THREE.Vector3(...initialPosition);
        const distToHome = pos.current.distanceTo(home);
        if (distToHome > 2) {
          const pull = home.clone().sub(pos.current).normalize().multiplyScalar(0.5);
          velocity.current.add(pull.multiplyScalar(delta));
        }
      } else {
        const targetX = initialPosition[0] + Math.sin(t * params.driftSpeed + params.timeOffset) * params.driftRadius;
        const targetY = initialPosition[1] + Math.sin(t * params.driftSpeed * 0.7 + params.timeOffset * 1.3) * params.driftRadius;
        const targetZ = initialPosition[2] + Math.cos(t * params.driftSpeed * 0.5 + params.timeOffset * 0.8) * params.driftRadius * 0.5;
        pos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.03);
      }
      mesh.position.copy(pos.current);
      mesh.rotateOnAxis(params.rotAxis, delta * Math.abs(params.rotSpeed));
    }

    // Hover scale
    const targetScale = hovered ? 1.18 : 1.0;
    mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Glow mesh
    if (glowRef.current) {
      glowRef.current.material.opacity = hovered ? 0.25 : 0;
    }
  });

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    setHoveredTile(tileData);
    document.body.style.cursor = 'pointer';
  }, [tileData, setHoveredTile]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    setHoveredTile(null);
    document.body.style.cursor = 'default';
  }, [setHoveredTile]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onSelect(tileData);
  }, [tileData, onSelect]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={initialPosition}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[2.2, 2.2, 0.12]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          roughness={tileData.roughness}
          metalness={tileData.metalness}
          envMapIntensity={1.5}
        />
        {/* Gold glow outline */}
        <mesh ref={glowRef} scale={[1.08, 1.08, 1.5]}>
          <boxGeometry args={[2.2, 2.2, 0.12]} />
          <meshBasicMaterial color="#c9a96e" transparent opacity={0} side={THREE.BackSide} />
        </mesh>

        {/* Tooltip */}
        {hovered && (
          <Html center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(8,8,16,0.92)',
              border: '1px solid rgba(201,169,110,0.6)',
              borderRadius: '6px',
              padding: '8px 14px',
              color: '#e8d5b0',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(201,169,110,0.2)',
              transform: 'translateY(-60px)',
            }}>
              <div style={{ fontWeight: 600, color: '#c9a96e', marginBottom: 3 }}>{tileData.name}</div>
              <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>{tileData.category}</div>
              <div style={{ marginTop: 4, fontFamily: 'monospace', color: '#7ab8f5' }}>AED {tileData.price_aed}/m²</div>
              {!tileData.in_stock && <div style={{ color: '#ff6b6b', fontSize: 10, marginTop: 2 }}>● Out of Stock</div>}
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
};

// ─── Gold dust particles ────────────────────────────────────────────────
const GoldDust = () => {
  const pointsRef = useRef();
  const count = 600;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 25;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#c9a96e"
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// ─── Main Galaxy ────────────────────────────────────────────────────────
const TileGalaxy = ({ canvasRef }) => {
  const { tiles, setSelectedFloorTile, setSelectedWallTile } = useTileStore();

  const positions = useMemo(() => {
    return tiles.map((_, i) => {
      // Fibonacci sphere distribution for even spread
      const golden = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (i / (tiles.length - 1)) * 2;
      const radius = Math.sqrt(1 - y * y) * 14;
      const theta = golden * i;
      return [
        Math.cos(theta) * radius,
        y * 12,
        Math.sin(theta) * radius - 5,
      ];
    });
  }, [tiles]);

  const handleSelect = useCallback((tile) => {
    if (tile.category === 'floor') setSelectedFloorTile(tile);
    else if (tile.category === 'wall') setSelectedWallTile(tile);
    else setSelectedFloorTile(tile); // accent goes to floor
  }, [setSelectedFloorTile, setSelectedWallTile]);

  return (
    <group>
      <GoldDust />
      {tiles.map((tile, i) => (
        <TileSlab
          key={tile.id}
          tileData={tile}
          initialPosition={positions[i]}
          index={i}
          onSelect={handleSelect}
        />
      ))}
    </group>
  );
};

export default TileGalaxy;
