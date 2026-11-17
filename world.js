import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = s => document.querySelector(s);
const root = document.documentElement;
const canvas = $('#world');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { location.replace('about.html'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1200);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const manager = new THREE.LoadingManager();
manager.onProgress = (u, l, t) => { $('#loadBar').style.transform = `scaleX(${l / t})`; };
manager.onLoad = () => setTimeout(() => document.body.classList.add('loaded'), 300);
const loader = new THREE.TextureLoader(manager);
const tex = src => { const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// ---------- terrain ----------
const R = 72;
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = t => t * t * (3 - 2 * t);
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  const u = smooth(xf), v = smooth(zf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, z) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, z * f); f *= 2; a *= 0.5; } return s; };
const sstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
function baseH(x, z) {
  const r = Math.hypot(x, z) / R, fall = 1 - sstep(0.62, 1.0, r);
  return (1.2 + fbm(x * 0.035 + 7, z * 0.035 + 3) * 6) * fall - 2.6 * (1 - fall);
}

const PLACES = [
  { id: 'about', name: 'About me', desc: 'Hi! Start here.', href: 'about.html', pos: [0, 10], r: 5 },
  { id: 'work', name: 'Work', desc: 'Cornell VC, WestLight, Stanford, PlateTale…', href: 'work.html', pos: [-30, -18], r: 7 },
  { id: 'projects', name: 'Projects', desc: 'My science-fair posters and research', href: 'projects.html', pos: [28, -20], r: 8 },
  { id: 'press', name: 'Press', desc: 'TEDx “Circles”, podcasts, articles', href: 'press.html', pos: [-30, 22], r: 8 },
  { id: 'service', name: 'Service', desc: 'Energizing Youth, UN youth group, honors', href: 'service.html', pos: [30, 22], r: 8 },
  { id: 'jewelry', name: 'Chiara Malia', desc: 'A wave, caught in gold', href: 'jewelry.html', pos: [2, -50], r: 7 },
];
PLACES.forEach(p => { p.h = Math.max(baseH(...p.pos), 0.9); });
function H(x, z) {
  let h = baseH(x, z);
  for (const p of PLACES) { const w = 1 - sstep(p.r, p.r + 6, Math.hypot(x - p.pos[0], z - p.pos[1])); h += (p.h - h) * w; }
  return h;
}

const tg = new THREE.PlaneGeometry(R * 2.6, R * 2.6, 180, 180);
tg.rotateX(-Math.PI / 2);
const tp = tg.attributes.position, cols = [];
const cSand = new THREE.Color('#e9d9b4'), cG1 = new THREE.Color('#a9cf7b'), cG2 = new THREE.Color('#6fa35b'), cRock = new THREE.Color('#a49c8e'), cWet = new THREE.Color('#cdb98f'), tmp = new THREE.Color();
for (let i = 0; i < tp.count; i++) {
  const x = tp.getX(i), z = tp.getZ(i), h = H(x, z);
  tp.setY(i, h);
  if (h < 0.15) tmp.copy(cWet); else if (h < 0.9) tmp.copy(cSand); else if (h < 3.2) tmp.copy(cG1).lerp(cG2, (h - 0.9) / 2.3); else if (h < 5.4) tmp.copy(cG2); else tmp.copy(cRock);
  tmp.offsetHSL(0, 0, (hash(x, z) - 0.5) * 0.04);
  cols.push(tmp.r, tmp.g, tmp.b);
}
tg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
tg.computeVertexNormals();
const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
terrain.receiveShadow = true;
scene.add(terrain);

// ---------- water ----------
const wg = new THREE.PlaneGeometry(900, 900, 110, 110);
wg.rotateX(-Math.PI / 2);
const wBase = wg.attributes.position.array.slice();
const waterMat = new THREE.MeshStandardMaterial({ color: '#4fb3cf', flatShading: true, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.88 });
const water = new THREE.Mesh(wg, waterMat);
water.position.y = -0.15;
water.receiveShadow = true;
scene.add(water);

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color('#7fb8e6') }, bottom: { value: new THREE.Color('#f4efe4') } };
scene.add(new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, uniforms: skyU,
  vertexShader: 'varying vec3 vP;void main(){vP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.);}',
  fragmentShader: 'uniform vec3 top;uniform vec3 bottom;varying vec3 vP;void main(){float h=normalize(vP).y;gl_FragColor=vec4(mix(bottom,top,pow(max(h,0.),.6)),1.);}'
})));
scene.fog = new THREE.Fog('#f4efe4', 90, 360);
const starsG = new THREE.BufferGeometry(), sp = [];
for (let i = 0; i < 1600; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.9 + 0.1); sp.push(600 * Math.sin(ph) * Math.cos(th), 600 * Math.cos(ph), 600 * Math.sin(ph) * Math.sin(th)); }
starsG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(starsG, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
scene.add(stars);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#8a9a6a', 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3df', 2.4);
sun.position.set(60, 90, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 260 });
sun.shadow.bias = -0.0004;
scene.add(sun);

// ---------- helpers ----------
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8, ...o });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m; }
const emissives = [];
function place(id) { const p = PLACES.find(q => q.id === id), g = new THREE.Group(); g.position.set(p.pos[0], p.h, p.pos[1]); g.lookAt(0, p.h, 0); scene.add(g); p.group = g; return g; }

// About: polaroid of me
{
  const g = place('about');
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 8), M('#6b5440'), 0, 1.5, 0, g);
  const frame = mesh(new THREE.BoxGeometry(3.6, 4.3, 0.12), M('#fbfaf6', { flatShading: false }), 0, 4.6, 0, g);
  frame.rotation.z = -0.06;
  const ph = mesh(new THREE.PlaneGeometry(3.1, 3.4), new THREE.MeshStandardMaterial({ map: tex('assets/portrait.jpg'), roughness: 0.6 }), 0, 0.3, 0.07, frame);
  ph.castShadow = false;
}
// Work: Cornell clock tower
{
  const g = place('work'), stone = M('#d6c7ad'), roof = M('#5f7d6b');
  mesh(new THREE.BoxGeometry(5, 1, 5), M('#bfae92'), 0, 0.5, 0, g);
  mesh(new THREE.BoxGeometry(3.6, 13, 3.6), stone, 0, 7.5, 0, g);
  mesh(new THREE.BoxGeometry(4.3, 3.4, 4.3), stone, 0, 15.5, 0, g);
  const r = mesh(new THREE.ConeGeometry(3.3, 5.5, 4), roof, 0, 19.9, 0, g); r.rotation.y = Math.PI / 4;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, f = new THREE.Group(); f.position.set(Math.sin(a) * 2.17, 15.5, Math.cos(a) * 2.17); f.rotation.y = a; g.add(f);
    mesh(new THREE.CircleGeometry(1.15, 32), new THREE.MeshStandardMaterial({ color: '#fbf6ea', emissive: '#ffd27a', emissiveIntensity: 0 }), 0, 0, 0.01, f).castShadow = false;
    emissives.push(f.children[0].material);
    mesh(new THREE.BoxGeometry(0.08, 0.8, 0.04), M('#222'), 0, 0.35, 0.05, f);
    const mh = mesh(new THREE.BoxGeometry(0.06, 1, 0.04), M('#222'), 0.3, 0.1, 0.06, f); mh.rotation.z = -1.1;
  }
  for (let i = 0; i < 6; i++) { const w = mesh(new THREE.BoxGeometry(0.7, 1.4, 0.1), new THREE.MeshStandardMaterial({ color: '#3a4652', emissive: '#ffcf7a', emissiveIntensity: 0 }), (i % 2 ? 0.8 : -0.8), 4 + Math.floor(i / 2) * 3.2, 1.81, g); emissives.push(w.material); }
}
// Projects: easels with real posters
{
  const g = place('projects'), wood = M('#7a5a3c');
  [['assets/ac-poster.jpg', -5.2, 0.35], ['assets/mof-poster.jpg', 0, 0], ['assets/h2-poster.jpg', 5.2, -0.35]].forEach(([src, x, ry]) => {
    const e = new THREE.Group(); e.position.set(x, 0, Math.abs(x) * 0.25); e.rotation.y = ry; g.add(e);
    [-1.4, 1.4].forEach(lx => { const l = mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 6), wood, lx, 2.4, 0, e); l.rotation.x = -0.12; });
    const back = mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.6, 6), wood, 0, 2.2, -1, e); back.rotation.x = 0.35;
    mesh(new THREE.BoxGeometry(4.6, 3.6, 0.1), M('#3b2d22'), 0, 3.6, 0.1, e);
    const t = tex(src);
    const pl = mesh(new THREE.PlaneGeometry(4.4, 3.4), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }), 0, 3.6, 0.16, e);
    pl.castShadow = false;
    mesh(new THREE.BoxGeometry(4.2, 0.12, 0.4), wood, 0, 1.75, 0.2, e);
  });
}
// Press: TEDx stage
{
  const g = place('press');
  mesh(new THREE.CylinderGeometry(6, 6.3, 0.8, 40), M('#6e4f37', { flatShading: false, roughness: 0.6 }), 0, 0.4, 0, g);
  mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.06, 40), M('#e62b1e', { flatShading: false }), 0, 0.83, 0.8, g);
  mesh(new THREE.BoxGeometry(9.4, 5.6, 0.3), M('#1d1d1f'), 0, 4.2, -3.6, g);
  const scr = mesh(new THREE.PlaneGeometry(8.8, 5), new THREE.MeshStandardMaterial({ map: tex('assets/yt-tedx.jpg'), emissive: '#ffffff', emissiveMap: null, emissiveIntensity: 0, roughness: 0.4 }), 0, 4.2, -3.43, g);
  scr.material.emissiveMap = scr.material.map; emissives.push(scr.material);
  [-4.6, 4.6].forEach(x => mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 8), M('#2a2a2a'), x, 3.5, -3.6, g));
  for (let i = 0; i < 9; i++) { const a = -0.7 + i * 0.175; mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), M('#b33a2e'), Math.sin(a) * 9.5, 0.45, 3 + Math.cos(a) * 3.2, g); }
}
// Service: solar schoolhouse + wind turbine
let blades;
{
  const g = place('service');
  mesh(new THREE.BoxGeometry(7, 4, 5.5), M('#f1e6cf'), 0, 2, 0, g);
  const roof = mesh(new THREE.CylinderGeometry(0.01, 4.6, 3, 4, 1), M('#a8553f'), 0, 5.5, 0, g); roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, 0.9);
  for (let i = 0; i < 3; i++) { const s = mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), M('#1f3b66', { metalness: 0.6, roughness: 0.25, flatShading: false }), -2.2 + i * 2.2, 5.2, 1.3, g); s.rotation.x = 0.55; }
  [-2, 2].forEach(x => { const w = mesh(new THREE.BoxGeometry(1.3, 1.3, 0.1), new THREE.MeshStandardMaterial({ color: '#435866', emissive: '#ffcf7a', emissiveIntensity: 0 }), x, 2.3, 2.76, g); emissives.push(w.material); });
  mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), M('#5b7b6a'), 0, 1.1, 2.76, g);
  const t = new THREE.Group(); t.position.set(7, 0, -2); g.add(t);
  mesh(new THREE.CylinderGeometry(0.18, 0.35, 12, 10), M('#f4f4f2', { flatShading: false }), 0, 6, 0, t);
  mesh(new THREE.BoxGeometry(0.7, 0.7, 1.4), M('#f4f4f2'), 0, 12.1, 0.2, t);
  blades = new THREE.Group(); blades.position.set(0, 12.1, 0.95); t.add(blades);
  for (let i = 0; i < 3; i++) { const b = mesh(new THREE.BoxGeometry(0.35, 5, 0.08), M('#ffffff', { flatShading: false }), 0, 2.5, 0); const p = new THREE.Group(); p.rotation.z = i * Math.PI * 2 / 3; p.add(b); blades.add(p); }
}
// Chiara Malia: gold wave sculpture
{
  const g = place('jewelry');
  const pts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 2.3, rr = 2.6 * (1 - t * 0.72); pts.push(new THREE.Vector3(-4 + t * 6 + Math.cos(a) * rr * 0.6, 1.4 + Math.sin(a) * rr + t * 1.6, Math.sin(t * 3) * 0.4)); }
  const gold = new THREE.MeshStandardMaterial({ color: '#d9a94c', metalness: 1, roughness: 0.22, envMapIntensity: 1.4 });
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.42, 20), gold, 0, 1.2, 0, g);
  mesh(new THREE.CylinderGeometry(2.2, 2.6, 1.2, 32), M('#f2ede2', { flatShading: false, roughness: 0.5 }), 0, 0.6, 0, g);
  for (let i = 0; i < 7; i++) mesh(new THREE.SphereGeometry(0.18 + Math.random() * 0.1, 12, 8), new THREE.MeshStandardMaterial({ color: '#8ec5ff', metalness: 0.2, roughness: 0.1 }), Math.cos(i) * 3.4, 0.25, Math.sin(i) * 3.4 + 0.5, g);
}

// ---------- trees, rocks, clouds ----------
function scatter(n, test) { const out = []; let guard = 0; while (out.length < n && guard++ < n * 40) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R * 0.95, x = Math.cos(a) * r, z = Math.sin(a) * r, h = H(x, z); if (test(x, z, h) && PLACES.every(p => Math.hypot(x - p.pos[0], z - p.pos[1]) > p.r + 5) && Math.hypot(x, z - 18) > 7) out.push([x, h, z]); } return out; }
{
  const spots = scatter(170, (x, z, h) => h > 1.1 && h < 6);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.28, 1.6, 6), M('#7a5638'), spots.length);
  const leaf = new THREE.InstancedMesh(new THREE.ConeGeometry(1.3, 3.2, 7), M('#4f8a4a'), spots.length);
  const leaf2 = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 2.4, 7), M('#5f9d55'), spots.length);
  const d = new THREE.Object3D();
  spots.forEach(([x, h, z], i) => { const s = 0.8 + Math.random() * 0.7, ry = Math.random() * 6;
    d.position.set(x, h + 0.8 * s, z); d.scale.setScalar(s); d.rotation.set(0, ry, 0); d.updateMatrix(); trunk.setMatrixAt(i, d.matrix);
    d.position.set(x, h + 2.9 * s, z); d.updateMatrix(); leaf.setMatrixAt(i, d.matrix);
    d.position.set(x, h + 4.2 * s, z); d.updateMatrix(); leaf2.setMatrixAt(i, d.matrix); });
  [trunk, leaf, leaf2].forEach(m => { m.castShadow = m.receiveShadow = true; scene.add(m); });
  const rs = scatter(40, (x, z, h) => h > 0.2 && h < 7);
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.8), M('#9d968a'), rs.length);
  rs.forEach(([x, h, z], i) => { d.position.set(x, h + 0.2, z); d.scale.set(0.6 + Math.random(), 0.4 + Math.random() * 0.5, 0.6 + Math.random()); d.rotation.set(Math.random(), Math.random() * 6, 0); d.updateMatrix(); rocks.setMatrixAt(i, d.matrix); });
  rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);
  const fl = scatter(260, (x, z, h) => h > 1 && h < 4.5), fcols = ['#f4c2d0', '#fff3b0', '#ffffff', '#c9b6f2'];
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16), new THREE.MeshStandardMaterial({ roughness: 0.7 }), fl.length);
  fl.forEach(([x, h, z], i) => { d.position.set(x, h + 0.15, z); d.scale.setScalar(1); d.rotation.set(0, 0, 0); d.updateMatrix(); flowers.setMatrixAt(i, d.matrix); flowers.setColorAt(i, new THREE.Color(fcols[i % 4])); });
  scene.add(flowers);
}
const clouds = [];
for (let i = 0; i < 10; i++) { const c = new THREE.Group(); for (let j = 0; j < 5; j++) mesh(new THREE.IcosahedronGeometry(3 + Math.random() * 2.5, 1), M('#ffffff', { roughness: 1 }), j * 3 - 6, Math.random() * 1.5, Math.random() * 3, c).castShadow = false; c.position.set(Math.random() * 300 - 150, 42 + Math.random() * 14, Math.random() * 260 - 130); c.userData.v = 1.5 + Math.random() * 2; scene.add(c); clouds.push(c); }

// ---------- me ----------
const me = new THREE.Group();
{
  const navy = M('#1f2a44', { flatShading: false, roughness: 0.6 }), skin = M('#f0c8a4', { flatShading: false, roughness: 0.7 }), hair = M('#3a2416', { flatShading: false, roughness: 0.55 });
  mesh(new THREE.CapsuleGeometry(0.42, 0.8, 6, 14), navy, 0, 1.0, 0, me);
  mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.6, 10), M('#2b2b30'), 0, 0.35, 0, me);
  mesh(new THREE.SphereGeometry(0.36, 20, 16), skin, 0, 1.95, 0.02, me);
  const hh = mesh(new THREE.SphereGeometry(0.4, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, 0, 2.0, -0.03, me);
  hh.rotation.x = -0.25;
  mesh(new THREE.BoxGeometry(0.72, 0.95, 0.22), hair, 0, 1.55, -0.28, me);
  mesh(new THREE.BoxGeometry(0.22, 0.08, 0.05), M('#ffffff'), 0, 1.25, 0.42, me);
  me.userData.arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * 0.52, 1.45, 0); me.add(a); mesh(new THREE.CapsuleGeometry(0.12, 0.55, 4, 8), navy, 0, -0.35, 0, a); mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.12, 10), M('#7fa4d8', { flatShading: false }), 0, -0.12, 0, a); return a; });
}
me.position.set(0, H(0, 18), 18);
scene.add(me);
const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.65, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }));
ring.rotation.x = -Math.PI / 2; scene.add(ring);

// ---------- labels ----------
const labels = $('#labels');
PLACES.forEach(p => { const el = document.createElement('button'); el.className = 'w-label'; el.innerHTML = `<span>${p.name}</span>`; el.onclick = () => travel(p); labels.appendChild(el); p.el = el; p.top = new THREE.Vector3(p.pos[0], p.h + (p.id === 'work' ? 24 : p.id === 'about' ? 8 : 9), p.pos[1]); });
const fast = $('#places');
PLACES.forEach(p => { const b = document.createElement('button'); b.textContent = p.name; b.onclick = () => travel(p); fast.appendChild(b); });

// ---------- controls ----------
const keys = {};
let target = null, yaw = Math.PI, pitch = 0.42, dist = 17, active = null, started = false;
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === 'Enter' && active) location.href = active.href; if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function travel(p) { const dx = -p.pos[0], dz = -p.pos[1], l = Math.hypot(dx, dz) || 1; target = new THREE.Vector3(p.pos[0] + dx / l * (p.r + 3), 0, p.pos[1] + dz / l * (p.r + 3)); start(); }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!down) return; yaw = down.yaw - (e.clientX - down.x) * 0.005; pitch = Math.min(1.2, Math.max(0.15, down.pitch + (e.clientY - down.y) * 0.003)); });
canvas.addEventListener('pointerup', e => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hitP = PLACES.find(p => ray.intersectObject(p.group, true).length);
    if (hitP) travel(hitP); else { const h = ray.intersectObject(terrain)[0]; if (h && h.point.y > 0.3) { target = h.point.clone(); ring.position.set(h.point.x, h.point.y + 0.05, h.point.z); ring.material.opacity = 0.9; start(); } }
  }
  down = null;
});
canvas.addEventListener('wheel', e => { dist = Math.min(34, Math.max(8, dist + e.deltaY * 0.01)); }, { passive: true });
function start() { if (!started) { started = true; document.body.classList.add('playing'); } }
$('#startBtn').onclick = start;

// ---------- day / night ----------
const day = { top: '#7fb8e6', bottom: '#f4efe4', water: '#4fb3cf', hemi: 0.9, sun: 2.4, sunC: '#fff3df', exp: 1.05 };
const night = { top: '#0b1430', bottom: '#27365a', water: '#1d4a6b', hemi: 0.22, sun: 0.45, sunC: '#a9c1ff', exp: 0.62 };
let nightK = root.dataset.theme === 'dark' ? 1 : 0, nightT = nightK;
new MutationObserver(() => { nightT = root.dataset.theme === 'dark' ? 1 : 0; }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
const cA = new THREE.Color(), cB = new THREE.Color();
function applySky(k) {
  skyU.top.value.copy(cA.set(day.top)).lerp(cB.set(night.top), k);
  skyU.bottom.value.copy(cA.set(day.bottom)).lerp(cB.set(night.bottom), k);
  scene.fog.color.copy(skyU.bottom.value);
  waterMat.color.copy(cA.set(day.water)).lerp(cB.set(night.water), k);
  hemi.intensity = day.hemi + (night.hemi - day.hemi) * k;
  sun.intensity = day.sun + (night.sun - day.sun) * k;
  sun.color.copy(cA.set(day.sunC)).lerp(cB.set(night.sunC), k);
  stars.material.opacity = k;
  renderer.toneMappingExposure = day.exp + (night.exp - day.exp) * k;
  hemi.groundColor.set(k > 0.5 ? '#1a2238' : '#8a9a6a');
  emissives.forEach(m => m.emissiveIntensity = k * (m.emissiveMap ? 1.2 : 2.2));
}
$('#theme').addEventListener('click', e => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark', apply = () => { root.dataset.theme = next; localStorage.setItem('theme', next); };
  if (!document.startViewTransition) return apply();
  const x = e.clientX, y = e.clientY, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.classList.add('theming'); nightK = nightT = next === 'dark' ? 1 : 0;
  const t = document.startViewTransition(() => { apply(); applySky(nightK); renderer.render(scene, camera); });
  t.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }));
  t.finished.finally(() => root.classList.remove('theming'));
});

// ---------- loop ----------
const clock = new THREE.Clock(), v3 = new THREE.Vector3(), camPos = new THREE.Vector3(), look = new THREE.Vector3(), prompt = $('#prompt');
let walk = 0, intro = 1;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
  // movement
  let mx = 0, mz = 0;
  if (keys.w || keys.arrowup) mz -= 1; if (keys.s || keys.arrowdown) mz += 1; if (keys.a || keys.arrowleft) mx -= 1; if (keys.d || keys.arrowright) mx += 1;
  const dir = new THREE.Vector3();
  if (mx || mz) { target = null; start(); dir.set(mx, 0, mz).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw - Math.PI); }
  else if (target) { dir.set(target.x - me.position.x, 0, target.z - me.position.z); if (dir.length() < 0.4) { target = null; dir.set(0, 0, 0); } else dir.normalize(); }
  const moving = dir.lengthSq() > 0;
  if (moving) {
    const nx = me.position.x + dir.x * 9 * dt, nz = me.position.z + dir.z * 9 * dt;
    if (H(nx, nz) > 0.35 && !PLACES.some(p => p.id !== 'about' && Math.hypot(nx - p.pos[0], nz - p.pos[1]) < p.r - 1.5)) { me.position.x = nx; me.position.z = nz; } else target = null;
    const ang = Math.atan2(dir.x, dir.z); let da = ang - me.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); me.rotation.y += da * Math.min(1, dt * 10);
    walk += dt * 11;
  } else walk *= 0.9;
  me.position.y = H(me.position.x, me.position.z) + Math.abs(Math.sin(walk)) * 0.12 * (moving ? 1 : 0);
  me.userData.arms.forEach((a, i) => a.rotation.x = Math.sin(walk + i * Math.PI) * (moving ? 0.7 : 0.05));
  ring.material.opacity *= 0.96;
  // camera
  intro += ((started ? 0 : 1) - intro) * Math.min(1, dt * 1.5);
  const d = dist + intro * 70, p = pitch + intro * 0.35, y = yaw + intro * t * 0.05;
  camPos.set(me.position.x + Math.sin(y) * Math.cos(p) * d, me.position.y + 2 + Math.sin(p) * d, me.position.z + Math.cos(y) * Math.cos(p) * d);
  camera.position.lerp(camPos, Math.min(1, dt * 4));
  look.lerp(v3.set(me.position.x, me.position.y + 2, me.position.z), Math.min(1, dt * 6));
  camera.lookAt(look);
  sun.position.set(me.position.x + 60, 90, me.position.z + 40); sun.target.position.copy(me.position); sun.target.updateMatrixWorld();
  // world animation
  const wp = wg.attributes.position;
  for (let i = 0; i < wp.count; i++) { const x = wBase[i * 3], z = wBase[i * 3 + 2]; wp.setY(i, Math.sin(x * 0.07 + t * 1.1) * 0.28 + Math.cos(z * 0.09 + t * 0.9) * 0.22); }
  wp.needsUpdate = true; wg.computeVertexNormals();
  if (blades) blades.rotation.z -= dt * 1.6;
  clouds.forEach(c => { c.position.x += c.userData.v * dt; if (c.position.x > 170) c.position.x = -170; });
  nightK += (nightT - nightK) * Math.min(1, dt * 2.5); applySky(nightK);
  // labels + proximity
  active = null;
  PLACES.forEach(pl => {
    v3.copy(pl.top).project(camera);
    const dd = Math.hypot(me.position.x - pl.pos[0], me.position.z - pl.pos[1]);
    const vis = v3.z < 1 && started;
    pl.el.style.transform = `translate(${(v3.x * 0.5 + 0.5) * innerWidth}px,${(-v3.y * 0.5 + 0.5) * innerHeight}px)`;
    pl.el.style.opacity = vis ? Math.max(0.25, Math.min(1, 1.6 - dd / 60)) : 0;
    pl.el.style.pointerEvents = vis ? 'auto' : 'none';
    if (dd < pl.r + 5.5) active = pl;
  });
  if (active) { prompt.classList.add('on'); $('#pTitle').textContent = active.name; $('#pDesc').textContent = active.desc; $('#pOpen').href = active.href; } else prompt.classList.remove('on');
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
applySky(nightK);
camera.position.set(0, 80, 110); look.set(0, 2, 18);
frame();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
