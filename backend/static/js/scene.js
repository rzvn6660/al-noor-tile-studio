// Global Showroom 3D Scene Controller
let scene, camera, renderer, controls;
let starsParticleSystem, goldDustParticleSystem;

function init3DScene() {
  const container = document.getElementById('canvas-container');

  // 1. Create Scene & Fog for Deep Space feeling
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#080810', 0.015);

  // 2. Camera Setup
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 25);

  // 3. Renderer Setup (enable shadow mapping & high precision)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // 4. Orbit Controls (restricted slightly for showroom feeling)
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 50;
  controls.minDistance = 2;

  // 5. Lighting Setup (Cinematic Gold & Space blue lights)
  const ambientLight = new THREE.AmbientLight('#121225', 0.8);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight('#c9a96e', 2.0); // Warm gold spotlight
  mainLight.position.set(10, 20, 15);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.bias = -0.001;
  scene.add(mainLight);

  const spaceBlueLight = new THREE.PointLight('#7ab8f5', 3.0, 50); // Soft cyan/blue fill
  spaceBlueLight.position.set(-15, -5, -10);
  scene.add(spaceBlueLight);

  // 6. Stars particle system
  createStars();

  // 7. Gold Dust floating particles
  createGoldDust();

  // Window resize hook
  window.addEventListener('resize', onWindowResize);
}

function createStars() {
  const count = 1500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 200;
    positions[i + 1] = (Math.random() - 0.5) * 200;
    positions[i + 2] = (Math.random() - 0.5) * 200;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.15,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  
  starsParticleSystem = new THREE.Points(geometry, material);
  scene.add(starsParticleSystem);
}

function createGoldDust() {
  const count = 300;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 60;
    positions[i + 1] = (Math.random() - 0.5) * 60;
    positions[i + 2] = (Math.random() - 0.5) * 60;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: '#c9a96e',
    size: 0.25,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });
  
  goldDustParticleSystem = new THREE.Points(geometry, material);
  scene.add(goldDustParticleSystem);
}

function animateParticles(time) {
  // Slow background stars rotation
  if (starsParticleSystem) {
    starsParticleSystem.rotation.y = time * 0.005;
  }
  
  // Drift gold dust
  if (goldDustParticleSystem) {
    goldDustParticleSystem.rotation.y = -time * 0.01;
    goldDustParticleSystem.rotation.x = time * 0.005;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
