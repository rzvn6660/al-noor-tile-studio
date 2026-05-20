// Frontend DOM & UI Controller
let currentView = 'galaxy';

document.addEventListener('DOMContentLoaded', () => {
  // Fetch initial tiles from Flask backend
  fetchCatalog();
});

async function fetchCatalog() {
  try {
    const res = await fetch('/api/tiles?visible_only=true');
    const data = await res.json();
    if (data.success && data.tiles) {
      renderCatalog(data.tiles);
      // Initialize Three.js galaxy using retrieved tiles catalog
      initGalaxy(data.tiles);
    }
  } catch (err) {
    console.error("Error loading tile catalog:", err);
  }
}

function renderCatalog(tiles) {
  const container = document.getElementById('catalog-items-container');
  container.innerHTML = '';

  const categories = {
    floor: 'FLOOR TILES',
    wall: 'WALL CLADDING',
    accent: 'ACCENT TILES'
  };

  Object.entries(categories).forEach(([catKey, catName]) => {
    // Filter tiles for current category
    const catTiles = tiles.filter(t => t.category === catKey);
    if (catTiles.length === 0) return;

    // Create Section Header
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'catalog-section-title';
    sectionHeader.innerText = catName;
    container.appendChild(sectionHeader);

    // Render Cards
    catTiles.forEach(tile => {
      const card = document.createElement('div');
      card.className = `tile-card`;
      card.id = `tile-card-${tile.id}`;
      card.onclick = () => selectTile(tile);

      const swatch = document.createElement('div');
      swatch.className = 'tile-swatch';
      swatch.style.backgroundColor = tile.hex_color;

      const info = document.createElement('div');
      info.className = 'tile-info';
      
      const name = document.createElement('div');
      name.className = 'tile-name';
      name.innerText = tile.name;

      const price = document.createElement('div');
      price.className = 'tile-price';
      price.innerText = `AED ${tile.price_aed}/m²`;

      // Stock status light
      const stock = document.createElement('span');
      stock.className = 'tile-stock';
      stock.style.backgroundColor = tile.in_stock ? '#4ade80' : '#f87171';
      price.appendChild(stock);

      info.appendChild(name);
      info.appendChild(price);
      card.appendChild(swatch);
      card.appendChild(info);
      container.appendChild(card);
    });
  });
}

function selectTile(tile) {
  if (!tile) return;
  
  // Apply logic based on type
  if (tile.category === 'floor' || tile.category === 'accent') {
    updateRoomMaterial(tile, 'floor');
  } else if (tile.category === 'wall') {
    updateRoomMaterial(tile, 'wall');
  }

  // Visual highlights on UI Panel
  document.querySelectorAll('.tile-card').forEach(c => {
    c.classList.remove('selected-floor', 'selected-wall');
  });

  if (activeFloorTile) {
    const floorCard = document.getElementById(`tile-card-${activeFloorTile.id}`);
    if (floorCard) floorCard.classList.add('selected-floor');
  }
  if (activeWallTile) {
    const wallCard = document.getElementById(`tile-card-${activeWallTile.id}`);
    if (wallCard) wallCard.classList.add('selected-wall');
  }
}

function updateUiSelections() {
  // Update UI headers or variables
  if (activeFloorTile) {
    document.getElementById('sample-floor-name').innerText = activeFloorTile.name;
    document.getElementById('sample-floor-swatch').style.backgroundColor = activeFloorTile.hex_color;
  }
  if (activeWallTile) {
    document.getElementById('sample-wall-name').innerText = activeWallTile.name;
    document.getElementById('sample-wall-swatch').style.backgroundColor = activeWallTile.hex_color;
  }
}

// HUD functions
function showHudPanel(tile) {
  const hud = document.getElementById('hud-panel');
  document.getElementById('hud-name').innerText = tile.name;
  document.getElementById('hud-category').innerText = tile.category.toUpperCase() + ' MATERIAL';
  document.getElementById('hud-price').innerText = `AED ${tile.price_aed} / m²`;
  hud.classList.add('visible');
}

function hideHudPanel() {
  document.getElementById('hud-panel').classList.remove('visible');
}

// View Toggles
function toggleView(view) {
  currentView = view;
  
  // Update Buttons active classes
  document.getElementById('btn-view-galaxy').classList.toggle('active', view === 'galaxy');
  document.getElementById('btn-view-room').classList.toggle('active', view === 'room');

  // Toggle Visibility of Groups in Three.js
  if (galaxyGroup) galaxyGroup.visible = (view === 'galaxy');
  if (roomGroup) roomGroup.visible = (view === 'room');

  // Toggle HUD display
  document.getElementById('galaxy-physics-controls').style.display = (view === 'galaxy') ? 'flex' : 'none';
  document.getElementById('room-render-controls').style.display = (view === 'room') ? 'flex' : 'none';

  // Smooth cinematic camera transitions
  if (view === 'galaxy') {
    gsap.to(camera.position, { x: 0, y: 5, z: 25, duration: 1.5, ease: "power2.out" });
    controls.maxPolarAngle = Math.PI; // unlimited orbit
  } else {
    // Focus camera looking nicely down into the architectural room layout
    gsap.to(camera.position, { x: 4, y: 3, z: 9, duration: 1.8, ease: "power2.out" });
    controls.target.set(0, 0, -2);
    // Limit polar angle slightly to avoid looking under floor grid
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
  }
}

// Chat functions
function toggleChatWindow() {
  document.getElementById('chat-window').classList.toggle('open');
}

function sendQuickReply(text) {
  document.getElementById('chat-input-field').value = text;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input-field');
  const text = input.value.trim();
  if (!text) return;

  // Clear input
  input.value = '';

  // Append user bubble
  appendMessage(text, 'user');

  // Add dots thinking bubble
  const loaderId = appendMessage('typing...', 'noor');

  try {
    const response = await fetch('/api/noor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        selected_floor: activeFloorTile,
        selected_wall: activeWallTile
      })
    });
    const data = await response.json();
    
    // Remove dots bubble
    document.getElementById(loaderId).remove();
    
    if (data.success && data.reply) {
      appendMessage(data.reply, 'noor');
    } else {
      appendMessage("I apologize, my showroom link is currently resetting. Please try asking again shortly! 🙏", 'noor');
    }
  } catch (err) {
    document.getElementById(loaderId).remove();
    appendMessage("I apologize, I'm currently working offline. For any immediate enquiries, please request free samples! 🚚", 'noor');
  }
}

function appendMessage(text, sender) {
  const container = document.getElementById('chat-messages-container');
  const bubble = document.createElement('div');
  const id = `msg-${Date.now()}-${Math.random()}`;
  bubble.id = id;
  bubble.className = `msg msg-${sender}`;
  bubble.innerText = text;
  container.appendChild(bubble);
  
  // Auto scroll
  container.scrollTop = container.scrollHeight;
  return id;
}

// Modals Setup
function openSampleModal() {
  if (!activeFloorTile && !activeWallTile) {
    alert("Please select at least one floor or wall tile from the catalog first!");
    return;
  }
  updateUiSelections();
  document.getElementById('sample-modal').classList.add('active');
}

function closeSampleModal() {
  document.getElementById('sample-modal').classList.remove('active');
}

async function submitSampleRequest() {
  const name = document.getElementById('form-name').value.trim();
  const phone = document.getElementById('form-phone').value.trim();
  const emirate = document.getElementById('form-emirate').value;
  const address = document.getElementById('form-address').value.trim();

  if (!name || !phone) {
    alert("Please fill in your Name and Phone Number to request samples!");
    return;
  }

  try {
    const res = await fetch('/api/sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        phone: phone,
        emirate: emirate,
        address: address,
        floor_tile: activeFloorTile ? activeFloorTile.name : 'None Selected',
        wall_tile: activeWallTile ? activeWallTile.name : 'None Selected'
      })
    });
    const data = await res.json();
    if (data.success && data.whatsapp_link) {
      // Open wa.me link directly!
      window.open(data.whatsapp_link, '_blank');
      closeSampleModal();
    }
  } catch (err) {
    console.error("Error creating sample link:", err);
  }
}

let selectedAiStyle = 'palace';

function setAiStyle(style) {
  selectedAiStyle = style;
  
  // Toggle chips active states
  document.querySelectorAll('#ai-style-selector .room-chip').forEach(c => {
    c.classList.remove('active');
  });
  document.getElementById(`ai-style-${style}`).classList.add('active');
}

function generateAiRender() {
  const modal = document.getElementById('render-modal');
  const img = document.getElementById('render-img');
  const placeholder = document.getElementById('render-placeholder');
  const loader = document.getElementById('render-loader');
  const btnSave = document.getElementById('btn-save-render');
  const txtPrompt = document.getElementById('ai-custom-prompt');

  // Reset inputs & states
  txtPrompt.value = '';
  setAiStyle('palace');
  img.src = '';
  img.classList.remove('visible');
  placeholder.style.display = 'flex';
  loader.style.display = 'none';
  btnSave.style.display = 'none';

  // Set selected tile indicators
  const floorName = activeFloorTile ? activeFloorTile.name : 'Calacatta Gold';
  const floorColor = activeFloorTile ? activeFloorTile.hex_color : '#c9a96e';
  const wallName = activeWallTile ? activeWallTile.name : 'Nero Marquina';
  const wallColor = activeWallTile ? activeWallTile.hex_color : '#1a1a2e';

  document.getElementById('ai-floor-name').innerText = floorName;
  document.getElementById('ai-floor-swatch').style.backgroundColor = floorColor;
  document.getElementById('ai-wall-name').innerText = wallName;
  document.getElementById('ai-wall-swatch').style.backgroundColor = wallColor;

  modal.classList.add('active');
}

function closeRenderModal() {
  document.getElementById('render-modal').classList.remove('active');
}

async function executeAiRoomRender() {
  const loader = document.getElementById('render-loader');
  const loaderText = document.getElementById('render-loader-text');
  const placeholder = document.getElementById('render-placeholder');
  const img = document.getElementById('render-img');
  const btnSave = document.getElementById('btn-save-render');
  const customPrompt = document.getElementById('ai-custom-prompt').value.trim();

  placeholder.style.display = 'none';
  img.classList.remove('visible');
  loader.style.display = 'flex';
  btnSave.style.display = 'none';

  const floorName = activeFloorTile ? activeFloorTile.name : 'Calacatta Gold';
  const wallName = activeWallTile ? activeWallTile.name : 'Nero Marquina';

  // 1. First, attempt to contact backend HF Pipeline
  loaderText.innerText = "ENGAGING GENAI MODELS...";
  try {
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_type: selectedRoomType,
        floor_tile: floorName,
        wall_tile: wallName,
        custom_prompt: customPrompt,
        style_preset: selectedAiStyle
      })
    });
    const data = await res.json();

    if (data.success && !data.is_fallback) {
      // API Generation succeeded! Display the brand new custom image!
      const src = data.image_data || data.image_url;
      img.src = src;
      img.classList.add('visible');
      loader.style.display = 'none';
      btnSave.style.display = 'inline-block';
      return;
    }
  } catch (err) {
    console.warn("Outbound AI generation network restricted. Engaging Canvas Cladding Fallback...", err);
  }

  // 2. Outbound network failed or fallback triggered! Engage our high-fidelity, customized canvas-compositing cladding engine!
  loaderText.innerText = "COMPOSITING TEXTURES...";
  try {
    const dataUrl = await runCanvasCladding(
      selectedRoomType,
      activeFloorTile || { name: 'Calacatta Gold', hex_color: '#ffffff', roughness: 0.1, metalness: 0.05 },
      activeWallTile || { name: 'Nero Marquina', hex_color: '#111111', roughness: 0.2, metalness: 0.05 },
      selectedAiStyle,
      customPrompt
    );
    img.src = dataUrl;
    img.classList.add('visible');
    loader.style.display = 'none';
    btnSave.style.display = 'inline-block';
  } catch (canvasErr) {
    console.error("Cladding composite error:", canvasErr);
    loader.style.display = 'none';
    img.src = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80";
    img.classList.add('visible');
    btnSave.style.display = 'inline-block';
  }
}

function runCanvasCladding(roomType, floorTile, wallTile, stylePreset, customPrompt) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    const roomUrls = {
      bathroom: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
      living: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
      kitchen: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = roomUrls[roomType] || roomUrls.living;

    img.onload = function() {
      // 1. Draw base room template image
      ctx.drawImage(img, 0, 0, 800, 600);

      // Define perspective masks (polygons) for floor & walls
      let floorPolygon = [];
      let wallPolygon = [];

      if (roomType === 'bathroom') {
        floorPolygon = [[60, 470], [740, 470], [800, 600], [0, 600]];
        wallPolygon = [[0, 0], [800, 0], [800, 470], [0, 470]];
      } else if (roomType === 'kitchen') {
        floorPolygon = [[0, 440], [800, 440], [800, 600], [0, 600]];
        wallPolygon = [[0, 140], [800, 140], [800, 310], [0, 310]];
      } else { // living
        floorPolygon = [[0, 390], [800, 390], [800, 600], [0, 600]];
        wallPolygon = [[240, 80], [560, 80], [560, 390], [240, 390]];
      }

      // 2. Draw Floor Tile Cladding
      if (floorTile) {
        ctx.save();
        drawPolygon(ctx, floorPolygon);
        ctx.clip();
        const floorPat = createMarblePattern(floorTile.hex_color || '#c9a96e', floorTile.roughness || 0.1, true);
        ctx.fillStyle = floorPat;
        ctx.fill();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(img, 0, 0, 800, 600);
        ctx.restore();
      }

      // 3. Draw Wall Tile Cladding
      if (wallTile) {
        ctx.save();
        drawPolygon(ctx, wallPolygon);
        ctx.clip();
        const wallPat = createMarblePattern(wallTile.hex_color || '#1a1a28', wallTile.roughness || 0.2, false);
        ctx.fillStyle = wallPat;
        ctx.fill();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(img, 0, 0, 800, 600);
        ctx.restore();
      }

      // 4. Apply Atmospheric filters
      applyAtmosphereFilters(ctx, stylePreset, customPrompt);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = function() {
      // Fallback
      ctx.fillStyle = floorTile ? floorTile.hex_color : '#080810';
      ctx.fillRect(0, 0, 800, 600);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
  });
}

function drawPolygon(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) {
    ctx.lineTo(poly[i][0], poly[i][1]);
  }
  ctx.closePath();
}

function createMarblePattern(color, roughness, isFloor) {
  const patCanvas = document.createElement('canvas');
  patCanvas.width = 128;
  patCanvas.height = 128;
  const patCtx = patCanvas.getContext('2d');

  patCtx.fillStyle = color;
  patCtx.fillRect(0, 0, 128, 128);

  patCtx.strokeStyle = isDarkColor(color) ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';
  patCtx.lineWidth = 1;

  patCtx.beginPath();
  patCtx.moveTo(0, Math.random() * 128);
  patCtx.bezierCurveTo(40, Math.random() * 128, 80, Math.random() * 128, 128, Math.random() * 128);
  patCtx.stroke();

  patCtx.beginPath();
  patCtx.moveTo(Math.random() * 128, 0);
  patCtx.bezierCurveTo(Math.random() * 128, 40, Math.random() * 128, 80, Math.random() * 128, 128);
  patCtx.stroke();

  patCtx.strokeStyle = 'rgba(201, 169, 110, 0.28)';
  patCtx.beginPath();
  patCtx.moveTo(0, Math.random() * 128);
  patCtx.lineTo(128, Math.random() * 128);
  patCtx.stroke();

  patCtx.strokeStyle = isDarkColor(color) ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)';
  patCtx.lineWidth = 0.5;
  patCtx.strokeRect(0, 0, 128, 128);

  return patCtx.createPattern(patCanvas, 'repeat');
}

function isDarkColor(hex) {
  if (!hex || hex.charAt(0) !== '#') return false;
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  if (isNaN(rgb)) return false;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 100;
}

function applyAtmosphereFilters(ctx, stylePreset, customPrompt) {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;

  if (stylePreset === 'palace') {
    ctx.save();
    ctx.globalCompositeOperation = 'color-dodge';
    const grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w);
    grad.addColorStop(0, 'rgba(201, 169, 110, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 170, 0, 0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (stylePreset === 'penthouse') {
    ctx.save();
    ctx.globalCompositeOperation = 'hard-light';
    ctx.fillStyle = 'rgba(0, 50, 100, 0.08)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(100, 150, 255, 0.08)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (stylePreset === 'biophilic') {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(0, 200, 100, 0.06)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(255, 255, 230, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else if (stylePreset === 'minimalist') {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  if (customPrompt) {
    const lower = customPrompt.toLowerCase();
    if (lower.includes('candle') || lower.includes('warm') || lower.includes('twilight')) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(230, 140, 50, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else if (lower.includes('blue') || lower.includes('neon') || lower.includes('skylight')) {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(0, 100, 250, 0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }
}

function saveRenderedImage() {
  const img = document.getElementById('render-img');
  if (!img.src) return;

  const link = document.createElement('a');
  link.href = img.src;
  link.download = `al_noor_luxury_showroom_${selectedRoomType}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


