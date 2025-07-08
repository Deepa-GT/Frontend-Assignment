import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

// === Scene, Camera, Renderer ===
const canvas = document.getElementById('solar-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Center the camera on the Sun and set a good distance
camera.position.set(0, 40, 140);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.setPixelRatio(window.devicePixelRatio);

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xffffff, 2, 0, 2);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// === Background Stars ===
function createStarField(numStars = 800) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < numStars; i++) {
    // Place stars in a large sphere around the origin
    const r = 400 + Math.random() * 200;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions.push(x, y, z);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1.1 });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}
createStarField();

// === Texture Loader ===
const textureLoader = new THREE.TextureLoader();

// === Planet Data ===
const planetData = [
  {
    name: 'Mercury',
    size: 1.5,
    distance: 12,
    texture: 'image/mercury.jpg',
    speed: 1.0,
  },
  {
    name: 'Venus',
    size: 2.5,
    distance: 17,
    texture: 'image/venus.jpg',
    speed: 0.8,
  },
  {
    name: 'Earth',
    size: 2.7,
    distance: 23,
    texture: 'image/earth.jpg',
    speed: 0.7,
  },
  {
    name: 'Mars',
    size: 2.1,
    distance: 29,
    texture: 'image/mars.jpg',
    speed: 0.6,
  },
  {
    name: 'Jupiter',
    size: 6,
    distance: 38,
    texture: 'image/jupiter.jpg',
    speed: 0.4,
  },
  {
    name: 'Saturn',
    size: 5.2,
    distance: 48,
    texture: 'image/saturn.jpg',
    speed: 0.3,
    ring: {
      innerRadius: 6.2,
      outerRadius: 8.5,
      texture: 'image/saturn_ring.png',
    },
  },
  {
    name: 'Uranus',
    size: 4.2,
    distance: 58,
    texture: 'image/uranus.jpg',
    speed: 0.2,
    ring: {
      innerRadius: 4.8,
      outerRadius: 6.5,
      texture: 'image/uranus_ring.png',
    },
  },
  {
    name: 'Neptune',
    size: 4.0,
    distance: 66,
    texture: 'image/neptune.jpg',
    speed: 0.15,
  },
];

// === Sun ===
const sunTexture = textureLoader.load('image/sun.jpg');
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sunGeometry = new THREE.SphereGeometry(8, 48, 48);
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, 0);
scene.add(sun);

// === Planets and Orbits ===
const planets = [];
const orbitParents = [];
const planetSpeeds = {};

planetData.forEach((planet, idx) => {
  // Orbit parent (for revolution)
  const orbit = new THREE.Object3D();
  scene.add(orbit);
  orbitParents.push(orbit);

  // Planet mesh
  const texture = textureLoader.load(planet.texture);
  const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(planet.distance, 0, 0);
  orbit.add(mesh);
  planets.push(mesh);

  // Optional: Add rings for Saturn and Uranus
  if (planet.ring) {
    const ringTexture = textureLoader.load(planet.ring.texture);
    const ringGeometry = new THREE.RingGeometry(
      planet.ring.innerRadius,
      planet.ring.outerRadius,
      64
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(planet.distance, 0, 0);
    ring.rotation.x = -Math.PI / 2.2;
    orbit.add(ring);
  }

  // Initial speed
  planetSpeeds[planet.name] = planet.speed;
});

// === Orbit Visualization (optional, for clarity) ===
planetData.forEach((planet) => {
  const orbitGeometry = new THREE.RingGeometry(
    planet.distance - 0.05,
    planet.distance + 0.05,
    128
  );
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0x888888,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.2,
  });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.rotation.x = Math.PI / 2;
  scene.add(orbit);
});

// === Handle Window Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Always look at the center (Sun)
  camera.lookAt(0, 0, 0);
});

// === Speed Controls ===
planetData.forEach((planet) => {
  const slider = document.getElementById(`speed-${planet.name.toLowerCase()}`);
  const valSpan = document.getElementById(`val-${planet.name.toLowerCase()}`);
  if (slider && valSpan) {
    slider.value = planetSpeeds[planet.name];
    valSpan.textContent = planetSpeeds[planet.name].toFixed(2);
    slider.addEventListener('input', (e) => {
      planetSpeeds[planet.name] = parseFloat(slider.value);
      valSpan.textContent = slider.value;
    });
  }
});

// === Pause/Resume Animation ===
let isPaused = false;
const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
});

// === Raycaster for Hover Labels ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('planet-tooltip');
let mouseScreen = { x: 0, y: 0 };

canvas.addEventListener('mousemove', (event) => {
  // Calculate mouse position in normalized device coordinates
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  mouseScreen.x = event.clientX;
  mouseScreen.y = event.clientY;
});

function updateTooltip() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    const idx = planets.indexOf(intersects[0].object);
    if (idx !== -1) {
      tooltip.style.display = 'block';
      tooltip.textContent = planetData[idx].name;
      // Position tooltip near mouse
      tooltip.style.left = (mouseScreen.x + 12) + 'px';
      tooltip.style.top = (mouseScreen.y - 10) + 'px';
      return;
    }
  }
  tooltip.style.display = 'none';
}

// === Animation Loop ===
const clock = new THREE.Clock();

// === Camera Movement/Zoom on Planet Click ===
let cameraTarget = { x: 0, y: 40, z: 140 };
let cameraLookAt = { x: 0, y: 0, z: 0 };
let isFocusing = false;
let focusIdx = null;

// Add a button to return to default view
let backBtn = document.getElementById('back-btn');
if (!backBtn) {
  backBtn = document.createElement('button');
  backBtn.id = 'back-btn';
  backBtn.textContent = 'Back to Solar System';
  backBtn.style.display = 'none';
  backBtn.style.position = 'absolute';
  backBtn.style.top = '20px';
  backBtn.style.right = '20px';
  backBtn.style.zIndex = '1002';
  backBtn.style.padding = '8px 18px';
  backBtn.style.fontSize = '15px';
  backBtn.style.borderRadius = '8px';
  backBtn.style.border = 'none';
  backBtn.style.background = '#ffd700';
  backBtn.style.color = '#222';
  backBtn.style.cursor = 'pointer';
  document.body.appendChild(backBtn);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function animateCameraTo(target, lookAt, duration = 1.2) {
  isFocusing = true;
  let start = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  let startLook = { x: cameraLookAt.x, y: cameraLookAt.y, z: cameraLookAt.z };
  let t = 0;
  function step() {
    t += 1 / 60 / duration;
    if (t > 1) t = 1;
    camera.position.set(
      lerp(start.x, target.x, t),
      lerp(start.y, target.y, t),
      lerp(start.z, target.z, t)
    );
    cameraLookAt.x = lerp(startLook.x, lookAt.x, t);
    cameraLookAt.y = lerp(startLook.y, lookAt.y, t);
    cameraLookAt.z = lerp(startLook.z, lookAt.z, t);
    camera.lookAt(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      isFocusing = false;
    }
  }
  step();
}

canvas.addEventListener('click', (event) => {
  if (isFocusing) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    const idx = planets.indexOf(intersects[0].object);
    if (idx !== -1) {
      // Focus camera on this planet
      const planet = planets[idx];
      const worldPos = new THREE.Vector3();
      planet.getWorldPosition(worldPos);
      // Calculate direction from Sun (0,0,0) to planet
      const direction = worldPos.clone().normalize();
      // Set camera distance (planet size * factor + base offset)
      const camDistance = planetData[idx].size * 6 + 12;
      const camTarget = {
        x: worldPos.x + direction.x * camDistance,
        y: worldPos.y + direction.y * camDistance,
        z: worldPos.z + direction.z * camDistance
      };
      animateCameraTo(camTarget, { x: worldPos.x, y: worldPos.y, z: worldPos.z });
      backBtn.style.display = 'block';
      focusIdx = idx;
    }
  }
});

backBtn.addEventListener('click', () => {
  animateCameraTo({ x: 0, y: 40, z: 140 }, { x: 0, y: 0, z: 0 });
  backBtn.style.display = 'none';
  focusIdx = null;
});

function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    const delta = clock.getDelta();
    // Animate planet orbits
    planetData.forEach((planet, idx) => {
      const speed = planetSpeeds[planet.name];
      orbitParents[idx].rotation.y += delta * speed * 0.3; // 0.3 is a base speed factor
      // Planet self-rotation
      planets[idx].rotation.y += delta * 0.8;
    });
    // Sun slow rotation
    sun.rotation.y += delta * 0.1;
  }
  updateTooltip();
  camera.lookAt(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z);
  renderer.render(scene, camera);
}

animate();

// === Dark/Light Mode Toggle ===
const themeToggle = document.getElementById('theme-toggle');
let isLightMode = false;

function setTheme(light) {
  isLightMode = light;
  // UI colors
  document.body.style.background = light ? '#f4f4f4' : '#000';
  document.getElementById('control-panel').style.background = light ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,20,0.85)';
  document.getElementById('control-panel').style.color = light ? '#222' : '#fff';
  const fileWarning = document.getElementById('file-warning');
  if (fileWarning) fileWarning.style.background = light ? '#ffb347' : '#ff4444';
  const tooltip = document.getElementById('planet-tooltip');
  if (tooltip) {
    tooltip.style.background = light ? 'rgba(255,255,200,0.95)' : 'rgba(30,30,30,0.95)';
    tooltip.style.color = light ? '#222' : '#ffd700';
  }
  // 3D background
  scene.background = new THREE.Color(light ? 0xf4f4f4 : 0x000000);
  renderer.setClearColor(light ? 0xf4f4f4 : 0x000000, 1);
  // Button text
  themeToggle.textContent = light ? 'Dark Mode' : 'Light Mode';
}

setTheme(false); // Start in dark mode

themeToggle.addEventListener('click', () => {
  setTheme(!isLightMode);
});
