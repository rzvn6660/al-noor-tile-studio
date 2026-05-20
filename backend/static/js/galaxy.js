// Antigravity Tile Galaxy Controller
let tilesData = [];
let tileSlabs = []; // Group of all tile slab meshes
let galaxyGroup;
let raycaster, mouse;
let hoveredSlab = null;
let gravityOn = false;
let orbitOn = false;

// Configurable constants for physics
const GALAXY_BOUNDS = 15;

function initGalaxy(tiles) {
  tilesData = tiles;
  
  // Create a parent group for the galaxy to rotate/manipulate easily
  galaxyGroup = new THREE.Group();
  scene.add(galaxyGroup);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Create PBR slabs for all 30 tiles
  tilesData.forEach((tile, index) => {
    const slab = createTileSlab(tile, index);
    tileSlabs.push(slab);
    galaxyGroup.add(slab);
  });

  // Attach mouse event listeners
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onMouseClick);
}

function generateProceduralTexture(hexColor, isAccentVeining=true) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base background color
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, 512, 512);

  // Drawing elegant marble veins
  ctx.strokeStyle = hexColor === '#141414' || hexColor === '#0e0e0e' || hexColor === '#0a0a0a' ? '#c9a96e' : 'rgba(0,0,0,0.15)';
  if (hexColor.toLowerCase() === '#fafafa' || hexColor.toLowerCase() === '#fcfcfc') {
    ctx.strokeStyle = 'rgba(100,100,100,0.08)';
  }

  // Draw 5-10 elegant thin randomized marble vein paths
  const veinCount = isAccentVeining ? 8 : 4;
  for (let v = 0; v < veinCount; v++) {
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = 0;
    ctx.moveTo(x, y);
    
    ctx.lineWidth = Math.random() * 2.5 + 0.5;
    
    while (y < 512) {
      x += (Math.random() - 0.5) * 40;
      y += Math.random() * 60 + 10;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Soft polish overlay
  const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 300);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createTileSlab(tile, index) {
  // Slab geometry: 2.2m x 1.4m luxury slab, 0.08m thickness
  const geometry = new THREE.BoxGeometry(2.2, 3.4, 0.08);

  // Use uploaded image texture if present, otherwise fallback to elegant procedural veining
  let colorMap;
  const imgUrl = tile.image_url || tile.image;
  if (imgUrl) {
    const loader = new THREE.TextureLoader();
    colorMap = loader.load(imgUrl);
  } else {
    const isAccent = tile.category === 'accent';
    colorMap = generateProceduralTexture(tile.hex_color, isAccent);
  }
  
  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    roughness: tile.roughness,
    metalness: tile.metalness,
    bumpMap: colorMap,
    bumpScale: 0.02,
    envMapIntensity: 1.5
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Store tile metadata directly in mesh
  mesh.userData = {
    tile: tile,
    index: index,
    // Spawn in floating random zero-gravity positions
    floatOffset: Math.random() * 100,
    speedX: (Math.random() - 0.5) * 0.2,
    speedY: (Math.random() - 0.5) * 0.2,
    speedZ: (Math.random() - 0.5) * 0.2,
    targetPos: new THREE.Vector3(),
    basePos: new THREE.Vector3(
      (Math.random() - 0.5) * GALAXY_BOUNDS * 2,
      (Math.random() - 0.5) * GALAXY_BOUNDS + 2,
      (Math.random() - 0.5) * GALAXY_BOUNDS - 3
    )
  };

  mesh.position.copy(mesh.userData.basePos);
  
  // Random starting rotation
  mesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    0
  );

  return mesh;
}

function updateGalaxyPhysics(time) {
  if (currentView !== 'galaxy') return;

  tileSlabs.forEach(slab => {
    const meta = slab.userData;
    
    if (orbitOn) {
      // 1. Orbit Ring mode
      const angle = (time * 0.1) + (meta.index * (Math.PI * 2 / 30));
      const radius = 18;
      meta.targetPos.set(
        Math.cos(angle) * radius,
        Math.sin(time * 0.5 + meta.index) * 2 + 3,
        Math.sin(angle) * radius
      );
      slab.position.lerp(meta.targetPos, 0.03);
      slab.rotation.y = -angle + Math.PI / 2;
    } else if (gravityOn) {
      // 2. Heavy gravity collapse
      meta.targetPos.set(0, -5, 0);
      slab.position.lerp(meta.targetPos, 0.015);
      slab.rotation.x += 0.002;
    } else {
      // 3. Antigravity floating drifting mode
      const offset = meta.floatOffset;
      slab.position.x = meta.basePos.x + Math.sin(time * 0.4 + offset) * 1.2;
      slab.position.y = meta.basePos.y + Math.cos(time * 0.3 + offset) * 1.0;
      slab.position.z = meta.basePos.z + Math.sin(time * 0.2 + offset) * 0.8;

      slab.rotation.x += 0.001;
      slab.rotation.y += 0.002;
    }
  });
}

function onMouseMove(event) {
  // Translate mouse coordinate to normalized screen space
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (currentView !== 'galaxy') return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(tileSlabs);

  if (intersects.length > 0) {
    const slab = intersects[0].object;
    if (hoveredSlab !== slab) {
      // Reset old hover
      if (hoveredSlab) {
        gsap.to(hoveredSlab.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
        hoveredSlab.material.emissive.setHex(0x000000);
      }
      // Set new hover
      hoveredSlab = slab;
      gsap.to(slab.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.3 });
      
      // Light golden emissive glow
      slab.material.emissive.setHex(0x2d1a08);

      // Show HUD
      showHudPanel(slab.userData.tile);
    }
  } else {
    if (hoveredSlab) {
      gsap.to(hoveredSlab.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
      hoveredSlab.material.emissive.setHex(0x000000);
      hoveredSlab = null;
      hideHudPanel();
    }
  }
}

function onMouseClick() {
  if (currentView !== 'galaxy' || !hoveredSlab) return;

  // Settle active tile selection
  const tile = hoveredSlab.userData.tile;
  selectTile(tile);

  // Trigger Launch flight animation
  launchTileToRoom(hoveredSlab);
}

function launchTileToRoom(slab) {
  const tile = slab.userData.tile;
  
  // Gold shockwave sound or action ripple
  createLaunchShockwave(slab.position);

  // Animate tile flying out of screen towards the center room
  gsap.to(slab.position, {
    x: 0,
    y: 2,
    z: 0,
    duration: 1.2,
    ease: "power2.inOut",
    onComplete: () => {
      // Reset position back to galaxy space and update room
      gsap.to(slab.position, {
        x: slab.userData.basePos.x,
        y: slab.userData.basePos.y,
        z: slab.userData.basePos.z,
        duration: 0.8,
        delay: 0.5
      });
      // Switch view smoothly to the 3D room to watch the apply!
      toggleView('room');
    }
  });

  // Rapid rotation during travel
  gsap.to(slab.rotation, {
    x: Math.PI * 4,
    y: Math.PI * 4,
    duration: 1.2,
    ease: "power2.in"
  });
}

function createLaunchShockwave(pos) {
  const geo = new THREE.RingGeometry(0.1, 1, 32);
  const mat = new THREE.MeshBasicMaterial({ color: '#c9a96e', side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
  const ring = new THREE.Mesh(geo, mat);
  ring.position.copy(pos);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  gsap.to(ring.scale, {
    x: 8,
    y: 8,
    z: 8,
    duration: 1.0,
    ease: "power1.out",
    onComplete: () => scene.remove(ring)
  });
  
  gsap.to(mat, {
    opacity: 0,
    duration: 1.0
  });
}

// Controls
function toggleGravity() {
  gravityOn = !gravityOn;
  orbitOn = false;
  document.getElementById('btn-gravity').classList.toggle('active', gravityOn);
  document.getElementById('btn-orbit').classList.remove('active');
  document.getElementById('btn-gravity').innerHTML = gravityOn ? '<span>🚀</span> Gravity ON' : '<span>🚀</span> Gravity OFF';
}

function toggleOrbit() {
  orbitOn = !orbitOn;
  gravityOn = false;
  document.getElementById('btn-orbit').classList.toggle('active', orbitOn);
  document.getElementById('btn-gravity').classList.remove('active');
  document.getElementById('btn-orbit').innerHTML = orbitOn ? '<span>⭕</span> Orbit ON' : '<span>⭕</span> Orbit OFF';
}

function triggerExplode() {
  // Push all slabs outwards dramatically
  tileSlabs.forEach(slab => {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 35,
      (Math.random() - 0.5) * 15 + 2,
      (Math.random() - 0.5) * 25
    );
    
    gsap.to(slab.position, {
      x: dir.x,
      y: dir.y,
      z: dir.z,
      duration: 1.5,
      ease: "expo.out",
      onComplete: () => {
        // Return to float center
        if (!gravityOn && !orbitOn) {
          gsap.to(slab.position, {
            x: slab.userData.basePos.x,
            y: slab.userData.basePos.y,
            z: slab.userData.basePos.z,
            duration: 2.0,
            delay: 0.5,
            ease: "power1.inOut"
          });
        }
      }
    });
  });
}
