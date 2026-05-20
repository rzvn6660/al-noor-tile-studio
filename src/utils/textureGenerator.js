import * as THREE from 'three';

const textureCache = new Map();

export const generateTileTexture = (hexColor, roughnessValue = 0.2, metalness = 0.1) => {
  const cacheKey = `${hexColor}_${roughnessValue}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);

  const size = 512;
  
  // ── Color Map ──────────────────────────────────────────────
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d');

  // Base fill
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, size, size);

  // Parse hex to RGB for vein color
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const veinLightness = brightness > 128 ? 60 : 200;

  // Marble veins — multiple bezier strokes
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.bezierCurveTo(
      Math.random() * size, Math.random() * size,
      Math.random() * size, Math.random() * size,
      Math.random() * size, Math.random() * size
    );
    ctx.strokeStyle = `rgba(${veinLightness},${veinLightness},${veinLightness},${0.05 + Math.random() * 0.15})`;
    ctx.lineWidth = 0.5 + Math.random() * 2.5;
    ctx.stroke();
  }

  // Crystal flecks (for granite)
  for (let i = 0; i < 3000; i++) {
    const alpha = Math.random() * 0.12;
    const lum = brightness > 128 ? Math.random() * 80 : 180 + Math.random() * 75;
    ctx.fillStyle = `rgba(${lum},${lum},${lum+20},${alpha})`;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const s = Math.random() * 3;
    ctx.fillRect(x, y, s, s);
  }

  // Grout lines (subtle grid)
  ctx.strokeStyle = `rgba(${veinLightness * 0.5},${veinLightness * 0.5},${veinLightness * 0.5},0.15)`;
  ctx.lineWidth = 1;
  for (let x = 0; x < size; x += 128) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
  }
  for (let y = 0; y < size; y += 128) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
  }

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.colorSpace = THREE.SRGBColorSpace;

  // ── Normal Map ─────────────────────────────────────────────
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nCtx = normalCanvas.getContext('2d');
  nCtx.fillStyle = '#8080ff';
  nCtx.fillRect(0, 0, size, size);
  // Subtle height perturbations
  for (let i = 0; i < 200; i++) {
    const nx = Math.random() * size, ny = Math.random() * size;
    const grad = nCtx.createRadialGradient(nx, ny, 0, nx, ny, 20 + Math.random() * 40);
    grad.addColorStop(0, 'rgba(145,145,255,0.3)');
    grad.addColorStop(1, 'rgba(128,128,255,0)');
    nCtx.fillStyle = grad;
    nCtx.fillRect(nx - 40, ny - 40, 80, 80);
  }
  const normalTexture = new THREE.CanvasTexture(normalCanvas);

  // ── Roughness Map ──────────────────────────────────────────
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');
  const roughGray = Math.floor(roughnessValue * 255);
  rCtx.fillStyle = `rgb(${roughGray},${roughGray},${roughGray})`;
  rCtx.fillRect(0, 0, size, size);
  // Slight variation
  for (let i = 0; i < 1000; i++) {
    const v = roughGray + (Math.random() - 0.5) * 40;
    rCtx.fillStyle = `rgb(${v},${v},${v})`;
    rCtx.fillRect(Math.random() * size, Math.random() * size, 10, 10);
  }
  const roughnessTexture = new THREE.CanvasTexture(roughCanvas);

  const result = { colorMap: colorTexture, normalMap: normalTexture, roughnessMap: roughnessTexture };
  textureCache.set(cacheKey, result);
  return result;
};

export const disposeTextures = ({ colorMap, normalMap, roughnessMap }) => {
  colorMap?.dispose();
  normalMap?.dispose();
  roughnessMap?.dispose();
};
