// 3D Room Showroom Viewer Controller
let roomGroup;
let floorMesh, wallBackMesh, wallLeftMesh;
let furnitureGroup;
let selectedRoomType = 'living';

// Current active material states
let activeFloorTile = null;
let activeWallTile = null;

function initRoomViewer() {
  roomGroup = new THREE.Group();
  scene.add(roomGroup);
  
  // Start initially hidden (since app opens in Galaxy view)
  roomGroup.visible = false;

  // 1. Create Floor Slab: 12m x 12m, thickness 0.1m
  const floorGeo = new THREE.BoxGeometry(12, 0.1, 12);
  const defaultFloorMat = new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.1, metalness: 0.2 });
  floorMesh = new THREE.Mesh(floorGeo, defaultFloorMat);
  floorMesh.position.y = -2;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // 2. Create Back Wall Slab: 12m width, 7m height, 0.1m thickness
  const wallBackGeo = new THREE.BoxGeometry(12, 7, 0.1);
  const defaultWallMat = new THREE.MeshStandardMaterial({ color: '#f0ece4', roughness: 0.2, metalness: 0.05 });
  wallBackMesh = new THREE.Mesh(wallBackGeo, defaultWallMat);
  wallBackMesh.position.set(0, 1.5, -6);
  wallBackMesh.receiveShadow = true;
  wallBackMesh.castShadow = true;
  roomGroup.add(wallBackMesh);

  // 3. Create Left Wall Slab: 0.1m width, 7m height, 12m length
  const wallLeftGeo = new THREE.BoxGeometry(0.1, 7, 12);
  wallLeftMesh = new THREE.Mesh(wallLeftGeo, defaultWallMat);
  wallLeftMesh.position.set(-6, 1.5, 0);
  wallLeftMesh.receiveShadow = true;
  wallLeftMesh.castShadow = true;
  roomGroup.add(wallLeftMesh);

  // 4. Luxury Gold Skirting / Trim Accent
  const trimGeo = new THREE.BoxGeometry(12, 0.15, 0.15);
  const trimMat = new THREE.MeshStandardMaterial({ color: '#c9a96e', roughness: 0.05, metalness: 0.9 });
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.set(0, -1.9, -5.9);
  roomGroup.add(trim);

  // Create sub-group for furniture items
  furnitureGroup = new THREE.Group();
  roomGroup.add(furnitureGroup);

  // Build the initial room set
  buildFurniture('living');
}

function updateRoomMaterial(tile, type) {
  // Use actual uploaded image texture if present, otherwise fallback to procedural veining
  let colorMap;
  const imgUrl = tile.image_url || tile.image;
  if (imgUrl) {
    const loader = new THREE.TextureLoader();
    colorMap = loader.load(imgUrl);
  } else {
    const isAccent = tile.category === 'accent';
    colorMap = generateProceduralTexture(tile.hex_color, isAccent);
  }
  
  // Tiling texture coordinates to simulate real tiles
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(4, 4);

  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    roughness: tile.roughness,
    metalness: tile.metalness,
    bumpMap: colorMap,
    bumpScale: 0.015,
    envMapIntensity: 1.2
  });

  if (type === 'floor') {
    activeFloorTile = tile;
    floorMesh.material = material;
  } else if (type === 'wall') {
    activeWallTile = tile;
    wallBackMesh.material = material;
    wallLeftMesh.material = material;
  }
  
  // Trigger UI changes if applicable
  updateUiSelections();
}

function setRoomType(type) {
  selectedRoomType = type;
  
  // Toggle chips active states
  document.querySelectorAll('.room-chip').forEach(c => c.classList.remove('active'));
  document.getElementById(`chip-${type}`).classList.add('active');

  // Build appropriate furniture set
  buildFurniture(type);
}

function buildFurniture(roomType) {
  // Clear previous furniture group
  while(furnitureGroup.children.length > 0) {
    furnitureGroup.remove(furnitureGroup.children[0]);
  }

  const woodMat = new THREE.MeshStandardMaterial({ color: '#331a00', roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#c9a96e', metalness: 0.8, roughness: 0.1 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: '#7a7a8a', roughness: 0.8 });

  if (roomType === 'living') {
    // 1. Sofa base
    const baseGeo = new THREE.BoxGeometry(6, 0.4, 2);
    const base = new THREE.Mesh(baseGeo, fabricMat);
    base.position.set(0, -1.75, -2);
    base.castShadow = true;
    base.receiveShadow = true;
    furnitureGroup.add(base);

    // Sofa backrest
    const backGeo = new THREE.BoxGeometry(6, 1.2, 0.4);
    const back = new THREE.Mesh(backGeo, fabricMat);
    back.position.set(0, -1.0, -2.8);
    back.castShadow = true;
    furnitureGroup.add(back);

    // Sofa arms (left and right)
    const armGeo = new THREE.BoxGeometry(0.4, 0.8, 2);
    const armL = new THREE.Mesh(armGeo, fabricMat);
    armL.position.set(-3.2, -1.4, -2);
    armL.castShadow = true;
    furnitureGroup.add(armL);
    
    const armR = armL.clone();
    armR.position.x = 3.2;
    furnitureGroup.add(armR);

    // 2. Modern Coffee Table
    const tableTopGeo = new THREE.BoxGeometry(2.4, 0.1, 1.2);
    const tableTopMat = new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.05, metalness: 0.5 });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.set(0, -1.6, 0.5);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    furnitureGroup.add(tableTop);

    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8);
    for (let x of [-1.0, 1.0]) {
      for (let z of [-0.4, 0.4]) {
        const leg = new THREE.Mesh(legGeo, goldMat);
        leg.position.set(x, -1.8, 0.5 + z);
        leg.castShadow = true;
        furnitureGroup.add(leg);
      }
    }

    // 3. Sleek Low TV Console
    const consoleGeo = new THREE.BoxGeometry(4.5, 0.6, 0.8);
    const tvConsole = new THREE.Mesh(consoleGeo, woodMat);
    tvConsole.position.set(0, -1.65, -5.3);
    tvConsole.castShadow = true;
    tvConsole.receiveShadow = true;
    furnitureGroup.add(tvConsole);

    // Flat TV
    const tvBaseGeo = new THREE.BoxGeometry(3.2, 1.8, 0.05);
    const tvScreenMat = new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.1 });
    const tv = new THREE.Mesh(tvBaseGeo, tvScreenMat);
    tv.position.set(0, -0.4, -5.3);
    tv.castShadow = true;
    furnitureGroup.add(tv);

    // 4. Modern Golden Floor Lamp
    const lampPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.5, 8);
    const pole = new THREE.Mesh(lampPoleGeo, goldMat);
    pole.position.set(2.8, -0.2, -4.5);
    pole.castShadow = true;
    furnitureGroup.add(pole);

    const shadeGeo = new THREE.CylinderGeometry(0.4, 0.6, 0.6, 16);
    const shadeMat = new THREE.MeshStandardMaterial({ color: '#f7edd5', roughness: 0.2 });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(2.8, 1.5, -4.5);
    shade.castShadow = true;
    furnitureGroup.add(shade);

  } else if (roomType === 'bathroom') {
    // 1. Luxury Modern Freestanding Bathtub
    const tubBaseGeo = new THREE.CylinderGeometry(1.6, 1.3, 1.1, 32);
    const tubMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1 });
    const tub = new THREE.Mesh(tubBaseGeo, tubMat);
    tub.position.set(0, -1.4, -2.5);
    tub.castShadow = true;
    tub.receiveShadow = true;
    furnitureGroup.add(tub);

    // Gold Faucet
    const faucetGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8);
    const faucet = new THREE.Mesh(faucetGeo, goldMat);
    faucet.position.set(0, -0.4, -3.9);
    faucet.castShadow = true;
    furnitureGroup.add(faucet);

    // 2. High-end floating Vanity
    const vanityGeo = new THREE.BoxGeometry(4.0, 0.6, 1.4);
    const vanityMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 });
    const vanity = new THREE.Mesh(vanityGeo, vanityMat);
    vanity.position.set(0, -1.0, -5.2);
    vanity.castShadow = true;
    furnitureGroup.add(vanity);

    // Gold Sink basins
    const sinkGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
    const sink1 = new THREE.Mesh(sinkGeo, goldMat);
    sink1.position.set(-1.0, -0.6, -5.2);
    furnitureGroup.add(sink1);

    const sink2 = sink1.clone();
    sink2.position.x = 1.0;
    furnitureGroup.add(sink2);

    // Floating mirror
    const mirrorGeo = new THREE.BoxGeometry(3.4, 1.6, 0.04);
    const mirrorMat = new THREE.MeshStandardMaterial({ color: '#bfbfbf', roughness: 0.01, metalness: 0.95 });
    const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirror.position.set(0, 0.8, -5.9);
    furnitureGroup.add(mirror);

  } else if (roomType === 'kitchen') {
    // 1. Main Double Kitchen Cabinets Array
    const cabGeo = new THREE.BoxGeometry(10, 3.2, 1.2);
    const cabMat = new THREE.MeshStandardMaterial({ color: '#eef1f6', roughness: 0.15 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, -0.4, -5.3);
    cab.castShadow = true;
    furnitureGroup.add(cab);

    // 2. Grand Central Island (with marble top slab)
    const islandBaseGeo = new THREE.BoxGeometry(4.8, 1.5, 2.0);
    const islandBase = new THREE.Mesh(islandBaseGeo, woodMat);
    islandBase.position.set(0, -1.25, -1.0);
    islandBase.castShadow = true;
    islandBase.receiveShadow = true;
    furnitureGroup.add(islandBase);

    // Marble Island Countertop
    const topGeo = new THREE.BoxGeometry(5.0, 0.15, 2.2);
    const counterMat = new THREE.MeshStandardMaterial({ color: '#fcfcfc', roughness: 0.05, metalness: 0.1 });
    const counterTop = new THREE.Mesh(topGeo, counterMat);
    counterTop.position.set(0, -0.42, -1.0);
    counterTop.castShadow = true;
    counterTop.receiveShadow = true;
    furnitureGroup.add(counterTop);

    // 3. Gold Pendant overhead lights
    const wireGeo = new THREE.CylinderGeometry(0.01, 0.01, 2.5, 8);
    const bulbGeo = new THREE.SphereGeometry(0.2, 16, 16);
    
    for (let offset of [-1.5, 1.5]) {
      const wire = new THREE.Mesh(wireGeo, goldMat);
      wire.position.set(offset, 2.25, -1.0);
      furnitureGroup.add(wire);

      const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffeecc' });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(offset, 1.0, -1.0);
      furnitureGroup.add(bulb);
    }
  }
}
