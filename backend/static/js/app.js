// Main App Orchestration Loop
const clock = new THREE.Clock();

window.addEventListener('load', () => {
  // 1. Initialize complete 3D Viewport Scene
  init3DScene();

  // 2. Initialize modular Room Showroom Slabs
  initRoomViewer();

  // 3. Start complete 60FPS Render loop
  animate();
});

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // 1. Update Floating Galaxy Drifts & Rotations
  updateGalaxyPhysics(elapsedTime);

  // 2. Animate Star systems and gold dust particle systems
  animateParticles(elapsedTime);

  // 3. Smooth Orbit controls damping update
  if (controls) {
    controls.update();
  }

  // 4. Render main viewport scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
