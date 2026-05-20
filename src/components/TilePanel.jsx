import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTileStore } from '../hooks/useTileStore';

const CategorySection = ({ title, tiles, accentColor, onSelect, selectedTile }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{
      fontSize: '10px',
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: accentColor,
      marginBottom: '10px',
      paddingBottom: '6px',
      borderBottom: `1px solid ${accentColor}33`,
    }}>
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {tiles.map(tile => {
        const isSelected = selectedTile?.id === tile.id;
        return (
          <motion.div
            key={tile.id}
            onClick={() => onSelect(tile)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: isSelected ? `${accentColor}15` : 'transparent',
              border: `1px solid ${isSelected ? accentColor : 'rgba(255,255,255,0.06)'}`,
              boxShadow: isSelected ? `0 0 14px ${accentColor}30` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Swatch */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: tile.hex_color,
              border: `1px solid rgba(255,255,255,0.12)`,
              flexShrink: 0,
              boxShadow: isSelected ? `0 0 8px ${accentColor}50` : 'none',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '12px',
                color: '#e8d5b0',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {tile.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: '#7ab8f5', fontFamily: 'monospace' }}>
                  AED {tile.price_aed}
                </span>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: tile.in_stock ? '#4ade80' : '#f87171',
                  display: 'inline-block'
                }} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

const TilePanel = ({ onRequestSample }) => {
  const {
    tiles, selectedFloorTile, selectedWallTile,
    setSelectedFloorTile, setSelectedWallTile,
    roomType, setRoomType, showPanel
  } = useTileStore();

  const floorTiles  = useMemo(() => tiles.filter(t => t.category === 'floor'),  [tiles]);
  const wallTiles   = useMemo(() => tiles.filter(t => t.category === 'wall'),   [tiles]);
  const accentTiles = useMemo(() => tiles.filter(t => t.category === 'accent'), [tiles]);

  return (
    <AnimatePresence>
      {showPanel && (
        <motion.div
          initial={{ x: 240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 240, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '230px',
            height: '100%',
            background: 'rgba(8,8,16,0.94)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 20,
            overflowY: 'auto',
          }}
        >
          {/* Room selector */}
          <div style={{ padding: '20px 16px 12px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
              ROOM TYPE
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['bathroom', '🛁'], ['living', '🛋️'], ['kitchen', '🍳']].map(([type, icon]) => (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setRoomType(type)}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                    fontSize: '10px', letterSpacing: '0.5px', textTransform: 'capitalize',
                    background: roomType === type ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.04)',
                    color: roomType === type ? '#c9a96e' : 'rgba(255,255,255,0.4)',
                    outline: roomType === type ? '1px solid rgba(201,169,110,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div>{icon}</div>
                  <div style={{ marginTop: 2 }}>{type === 'living' ? 'Living' : type.charAt(0).toUpperCase() + type.slice(1)}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Selected summary */}
          <div style={{ padding: '8px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {selectedFloorTile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: selectedFloorTile.hex_color, border: '1px solid rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: '11px', color: '#c9a96e' }}>Floor: {selectedFloorTile.name}</span>
              </div>
            )}
            {selectedWallTile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: selectedWallTile.hex_color, border: '1px solid rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: '11px', color: '#7ab8f5' }}>Wall: {selectedWallTile.name}</span>
              </div>
            )}
          </div>

          {/* Catalog */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            <CategorySection title="Floor Tiles" tiles={floorTiles}  accentColor="#c9a96e" onSelect={setSelectedFloorTile} selectedTile={selectedFloorTile} />
            <CategorySection title="Wall Tiles"  tiles={wallTiles}   accentColor="#7ab8f5" onSelect={setSelectedWallTile}  selectedTile={selectedWallTile} />
            <CategorySection title="Accent Tiles" tiles={accentTiles} accentColor="#a8e6c0" onSelect={setSelectedFloorTile} selectedTile={selectedFloorTile} />
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRequestSample}
              style={{
                width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid rgba(201,169,110,0.4)',
                background: 'rgba(201,169,110,0.08)', color: '#c9a96e', cursor: 'pointer',
                fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'inherit',
              }}
            >
              📦 Request Free Samples
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TilePanel;
