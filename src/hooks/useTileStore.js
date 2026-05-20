import { create } from 'zustand';
import { TILES } from '../data/tiles';

export const useTileStore = create((set, get) => ({
  tiles: TILES,
  selectedFloorTile: TILES[0],
  selectedWallTile: TILES[1],
  hoveredTile: null,
  roomType: 'living',
  gravityMode: false,
  explodeMode: false,
  orbitMode: false,
  showPanel: true,
  showChat: false,
  showRenderModal: false,

  setSelectedFloorTile: (tile) => set({ selectedFloorTile: tile }),
  setSelectedWallTile: (tile) => set({ selectedWallTile: tile }),
  setHoveredTile: (tile) => set({ hoveredTile: tile }),
  setRoomType: (type) => set({ roomType: type }),
  toggleGravity: () => set((s) => ({ gravityMode: !s.gravityMode, explodeMode: false })),
  triggerExplode: () => {
    set({ explodeMode: true });
    setTimeout(() => set({ explodeMode: false }), 100);
  },
  toggleOrbit: () => set((s) => ({ orbitMode: !s.orbitMode })),
  togglePanel: () => set((s) => ({ showPanel: !s.showPanel })),
  toggleChat: () => set((s) => ({ showChat: !s.showChat })),
  setShowRenderModal: (val) => set({ showRenderModal: val }),
}));
