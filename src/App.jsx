import React, { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls, Environment } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import TileGalaxy from './components/TileGalaxy';
import RoomViewer from './components/RoomViewer';
import TilePanel from './components/TilePanel';
import ChatAgent from './components/ChatAgent';
import SampleRequestModal from './components/SampleRequestModal';
import { useTileStore } from './hooks/useTileStore';

// ── Header Logo ──────────────────────────────────────────────
const Header = ({ view, setView }) => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 28px',
    background: 'linear-gradient(to bottom, rgba(8,8,16,0.9) 0%, rgba(8,8,16,0) 100%)',
    pointerEvents: 'none',
  }}>
    {/* Brand */}
    <div>
      <div style={{ fontSize: '22px', fontWeight: 300, letterSpacing: '6px', color: '#c9a96e', textShadow: '0 0 20px rgba(201,169,110,0.4)' }}>
        AL-NOOR
      </div>
      <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'rgba(255,255,255,0.4)' }}>
        TILE STUDIO • UAE
      </div>
    </div>

    {/* View toggle */}
    <div style={{ pointerEvents: 'auto', display: 'flex', gap: '8px' }}>
      {[['galaxy', '🌌 Galaxy'], ['room', '🏠 Room']].map(([v, label]) => (
        <motion.button
          key={v}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView(v)}
          style={{
            padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '12px', letterSpacing: '1px',
            border: `1px solid ${view === v ? 'rgba(201,169,110,0.6)' : 'rgba(255,255,255,0.1)'}`,
            background: view === v ? 'rgba(201,169,110,0.12)' : 'rgba(8,8,16,0.6)',
            color: view === v ? '#c9a96e' : 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s',
          }}
        >
          {label}
        </motion.button>
      ))}
    </div>
  </div>
);

// ── Bottom Controls (Galaxy mode) ────────────────────────────
const GalaxyControls = () => {
  const { gravityMode, toggleGravity, triggerExplode, orbitMode, toggleOrbit, togglePanel } = useTileStore();

  return (
    <div style={{
      position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 30, display: 'flex', gap: '10px', pointerEvents: 'auto',
    }}>
      {[
        { label: gravityMode ? '🌍 Gravity ON' : '🚀 Gravity OFF', action: toggleGravity, active: gravityMode },
        { label: '💥 Explode', action: triggerExplode, active: false },
        { label: orbitMode ? '🔵 Orbit ON' : '⭕ Orbit OFF', action: toggleOrbit, active: orbitMode },
        { label: '📋 Catalog', action: togglePanel, active: false },
      ].map(({ label, action, active }) => (
        <motion.button
          key={label}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.93 }}
          onClick={action}
          style={{
            padding: '10px 18px', borderRadius: '24px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '12px', letterSpacing: '0.5px',
            border: `1px solid ${active ? 'rgba(201,169,110,0.6)' : 'rgba(255,255,255,0.12)'}`,
            background: active ? 'rgba(201,169,110,0.15)' : 'rgba(8,8,16,0.7)',
            color: active ? '#c9a96e' : '#e8d5b0',
            backdropFilter: 'blur(12px)',
            boxShadow: active ? '0 0 16px rgba(201,169,110,0.2)' : 'none',
          }}
        >
          {label}
        </motion.button>
      ))}
    </div>
  );
};

// ── Hovered tile HUD ─────────────────────────────────────────
const HoveredTileHUD = () => {
  const { hoveredTile } = useTileStore();
  return (
    <AnimatePresence>
      {hoveredTile && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          style={{
            position: 'absolute', bottom: '90px', left: '28px', zIndex: 30,
            padding: '12px 16px',
            background: 'rgba(8,8,16,0.92)',
            border: '1px solid rgba(201,169,110,0.3)',
            borderRadius: '10px',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: '#c9a96e', fontWeight: 600, fontSize: '14px' }}>{hoveredTile.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px', letterSpacing: 1 }}>
            {hoveredTile.category.toUpperCase()} TILE
          </div>
          <div style={{ color: '#7ab8f5', fontFamily: 'monospace', fontSize: '13px', marginTop: '4px' }}>
            AED {hoveredTile.price_aed} / m²
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
            Click to apply to {hoveredTile.category === 'wall' ? 'walls' : 'floor'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Main App ─────────────────────────────────────────────────
const App = () => {
  const [view, setView] = useState('galaxy'); // 'galaxy' | 'room'
  const [showSampleModal, setShowSampleModal] = useState(false);
  const canvasRef = useRef();

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#080810', overflow: 'hidden', fontFamily: 'system-ui, Inter, sans-serif' }}>

      {/* ── 3D Canvas ───────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas
          ref={canvasRef}
          shadows
          camera={view === 'galaxy'
            ? { position: [0, 0, 28], fov: 60 }
            : { position: [6, 2, 8], fov: 55 }
          }
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          style={{ background: '#080810' }}
        >
          <color attach="background" args={['#080810']} />
          <fog attach="fog" args={['#0a0a18', 30, 80]} />

          {/* Shared lights */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 15, 8]} intensity={0.8} color="#fff5e0" castShadow
            shadow-mapSize={[2048, 2048]} shadow-camera-far={60} shadow-camera-near={0.1}
            shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />

          <Suspense fallback={null}>
            {/* Star field — always visible */}
            <Stars radius={120} depth={60} count={2000} factor={3.5} saturation={0} fade speed={0.5} />

            {/* Scene content */}
            <AnimatePresence>
              {view === 'galaxy' ? (
                <TileGalaxy />
              ) : (
                <RoomViewer />
              )}
            </AnimatePresence>

            {/* Environment for reflections */}
            <Environment preset="night" />
          </Suspense>

          {/* Post-processing */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.85} intensity={1.2} height={300} />
          </EffectComposer>

          {/* Camera controls */}
          <OrbitControls
            enableZoom enablePan enableRotate
            maxDistance={view === 'galaxy' ? 55 : 18}
            minDistance={view === 'galaxy' ? 8 : 3}
            target={view === 'room' ? [0, -1, 0] : [0, 0, 0]}
            makeDefault
          />
        </Canvas>
      </div>

      {/* ── UI Overlay ──────────────────────────────── */}
      <Header view={view} setView={setView} />

      {view === 'galaxy' && (
        <>
          <GalaxyControls />
          <HoveredTileHUD />
        </>
      )}

      {/* Tile catalog panel */}
      <TilePanel onRequestSample={() => setShowSampleModal(true)} />

      {/* AI Chat */}
      <ChatAgent />

      {/* Sample modal */}
      <AnimatePresence>
        {showSampleModal && (
          <SampleRequestModal onClose={() => setShowSampleModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
