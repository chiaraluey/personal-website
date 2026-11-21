import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
await Promise.race([document.fonts.load('600 64px "Clash Display"'), new Promise(r => setTimeout(r, 1500))]).catch(() => {});

const $ = s => document.querySelector(s);
const root = document.documentElement;
const canvas = $('#world');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch (e) { location.replace('index.html'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1400);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

const manager = new THREE.LoadingManager();
manager.onProgress = (u, l, t) => { $('#loadBar').style.transform = `scaleX(${l / t})`; };
manager.onLoad = () => setTimeout(() => document.body.classList.add('loaded'), 300);
const texLoader = new THREE.TextureLoader(manager);
const tex = src => { const t = texLoader.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
texLoader.load('assets/portrait.jpg');

// ---------- noise / helpers ----------
const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
const sm = t => t * t * (3 - 2 * t);
function vnoise(x, z) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1), u = sm(xf), v = sm(zf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, z) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, z * f); f *= 2; a *= 0.5; } return s; };
const sstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
const LAKE = -3, GZ = -52, FALLS_X = 22;

// ---------- campus terrain: plateau, Libe Slope down to Cayuga Lake, Fall Creek gorge ----------
function H(x, z) {
  let h = 3 + (fbm(x * 0.04 + 5, z * 0.04 + 9) - 0.5) * 0.9;
  if (x < -46) h -= Math.pow((-46 - x) / 24, 1.35) * 8.5;
  const rr = Math.hypot(x * 0.8, z);
  if (rr > 92) h -= Math.pow((rr - 92) / 18, 1.4) * 8;
  const g = 1 - sstep(3.5, 8.5, Math.abs(z - GZ + Math.sin(x * 0.06) * 2));
  const floor = x > FALLS_X ? 0.6 : -6.5;
  h = h * (1 - g) + floor * g;
  return h;
}
const BRIDGE = { x: -6, z0: GZ - 10, z1: GZ + 10, y: 3.35 };
const onBridge = (x, z) => Math.abs(x - BRIDGE.x) < 1.35 && z > BRIDGE.z0 && z < BRIDGE.z1;
const walkH = (x, z) => onBridge(x, z) ? Math.max(H(x, z), BRIDGE.y) : H(x, z);

// quad + paths
const QUAD = { x0: -26, x1: 18, z0: -20, z1: 24 };
const SEGS = [];
const seg = (ax, az, bx, bz, w = 0.95) => SEGS.push([ax, az, bx, bz, w]);
seg(QUAD.x0, QUAD.z0, QUAD.x1, QUAD.z0); seg(QUAD.x1, QUAD.z0, QUAD.x1, QUAD.z1); seg(QUAD.x1, QUAD.z1, QUAD.x0, QUAD.z1); seg(QUAD.x0, QUAD.z1, QUAD.x0, QUAD.z0);
seg(QUAD.x0, QUAD.z0, QUAD.x1, QUAD.z1, 0.8); seg(QUAD.x1, QUAD.z0, QUAD.x0, QUAD.z1, 0.8); seg(-4, QUAD.z0, -4, QUAD.z1, 0.9);
seg(-4, QUAD.z0, BRIDGE.x, BRIDGE.z1 + 1, 1.1); seg(BRIDGE.x, BRIDGE.z0 - 1, BRIDGE.x, -80, 1.1);
function segDist(x, z, [ax, az, bx, bz]) { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - ax - t * dx, z - az - t * dz); }
const onPath = (x, z) => SEGS.some(s => segDist(x, z, s) < s[4]);
const inQuad = (x, z) => x > QUAD.x0 && x < QUAD.x1 && z > QUAD.z0 && z < QUAD.z1;

// ---------- places (each opens a page) ----------
const PLACES = [
  { id: 'tower', name: 'McGraw Tower', desc: 'Cornell · Cornell VC · Energy Transition Club', href: 'work.html#cornell', pos: [-37, -6], ly: 34, act: 'Ring the chimes' },
  { id: 'uris', name: 'Uris Library', desc: 'Work: WestLight, Shields Mobility, PlateTale, RE-volv, Stanford…', href: 'work.html#experience', pos: [-36, 9], ly: 13 },
  { id: 'goldwin', name: 'Goldwin Smith Hall', desc: 'About me', href: 'about.html', pos: [28, 2], ly: 13 },
  { id: 'duffield', name: 'Duffield Hall', desc: 'Projects & Research', href: 'projects.html', pos: [24, 38], ly: 12 },
  { id: 'bailey', name: 'Bailey Hall', desc: 'Press & talks: TEDx “Circles”, podcasts, articles', href: 'press.html', pos: [28, -32], ly: 17 },
  { id: 'straight', name: 'Willard Straight Hall', desc: 'Service: Energizing Youth, UN youth group, honors', href: 'service.html', pos: [-28, 36], ly: 16 },
  { id: 'johnson', name: 'Johnson Museum', desc: 'Art & design: Chiara Malia, my jewelry brand', href: 'jewelry.html', pos: [-30, -36], ly: 15 },
];
const BLOCK = [];
const SIGNS = { tower: 'CORNELL', uris: 'WORK', goldwin: 'ABOUT ME', duffield: 'PROJECTS & RESEARCH', bailey: 'PRESS', straight: 'SERVICE', johnson: 'CHIARA MALIA' };

// ---------- terrain mesh ----------
const SIZE = 300, SEG = 240;
const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
tg.rotateX(-Math.PI / 2);
const tp = tg.attributes.position, cols = [];
const C = c => new THREE.Color(c);
const cLawnA = C('#7fae55'), cLawnB = C('#74a44e'), cGrass = C('#86a957'), cPath = C('#cfc3a8'), cMud = C('#7b6a52'), cRock = C('#8e8577'), cSand = C('#bfb08e'), tmp = new THREE.Color();
for (let i = 0; i < tp.count; i++) {
  const x = tp.getX(i), z = tp.getZ(i), h = H(x, z);
  tp.setY(i, h);
  const gorge = Math.abs(z - GZ) < 9 && h < 2.4;
  if (gorge) tmp.copy(cRock).lerp(cMud, hash(x, z) * 0.5);
  else if (h < LAKE + 0.6) tmp.copy(cSand);
  else if (onPath(x, z)) tmp.copy(cPath);
  else if (inQuad(x, z)) tmp.copy(Math.floor((x + 100) / 2.2) % 2 ? cLawnA : cLawnB);
  else tmp.copy(cGrass).lerp(C('#a99a4f'), fbm(x * 0.08, z * 0.08) * 0.5);
  tmp.offsetHSL(0, 0, (hash(x * 3, z * 3) - 0.5) * 0.025);
  cols.push(tmp.r, tmp.g, tmp.b);
}
tg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
tg.computeVertexNormals();
const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
terrain.receiveShadow = true;
scene.add(terrain);

// ---------- Cayuga Lake + far hills ----------
const wg = new THREE.PlaneGeometry(1400, 1400, 120, 120); wg.rotateX(-Math.PI / 2);
const wBase = wg.attributes.position.array.slice();
const waterMat = new THREE.MeshStandardMaterial({ color: '#5f9fc2', flatShading: true, roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.9 });
const water = new THREE.Mesh(wg, waterMat); water.position.y = LAKE; water.receiveShadow = true; scene.add(water);
const upper = new THREE.Mesh(new THREE.PlaneGeometry(80, 9), waterMat); upper.rotation.x = -Math.PI / 2; upper.position.set(FALLS_X + 40, 1.1, GZ); scene.add(upper);
{
  const hills = new THREE.Group();
  for (let i = 0; i < 14; i++) { const r = 40 + Math.random() * 40, m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: i % 3 ? '#7d8a52' : '#9a7a45', flatShading: true, roughness: 1 })); m.scale.y = 0.35 + Math.random() * 0.2; m.position.set(-300 - Math.random() * 60, LAKE - 2, -420 + i * 64); hills.add(m); }
  scene.add(hills);
}

// ---------- sky, fog, stars ----------
const skyU = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: skyU,
  vertexShader: 'varying vec3 vP;void main(){vP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.);}',
  fragmentShader: 'uniform vec3 top;uniform vec3 bottom;varying vec3 vP;void main(){float h=normalize(vP).y;gl_FragColor=vec4(mix(bottom,top,pow(max(h,0.),.55)),1.);}' })));
scene.fog = new THREE.Fog('#f1e6d6', 80, 420);
const starsG = new THREE.BufferGeometry(), sp = [];
for (let i = 0; i < 1800; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.9 + 0.1); sp.push(700 * Math.sin(ph) * Math.cos(th), 700 * Math.cos(ph), 700 * Math.sin(ph) * Math.sin(th)); }
starsG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(starsG, new THREE.PointsMaterial({ color: '#fff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
scene.add(stars);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#8a8a5a', 0.85); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe7c4', 2.5);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 260 });
sun.shadow.bias = -0.0004; scene.add(sun); scene.add(sun.target);

// ---------- material + mesh helpers ----------
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; (parent || scene).add(m); return m; }
const glow = [];
const win = () => { const m = new THREE.MeshStandardMaterial({ color: '#2f3a44', emissive: '#ffcf86', emissiveIntensity: 0, roughness: 0.3, metalness: 0.2 }); glow.push(m); return m; };
const stone = M('#bdb3a3'), stoneD = M('#a89e8e'), slate = M('#5a5f66', { roughness: 0.7 }), copper = M('#6f9583', { metalness: 0.35, roughness: 0.5 }), cream = M('#e7dccb'), white = M('#f1ede4');
function prism(w, d, rh, mat, x, y, z, parent) {
  const sh = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, rh)]);
  const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(-w / 2, 0, 0);
  return mesh(g, mat, x, y, z, parent);
}
function building(id, rotQ, w, d) {
  const p = PLACES.find(q => q.id === id), g = new THREE.Group(), y = H(...p.pos);
  g.position.set(p.pos[0], y - 0.2, p.pos[1]); g.rotation.y = rotQ * Math.PI / 2; scene.add(g); p.group = g; p.y = y;
  const [hw, hd] = rotQ % 2 ? [d / 2, w / 2] : [w / 2, d / 2];
  BLOCK.push({ x0: p.pos[0] - hw, x1: p.pos[0] + hw, z0: p.pos[1] - hd, z1: p.pos[1] + hd });
  const f = new THREE.Vector3(0, 0, d / 2 + 3).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
  p.door = [p.pos[0] + f.x, p.pos[1] + f.z];
  return g;
}
function windows(g, w, h, z, rows, y0 = 1.6, tall = 1.5) { const n = Math.max(2, Math.floor(w / 2.3)); for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) mesh(new THREE.BoxGeometry(0.85, tall, 0.12), win(), -w / 2 + (i + 0.5) * w / n, y0 + r * (tall + 1), z, g).castShadow = false; }
function gothic(g, w, d, h, opts = {}) {
  mesh(new THREE.BoxGeometry(w, h, d), opts.mat || stone, 0, h / 2, 0, g);
  mesh(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), stoneD, 0, 0.25, 0, g);
  prism(w, d + 0.6, opts.roof || d * 0.45, slate, 0, h, 0, g);
  const rows = Math.max(1, Math.floor((h - 1) / 2.6));
  windows(g, w, h, d / 2 + 0.03, rows); windows(g, w, h, -d / 2 - 0.03, rows);
  mesh(new THREE.BoxGeometry(1.8, 2.6, 0.2), M('#4a3a2c'), 0, 1.3, d / 2 + 0.08, g);
  mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 16, 1, false, 0, Math.PI), M('#4a3a2c'), 0, 2.6, d / 2 + 0.08, g).rotation.x = Math.PI / 2;
  (opts.towers || []).forEach(([x, z, th]) => { mesh(new THREE.BoxGeometry(2, th, 2), stone, x, th / 2, z, g); const c = mesh(new THREE.ConeGeometry(1.6, 2.6, 4), slate, x, th + 1.3, z, g); c.rotation.y = Math.PI / 4; });
}
function classical(g, w, d, h, cols, dome) {
  mesh(new THREE.BoxGeometry(w, h, d), cream, 0, h / 2, 0, g);
  mesh(new THREE.BoxGeometry(w + 0.6, 0.6, d + 0.6), white, 0, 0.3, 0, g);
  mesh(new THREE.BoxGeometry(w + 0.4, 0.7, d + 0.4), white, 0, h + 0.35, 0, g);
  windows(g, w, h, d / 2 + 0.03, Math.floor(h / 3), 1.8, 1.8);
  const pw = Math.min(w * 0.6, cols * 1.6), pd = 3.2;
  mesh(new THREE.BoxGeometry(pw + 0.8, 0.5, pd + 0.6), white, 0, 0.25, d / 2 + pd / 2, g);
  for (let i = 0; i < cols; i++) mesh(new THREE.CylinderGeometry(0.32, 0.36, h - 0.6, 14), white, -pw / 2 + (i + 0.5) * pw / cols, (h - 0.6) / 2 + 0.5, d / 2 + pd - 0.5, g);
  mesh(new THREE.BoxGeometry(pw + 0.8, 0.7, pd + 0.4), white, 0, h + 0.1, d / 2 + pd / 2, g);
  const ped = prism(pd + 0.4, pw + 0.8, 1.6, white, 0, h + 0.45, d / 2 + pd / 2, g); ped.rotation.y = Math.PI / 2;
  if (dome) { mesh(new THREE.CylinderGeometry(dome * 0.9, dome, 1.6, 32), cream, 0, h + 1.5, -d * 0.1, g); mesh(new THREE.SphereGeometry(dome * 0.92, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), copper, 0, h + 2.3, -d * 0.1, g); mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.2, 12), white, 0, h + 2.3 + dome * 0.92, -d * 0.1, g); }
  prism(w, d, 1.4, slate, 0, h + 0.7, 0, g);
}

// ---------- buildings ----------
// McGraw Tower
{
  const g = building('tower', 1, 5.4, 5.4), tr = M('#ada391');
  mesh(new THREE.BoxGeometry(5.4, 1.2, 5.4), tr, 0, 0.6, 0, g);
  mesh(new THREE.BoxGeometry(3.6, 18, 3.6), stone, 0, 10, 0, g);
  [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(0.55, 18.6, 0.55), tr, x, 9.9, z, g));
  [19.2, 23.2, 26.6].forEach((y, i) => mesh(new THREE.BoxGeometry(4.4 - i * 0.25, 0.4, 4.4 - i * 0.25), tr, 0, y, 0, g));
  mesh(new THREE.BoxGeometry(4.0, 3.6, 4.0), stone, 0, 21.2, 0, g);
  mesh(new THREE.BoxGeometry(3.7, 3.2, 3.7), stone, 0, 24.9, 0, g);
  mesh(new THREE.CylinderGeometry(1.7, 1.9, 2.4, 8), stone, 0, 28, 0, g);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; mesh(new THREE.BoxGeometry(0.25, 2.8, 0.25), tr, Math.sin(a) * 1.85, 28.3, Math.cos(a) * 1.85, g); }
  mesh(new THREE.ConeGeometry(1.85, 6.8, 8), copper, 0, 32.6, 0, g);
  mesh(new THREE.SphereGeometry(0.22, 12, 8), M('#d9a94c', { metalness: 1, roughness: 0.3 }), 0, 36.1, 0, g);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, f = new THREE.Group(); f.position.set(Math.sin(a) * 2.02, 21.2, Math.cos(a) * 2.02); f.rotation.y = a; g.add(f);
    const face = mesh(new THREE.CircleGeometry(1.3, 40), new THREE.MeshStandardMaterial({ color: '#f8f2e4', emissive: '#ffd58a', emissiveIntensity: 0 }), 0, 0, 0.02, f); face.castShadow = false; glow.push(face.material);
    mesh(new THREE.TorusGeometry(1.3, 0.08, 8, 40), M('#2e2e2e'), 0, 0, 0.03, f);
    mesh(new THREE.BoxGeometry(0.08, 0.85, 0.04), M('#222'), 0, 0.36, 0.06, f);
    const mh = mesh(new THREE.BoxGeometry(0.06, 1.1, 0.04), M('#222'), 0.33, 0.12, 0.07, f); mh.rotation.z = -1.1;
    const bel = new THREE.Group(); bel.position.set(Math.sin(a) * 1.86, 24.9, Math.cos(a) * 1.86); bel.rotation.y = a; g.add(bel);
    [-0.85, 0.85].forEach(x => { const m = win(); mesh(new THREE.BoxGeometry(0.95, 2, 0.1), m, x, -0.2, 0.02, bel); mesh(new THREE.CylinderGeometry(0.475, 0.475, 0.1, 16, 1, false, 0, Math.PI), m, x, 0.8, 0.02, bel).rotation.x = Math.PI / 2; });
  }
  for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(0.55, 1.2, 0.1), win(), 0, 3.5 + i * 1.9, 1.82, g).castShadow = false;
}
gothic(building('uris', 1, 14, 8), 14, 8, 7.5, { towers: [[-6.2, 3.2, 10]] });
classical(building('goldwin', 3, 22, 9), 22, 9, 7, 8, 0);
classical(building('bailey', 2, 14, 12), 14, 12, 8, 6, 5.2);
gothic(building('straight', 2, 16, 9), 16, 9, 8, { towers: [[0, 4.6, 13]], mat: M('#b8ae9c') });
// Johnson Museum: brutalist frame
{
  const g = building('johnson', 1, 16, 10), conc = M('#c3bfb6', { roughness: 0.95 }), dark = win();
  mesh(new THREE.BoxGeometry(7, 7, 10), conc, -4.5, 3.5, 0, g);
  mesh(new THREE.BoxGeometry(3, 11, 10), conc, 6.5, 5.5, 0, g);
  mesh(new THREE.BoxGeometry(16, 3.4, 10.5), conc, 0, 9.7, 0, g);
  mesh(new THREE.BoxGeometry(9, 5, 0.1), dark, -4.5, 3.4, 5.06, g);
  mesh(new THREE.BoxGeometry(14, 1.2, 0.1), dark, 0, 9.7, 5.31, g);
  mesh(new THREE.BoxGeometry(10, 2.4, 6), conc, -3, 12.6, -1, g);
}
// Duffield Hall: modern glass on the Engineering Quad
{
  const g = building('duffield', 2, 18, 10), glass = new THREE.MeshStandardMaterial({ color: '#9fc4d8', metalness: 0.6, roughness: 0.08, transparent: true, opacity: 0.75, emissive: '#ffd9a0', emissiveIntensity: 0 });
  glow.push(glass);
  mesh(new THREE.BoxGeometry(18, 7, 10), M('#c9c2b5'), 0, 3.5, -0.6, g);
  mesh(new THREE.BoxGeometry(12, 7.6, 0.2), glass, -2, 3.8, 4.5, g);
  for (let i = 0; i < 7; i++) mesh(new THREE.BoxGeometry(0.12, 7.6, 0.3), M('#e9e6df'), -8 + i * 2, 3.8, 4.6, g);
  const roof = mesh(new THREE.BoxGeometry(12, 0.3, 6), glass, -2, 7.8, 1.6, g); roof.rotation.x = 0.12;
  mesh(new THREE.BoxGeometry(5, 9, 10), M('#bdb3a3'), 6.5, 4.5, -0.6, g);
}
// statues: A.D. White and Ezra Cornell face each other across the quad
[[-4, -14, 0], [-4, 18, Math.PI]].forEach(([x, z, r]) => {
  const g = new THREE.Group(); g.position.set(x, H(x, z), z); g.rotation.y = r; scene.add(g);
  const bronze = M('#5f5135', { metalness: 0.7, roughness: 0.45 });
  mesh(new THREE.BoxGeometry(1.6, 1.8, 1.6), M('#9b968c'), 0, 0.9, 0, g);
  mesh(new THREE.CapsuleGeometry(0.42, 1.1, 6, 12), bronze, 0, 2.7, 0, g);
  mesh(new THREE.SphereGeometry(0.3, 14, 10), bronze, 0, 3.75, 0, g);
  BLOCK.push({ x0: x - 0.9, x1: x + 0.9, z0: z - 0.9, z1: z + 0.9 });
});
// suspension bridge over Fall Creek gorge
{
  const g = new THREE.Group(); scene.add(g); const steel = M('#3c4148', { metalness: 0.6, roughness: 0.4 }), deck = M('#8a7356');
  for (let z = BRIDGE.z0; z < BRIDGE.z1; z += 0.6) mesh(new THREE.BoxGeometry(2.6, 0.12, 0.52), deck, BRIDGE.x, BRIDGE.y - 0.06, z + 0.3, g);
  const cable = side => { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30, z = BRIDGE.z0 + t * (BRIDGE.z1 - BRIDGE.z0); pts.push(new THREE.Vector3(BRIDGE.x + side * 1.3, BRIDGE.y + 1.2 + Math.pow(2 * t - 1, 2) * 3.2, z)); } return pts; };
  [-1, 1].forEach(s => {
    const pts = cable(s); mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.06, 6), steel, 0, 0, 0, g);
    mesh(new THREE.BoxGeometry(0.06, 0.06, BRIDGE.z1 - BRIDGE.z0), steel, BRIDGE.x + s * 1.3, BRIDGE.y + 1, (BRIDGE.z0 + BRIDGE.z1) / 2, g);
    pts.forEach((p, i) => { if (i % 2) return; const len = p.y - BRIDGE.y; mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 4), steel, p.x, BRIDGE.y + len / 2, p.z, g); });
    [BRIDGE.z0, BRIDGE.z1].forEach(z => mesh(new THREE.BoxGeometry(0.35, 5, 0.35), steel, BRIDGE.x + s * 1.3, BRIDGE.y + 2.4, z, g));
  });
}
// waterfall
const fallTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.6})`; x.fillRect(Math.random() * 64, Math.random() * 256, 1 + Math.random() * 3, 20 + Math.random() * 60); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t; })();
const fall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.6), new THREE.MeshStandardMaterial({ color: '#e9f6fb', map: fallTex, transparent: true, opacity: 0.85, roughness: 0.2, emissive: '#bfe6f5', emissiveIntensity: 0.15 }));
fall.position.set(FALLS_X - 0.2, (1.1 + LAKE) / 2, GZ); fall.rotation.y = -Math.PI / 2; scene.add(fall);

// ---------- trees (autumn), lamps ----------
const blocked = (x, z, pad) => BLOCK.some(b => x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad);
function scatter(n, test) { const out = []; let guard = 0; while (out.length < n && guard++ < n * 60) { const x = (Math.random() - 0.5) * 220, z = (Math.random() - 0.5) * 220, h = H(x, z); if (test(x, z, h)) out.push([x, h, z]); } return out; }
const okGround = (x, z, h) => h > LAKE + 1 && Math.abs(z - GZ) > 9 && !blocked(x, z, 3) && !onPath(x, z) && Math.hypot(x * 0.8, z) < 100;
{
  const spots = scatter(260, (x, z, h) => okGround(x, z, h) && (!inQuad(x, z) || x < QUAD.x0 + 3 || x > QUAD.x1 - 3 || z < QUAD.z0 + 3 || z > QUAD.z1 - 3));
  const leafCols = ['#d9772b', '#c2452d', '#e3b23c', '#b5622a', '#8a9b3c', '#e08a3a'];
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 3, 7), M('#5e4630'), spots.length);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.9, 1), M('#ffffff', { flatShading: true, roughness: 0.9 }), spots.length);
  const crown2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.4, 1), M('#ffffff', { flatShading: true, roughness: 0.9 }), spots.length);
  const d = new THREE.Object3D(), c = new THREE.Color();
  spots.forEach(([x, h, z], i) => {
    const s = 0.8 + Math.random() * 0.8; d.rotation.set(0, Math.random() * 6, 0);
    d.position.set(x, h + 1.5 * s, z); d.scale.setScalar(s); d.updateMatrix(); trunk.setMatrixAt(i, d.matrix);
    d.position.set(x, h + 3.9 * s, z); d.scale.set(s * 1.1, s * 0.95, s * 1.1); d.updateMatrix(); crown.setMatrixAt(i, d.matrix);
    d.position.set(x + 0.7 * s, h + 5.1 * s, z - 0.3 * s); d.scale.setScalar(s); d.updateMatrix(); crown2.setMatrixAt(i, d.matrix);
    c.set(leafCols[Math.floor(Math.random() * leafCols.length)]); crown.setColorAt(i, c); c.offsetHSL(0, 0, 0.05); crown2.setColorAt(i, c);
  });
  [trunk, crown, crown2].forEach(m => { m.castShadow = m.receiveShadow = true; scene.add(m); });
  const lampPts = []; SEGS.slice(0, 4).forEach(([ax, az, bx, bz]) => { const L = Math.hypot(bx - ax, bz - az); for (let t = 4; t < L; t += 9) lampPts.push([ax + (bx - ax) * t / L + 1.3, az + (bz - az) * t / L + 1.3]); });
  const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.1, 3.4, 6), M('#26292d'), lampPts.length);
  const headMat = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffd08a', emissiveIntensity: 0.1 }); glow.push(headMat);
  const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 12, 8), headMat, lampPts.length);
  lampPts.forEach(([x, z], i) => { const h = H(x, z); d.rotation.set(0, 0, 0); d.scale.setScalar(1); d.position.set(x, h + 1.7, z); d.updateMatrix(); post.setMatrixAt(i, d.matrix); d.position.set(x, h + 3.5, z); d.updateMatrix(); head.setMatrixAt(i, d.matrix); });
  post.castShadow = true; scene.add(post, head);
}
// falling leaves around the player
const LEAF_N = 260, leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.16), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }), LEAF_N);
const leafData = [];
{ const c = new THREE.Color(), lc = ['#d9772b', '#c2452d', '#e3b23c', '#b5622a']; for (let i = 0; i < LEAF_N; i++) { leafData.push({ x: (Math.random() - 0.5) * 60, y: Math.random() * 14, z: (Math.random() - 0.5) * 60, s: Math.random() * 6, v: 0.6 + Math.random() * 0.8 }); leaves.setColorAt(i, c.set(lc[i % 4])); } scene.add(leaves); }

// ---------- me ----------
const me = new THREE.Group();
{
  const navy = M('#1f2a44', { roughness: 0.6 }), skin = M('#f0c8a4', { roughness: 0.7 }), hair = M('#3a2416', { roughness: 0.55 });
  mesh(new THREE.CapsuleGeometry(0.42, 0.8, 6, 14), navy, 0, 1.0, 0, me);
  mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.6, 10), M('#2b2b30'), 0, 0.35, 0, me);
  mesh(new THREE.SphereGeometry(0.36, 20, 16), skin, 0, 1.95, 0.02, me);
  const hh = mesh(new THREE.SphereGeometry(0.4, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), hair, 0, 2.0, -0.03, me); hh.rotation.x = -0.25;
  mesh(new THREE.BoxGeometry(0.72, 0.95, 0.22), hair, 0, 1.55, -0.28, me);
  mesh(new THREE.BoxGeometry(0.22, 0.08, 0.05), M('#ffffff'), 0, 1.25, 0.42, me);
  me.userData.arms = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * 0.52, 1.45, 0); me.add(a); mesh(new THREE.CapsuleGeometry(0.12, 0.55, 4, 8), navy, 0, -0.35, 0, a); mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.12, 10), M('#7fa4d8'), 0, -0.12, 0, a); return a; });
}
const body = new THREE.Group(); body.position.y = 1; [...me.children].forEach(c => { c.position.y -= 1; body.add(c); }); me.add(body);
me.position.set(-4, H(-4, 4), 4); me.rotation.y = Math.PI;
scene.add(me);
const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.65, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }));
ring.rotation.x = -Math.PI / 2; scene.add(ring);

// ---------- labels, places list ----------
const labels = $('#labels');
PLACES.forEach(p => {
  const el = document.createElement('button'); el.className = 'w-label'; el.innerHTML = `<span><b>${p.name}</b><i>${p.desc.split(':')[0]}</i></span>`; el.onclick = () => travel(p); labels.appendChild(el); p.el = el;
  p.top = new THREE.Vector3(p.pos[0], p.y + p.ly, p.pos[1]);
  const b = document.createElement('button'); b.innerHTML = `<i></i>${SIGNS[p.id] === 'CORNELL' ? 'Cornell' : SIGNS[p.id].charAt(0) + SIGNS[p.id].slice(1).toLowerCase()}`; b.title = p.name; b.onclick = () => travel(p); $('#places').appendChild(b);
});

// big floating signs + quests
const sprites = [];
PLACES.forEach(p => {
  const txt = SIGNS[p.id], c = document.createElement('canvas'), x = c.getContext('2d'); x.font = '600 64px "Clash Display", Satoshi, sans-serif'; const w = Math.ceil(x.measureText(txt).width) + 90; c.width = w; c.height = 120;
  x.font = '600 64px "Clash Display", Satoshi, sans-serif'; x.fillStyle = 'rgba(20,20,22,.82)'; x.beginPath(); x.roundRect(4, 4, w - 8, 112, 56); x.fill(); x.fillStyle = p.id === 'tower' ? '#ff6b5f' : '#ffffff'; x.textBaseline = 'middle'; x.fillText(txt, 45, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); sp.renderOrder = 10; sp.scale.set(w / 120 * 2.2, 2.2, 1); sp.position.copy(p.top).add(new THREE.Vector3(0, 2.5, 0)); sp.userData.y = sp.position.y; scene.add(sp); sprites.push(sp);
  const li = document.createElement('li'); li.innerHTML = `<i></i>${SIGNS[p.id] === 'CORNELL' ? 'Cornell' : SIGNS[p.id].charAt(0) + SIGNS[p.id].slice(1).toLowerCase()}`; $('#quests').appendChild(li); p.q = li;
});
// ---------- controls ----------
const keys = {};
let target = null, yaw = 0, pitch = 0.4, dist = 17, active = null, started = false;
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  if (e.code === 'Space') jump();
  if (k === 'enter' && active) openDrawer(active); if (k === 'escape') closeDrawer();
  if (k === 'c' && active && active.act) chimes();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function travel(p) { target = new THREE.Vector3(p.door[0], 0, p.door[1]); arrivedAt = p; start(); }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!down) return; yaw = down.yaw - (e.clientX - down.x) * 0.005; pitch = Math.min(1.25, Math.max(0.12, down.pitch + (e.clientY - down.y) * 0.003)); });
canvas.addEventListener('pointerup', e => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    if (eggClick(ray)) { down = null; return; }
    const hitP = PLACES.find(p => ray.intersectObject(p.group, true).length);
    if (hitP) travel(hitP); else { const h = ray.intersectObject(terrain)[0]; if (h && h.point.y > LAKE + 0.5) { target = h.point.clone(); ring.position.set(h.point.x, h.point.y + 0.05, h.point.z); ring.material.opacity = 0.9; start(); } }
  }
  down = null;
});
canvas.addEventListener('wheel', e => { dist = Math.min(36, Math.max(7, dist + e.deltaY * 0.01)); }, { passive: true });
function start() { if (!started) { started = true; document.body.classList.add('playing'); } }
$('#startBtn').onclick = start;
let touring = false, arrivedAt = null;
const drawer = $('#drawer');
function openDrawer(p) { p.visited || (p.visited = true); $('#drTitle').textContent = `${p.name} · ${SIGNS[p.id].charAt(0) + SIGNS[p.id].slice(1).toLowerCase()}`; $('#drFull').href = p.href; const f = $('#drFrame'); const src = p.href.replace(/(#|$)/, m => (m === '#' ? '?embed=1#' : '?embed=1')); if (f.dataset.src !== src) { f.dataset.src = src; f.src = src; } drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('reading'); }
function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('reading'); }
$('#drClose').onclick = () => { closeDrawer(); touring = false; };
$('#drNext').onclick = () => { closeDrawer(); const n = PLACES.find(q => !q.visited) || null; if (n) travel(n); else toast('You’ve seen everything. Thanks for visiting!'); };
$('#tourBtn').onclick = () => { touring = true; start(); const n = PLACES.find(q => !q.visited); if (n) travel(n); };

// ---------- game: tokens, jump, chimes, particles, sound ----------
let vy = 0, grounded = true, got = 0, points = 0, rung = false, muted = localStorage.getItem('muted') === '1', actx;
function tone(f, t0, dur, type = 'sine', vol = 0.16) { const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.05); }
function sfx(type) {
  if (muted) return; actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const n = actx.currentTime;
  if (type === 'coin') { tone(988, n, 0.18); tone(1319, n + 0.07, 0.25); }
  if (type === 'jump') { tone(330, n, 0.14, 'triangle', 0.08); tone(495, n + 0.04, 0.12, 'triangle', 0.06); }
  if (type === 'win') [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, n + i * 0.1, 0.5));
  if (type === 'bell') [659, 587, 523, 392, 0, 392, 587, 659, 523].forEach((f, i) => { if (f) { tone(f, n + i * 0.42, 2.2, 'sine', 0.2); tone(f * 2.76, n + i * 0.42, 0.9, 'sine', 0.04); tone(f * 0.5, n + i * 0.42, 2.6, 'sine', 0.06); } });
}
let jumpsLeft = 0, flipT = -1, combo = 1, comboTimer = 0;
function pop(text, big) { const v = me.position.clone().setY(me.position.y + 3).project(camera), el = document.createElement('span'); el.className = 'pop' + (big ? ' big' : ''); el.textContent = text; el.style.left = (v.x * 0.5 + 0.5) * innerWidth + 'px'; el.style.top = (-v.y * 0.5 + 0.5) * innerHeight + 'px'; $('#pops').appendChild(el); setTimeout(() => el.remove(), 1200); }
function score(n, label) { const g = n * combo; points += g; hud(); pop(`${label} +${g}${combo > 1 ? ` ×${combo}` : ''}`, combo > 2); combo = Math.min(combo + 1, 8); comboTimer = 2.5; $('#combo').textContent = combo > 1 ? `combo ×${combo}` : ''; }
function jump() { start(); if (grounded) { vy = 9.2; grounded = false; jumpsLeft = 1; sfx('jump'); } else if (jumpsLeft > 0) { vy = 9.8; jumpsLeft = 0; flipT = 0; sfx('jump'); } }
function onLand() { if (flipT >= 0) { flipT = -1; body.rotation.x = 0; pop('sloppy landing'); } }
$('#jumpBtn').addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
const muteBtn = $('#muteBtn'), setMute = () => { muteBtn.textContent = muted ? 'sound off' : 'sound on'; muteBtn.classList.toggle('off', muted); };
muteBtn.onclick = () => { muted = !muted; localStorage.setItem('muted', muted ? '1' : '0'); setMute(); }; setMute();
function hud() { $('#coins').textContent = got; $('#pts').textContent = points; const s = $('#score'); s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); }
function toast(msg) { const t = $('#wToast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2800); }
function chimes() { eggChime(); sfx('bell'); if (!rung) { rung = true; points += 5; hud(); toast('You rang the McGraw chimes! +5'); } else toast('Ding, dong'); burst(new THREE.Vector3(-37, H(-37, -6) + 25, -6), '#ffe3a3', 60); }
$('#pAct').onclick = () => chimes();
$('#pOpen').addEventListener('click', e => { if (active) { e.preventDefault(); openDrawer(active); } });
const bursts = [];
function burst(p, color, n = 26) {
  const pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos.set([p.x, p.y, p.z], i * 3); const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, s = 3 + Math.random() * 4, q = Math.sqrt(1 - u * u); vel.push(Math.cos(a) * q * s, Math.abs(u) * s + 2, Math.sin(a) * q * s); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.3, transparent: true, depthWrite: false })); scene.add(pts); bursts.push({ pts, vel, life: 1 });
}
const tokens = [];
{
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#b31b1b'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#fff'; x.font = '700 92px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('C', 64, 70);
  const face = new THREE.CanvasTexture(c); face.colorSpace = THREE.SRGBColorSpace;
  const side = new THREE.MeshStandardMaterial({ color: '#b31b1b', metalness: 0.5, roughness: 0.35, emissive: '#5a0000', emissiveIntensity: 0.4 });
  const top = new THREE.MeshStandardMaterial({ map: face, metalness: 0.3, roughness: 0.4, emissive: '#ffffff', emissiveMap: face, emissiveIntensity: 0.25 });
  const geo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 32);
  const spots = scatter(26, (x, z, h) => okGround(x, z, h) && h > 0);
  for (let z = BRIDGE.z0 + 4; z < BRIDGE.z1 - 2; z += 4) spots.push([BRIDGE.x, BRIDGE.y, z]);
  spots.forEach(([x, h, z], i) => { const t = new THREE.Mesh(geo, [side, top, top]); t.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(t); const high = i % 4 === 1 && i < 26; g.position.set(x, h + (high ? 2.5 : 1.1), z); g.userData = { y: g.position.y, ph: Math.random() * 6 }; t.castShadow = true; scene.add(g); tokens.push(g); });
  $('#coinTotal').textContent = tokens.length;
}

// guide: arrow over my head pointing to the next unvisited building
const guide = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 16), new THREE.MeshStandardMaterial({ color: '#b31b1b', emissive: '#ff3b2f', emissiveIntensity: 0.5 }));
guide.geometry.rotateX(Math.PI / 2); scene.add(guide);
const nextPlace = () => PLACES.find(q => !q.visited);
$('#nextBtn').onclick = () => { const n = nextPlace(); if (n) travel(n); };
// trampolines + hoops on the quad
const TRAMPS = [[-16, -6], [10, -6], [-16, 13], [10, 13]].map(([x, z], i) => {
  const y = H(x, z), g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  mesh(new THREE.TorusGeometry(1.5, 0.14, 8, 32), M('#2b2f36', { metalness: 0.4 }), 0, 0.55, 0, g).rotation.x = Math.PI / 2;
  const m = mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.08, 32), M(i % 2 ? '#b31b1b' : '#2a5bd7', { roughness: 0.5 }), 0, 0.55, 0, g);
  for (let k = 0; k < 4; k++) mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 6), M('#2b2f36'), Math.cos(k * 1.57) * 1.4, 0.27, Math.sin(k * 1.57) * 1.4, g);
  return { x, z, y, m };
});
const HOOPS = [[-16, -6, 9], [10, -6, 10], [-16, 13, 9.5], [10, 13, 10.5], [-4, 3, 7], [-4, -2, 11]].map(([x, z, hh]) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 10, 40), new THREE.MeshStandardMaterial({ color: '#ffcf4a', emissive: '#ffb400', emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }));
  m.position.set(x, H(x, z) + hh, z); scene.add(m); return { m, cd: 0 };
});
// ---------- secret easter eggs ----------
const SECRETS = { konami: 'Konami code: moon gravity', wave: 'The hidden Onda wave', bear: 'Touchdown the bear', dragon: 'Dragon Day dragon', song: 'Evening Song' };
const found = new Set(); let lowG = 0, rings = 0;
function secret(id, n = 15) {
  if (found.has(id)) return; found.add(id); points += n; hud(); sfx('win');
  const s = $('#secrets'); s.hidden = false; $('#secN').textContent = found.size; s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump');
  toast(`Secret found: ${SECRETS[id]} +${n}${found.size === 5 ? ' · all 5 found!' : ''}`);
  burst(me.position.clone().setY(me.position.y + 2), '#ffd27a', 70);
  if (found.size === 5) setTimeout(() => { points += 50; hud(); toast('Master of secrets +50'); for (let i = 0; i < 6; i++) setTimeout(() => burst(me.position.clone().add(new THREE.Vector3((Math.random() - .5) * 8, 4 + Math.random() * 4, (Math.random() - .5) * 8)), ['#ff5a4f', '#ffd27a', '#9fd3ff'][i % 3], 60), i * 180); }, 3000);
}
const spot = (x, z) => { for (let r = 0; r < 30; r++) for (let a = 0; a < 6.28; a += 0.4) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (H(px, pz) > LAKE + 1 && !blocked(px, pz, 1.6) && Math.hypot(px * 0.8, pz) < 100) return [px, pz]; } return [x, z]; };
const gold = M('#e2b04a', { metalness: 1, roughness: 0.22, emissive: '#5a3a00', emissiveIntensity: 0.25 });
// 1. Onda wave, tucked behind the Johnson Museum
const wave = new THREE.Group(); {
  const [x, z] = spot(-30, -45); wave.position.set(x, H(x, z), z); scene.add(wave);
  mesh(new THREE.CylinderGeometry(0.9, 1, 0.8, 24), M('#d8d2c6'), 0, 0.4, 0, wave);
  const pts = [[-1.4, 0], [-0.8, 0.5], [-0.1, 1.5], [0.6, 2.3], [1.3, 2.1], [1.4, 1.4], [0.9, 1.1], [0.75, 1.6]].map(([a, b]) => new THREE.Vector3(a, b + 0.8, 0));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.16, 12), gold, 0, 0, 0, wave);
  BLOCK.push({ x0: x - 1, x1: x + 1, z0: z - 1, z1: z + 1 });
}
// 2. Touchdown the bear, hiding behind Bailey Hall
const bear = new THREE.Group(); {
  const [x, z] = spot(39, -40); bear.position.set(x, H(x, z), z); scene.add(bear);
  const fur = M('#6b4528', { roughness: 1 }), snout = M('#c79a6b');
  mesh(new THREE.SphereGeometry(0.75, 18, 14), fur, 0, 0.9, 0, bear).scale.set(1, 1.15, 0.9);
  mesh(new THREE.SphereGeometry(0.5, 18, 14), fur, 0, 2, 0, bear);
  [-0.32, 0.32].forEach(e => mesh(new THREE.SphereGeometry(0.16, 10, 8), fur, e, 2.42, 0, bear));
  mesh(new THREE.SphereGeometry(0.2, 12, 10), snout, 0, 1.92, 0.42, bear);
  mesh(new THREE.SphereGeometry(0.06, 8, 6), M('#111'), 0, 1.98, 0.6, bear);
  [-0.18, 0.18].forEach(e => mesh(new THREE.SphereGeometry(0.05, 8, 6), M('#111'), e, 2.12, 0.42, bear));
  [-0.55, 0.55].forEach(e => mesh(new THREE.CapsuleGeometry(0.17, 0.5, 4, 8), fur, e, 1.15, 0.2, bear).rotation.z = e > 0 ? -0.5 : 0.5);
  mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), M('#b31b1b'), 0, 1.05, 0.7, bear);
  BLOCK.push({ x0: x - 0.8, x1: x + 0.8, z0: z - 0.8, z1: z + 0.8 });
}
// 3. Dragon Day dragon circling the sky (click it)
const dragon = new THREE.Group(); scene.add(dragon); const segs = []; let wings; {
  const red = M('#c8281e', { roughness: 0.6 }), dark = M('#7a120c');
  for (let i = 0; i < 12; i++) { const s = mesh(new THREE.SphereGeometry(1.1 - i * 0.07, 14, 10), i % 2 ? red : dark, 0, 0, 0, dragon); s.castShadow = false; segs.push(s); }
  const head = segs[0]; mesh(new THREE.ConeGeometry(0.7, 1.8, 10), red, 0, 0, 1.2, head).rotation.x = Math.PI / 2;
  [-0.5, 0.5].forEach(e => mesh(new THREE.ConeGeometry(0.18, 0.9, 6), M('#f3e3b0'), e, 0.8, -0.2, head).rotation.x = -0.4);
  wings = [-1, 1].map(sd => { const w = new THREE.Group(); segs[2].add(w); mesh(new THREE.BoxGeometry(4.2, 0.08, 1.8), dark, sd * 2.1, 0, 0, w); return w; });
  head.add(new THREE.Mesh(new THREE.SphereGeometry(5, 8, 6), new THREE.MeshBasicMaterial({ visible: false })));
}
const dragonAt = (u, out) => out.set(Math.sin(u) * 62, 30 + Math.sin(u * 3) * 4, Math.cos(u) * 48 - 4);
function eggClick(r) { if (r.intersectObject(dragon, true).length) { secret('dragon'); burst(segs[0].getWorldPosition(new THREE.Vector3()), '#ff5a4f', 60); return true; } return false; }
// 4. ring the chimes 3 times -> Evening Song
function eggChime() { if (++rings === 3) { secret('song'); const top = new THREE.Vector3(-37, H(-37, -6) + 30, -6); for (let i = 0; i < 8; i++) setTimeout(() => burst(top.clone().add(new THREE.Vector3((Math.random() - .5) * 10, Math.random() * 8, (Math.random() - .5) * 10)), ['#ff5a4f', '#ffd27a', '#ffffff'][i % 3], 70), i * 260); } }
// 5. Konami code -> moon gravity
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']; let kIdx = 0;
addEventListener('keydown', e => { const k = e.key.toLowerCase(); kIdx = k === KONAMI[kIdx] ? kIdx + 1 : (k === KONAMI[0] ? 1 : 0); if (kIdx === KONAMI.length) { kIdx = 0; lowG = 25; secret('konami', 25); toast('Moon gravity for 25 seconds. Jump!'); } });
const dv = new THREE.Vector3();
function eggTick(dt, t) {
  wave.rotation.y += dt * 0.5;
  if (Math.hypot(me.position.x - wave.position.x, me.position.z - wave.position.z) < 3) secret('wave');
  bear.rotation.y = Math.atan2(me.position.x - bear.position.x, me.position.z - bear.position.z); bear.position.y = H(bear.position.x, bear.position.z) + Math.abs(Math.sin(t * 2.4)) * 0.15;
  if (Math.hypot(me.position.x - bear.position.x, me.position.z - bear.position.z) < 3.2) secret('bear');
  const u = t * 0.12; segs.forEach((s, i) => dragonAt(u - i * 0.022, s.position).y += Math.sin(t * 4 - i * 0.6) * 0.5);
  segs.forEach((s, i) => { if (i < segs.length - 1) s.lookAt(i ? segs[i - 1].position : dragonAt(u + 0.02, dv)); else s.lookAt(segs[i - 1].position); });
  wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * Math.sin(t * 6) * 0.6);
  if (lowG > 0 && (lowG -= dt) <= 0) toast('Gravity is back to normal');
}
console.log('%cpsst… there are 5 secrets hidden on this campus. Old-school gamers know a code.', 'color:#b31b1b;font-weight:600');

// ---------- day / night ----------
const day = { top: '#8fc0e8', bottom: '#f6ead8', water: '#5f9fc2', hemi: 0.85, sun: 2.5, sunC: '#ffe7c4', exp: 1.05 };
const night = { top: '#0a1230', bottom: '#2a3658', water: '#183a57', hemi: 0.2, sun: 0.4, sunC: '#a9c1ff', exp: 0.6 };
let nightK = root.dataset.theme === 'dark' ? 1 : 0, nightT = nightK;
new MutationObserver(() => { nightT = root.dataset.theme === 'dark' ? 1 : 0; }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
const cA = new THREE.Color(), cB = new THREE.Color();
function applySky(k) {
  skyU.top.value.copy(cA.set(day.top)).lerp(cB.set(night.top), k);
  skyU.bottom.value.copy(cA.set(day.bottom)).lerp(cB.set(night.bottom), k);
  scene.fog.color.copy(skyU.bottom.value);
  waterMat.color.copy(cA.set(day.water)).lerp(cB.set(night.water), k);
  hemi.intensity = day.hemi + (night.hemi - day.hemi) * k; hemi.groundColor.set(k > 0.5 ? '#1a2238' : '#8a8a5a');
  sun.intensity = day.sun + (night.sun - day.sun) * k; sun.color.copy(cA.set(day.sunC)).lerp(cB.set(night.sunC), k);
  stars.material.opacity = k; renderer.toneMappingExposure = day.exp + (night.exp - day.exp) * k;
  glow.forEach(m => m.emissiveIntensity = m === headMatRef() ? 0.1 + k * 3 : k * 1.8);
}
const headMatRef = () => glow.find(m => m.color.getHexString() === 'fff4dc');
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
const clock = new THREE.Clock(), v3 = new THREE.Vector3(), camPos = new THREE.Vector3(), look = new THREE.Vector3(), prompt = $('#prompt'), UP = new THREE.Vector3(0, 1, 0), dObj = new THREE.Object3D();
let walk = 0, intro = 1;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
  let mx = 0, mz = 0;
  if (keys.w || keys.arrowup) mz -= 1; if (keys.s || keys.arrowdown) mz += 1; if (keys.a || keys.arrowleft) mx -= 1; if (keys.d || keys.arrowright) mx += 1;
  const dir = new THREE.Vector3();
  if (mx || mz) { target = null; start(); dir.set(mx, 0, mz).normalize().applyAxisAngle(UP, yaw); }
  else if (target) { dir.set(target.x - me.position.x, 0, target.z - me.position.z); if (dir.length() < 0.4) { target = null; dir.set(0, 0, 0); } else dir.normalize(); }
  const moving = dir.lengthSq() > 0;
  if (moving) {
    const spd = keys.shift ? 15 : 9, nx = me.position.x + dir.x * spd * dt, nz = me.position.z + dir.z * spd * dt, nh = walkH(nx, nz);
    const climbOk = nh - me.position.y < 1.2 || !grounded;
    if (nh > LAKE + 0.4 && climbOk && !blocked(nx, nz, 0.45) && Math.hypot(nx * 0.8, nz) < 104) { me.position.x = nx; me.position.z = nz; } else target = null;
    const ang = Math.atan2(dir.x, dir.z); let da = ang - me.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); me.rotation.y += da * Math.min(1, dt * 10);
    walk += dt * 11;
  } else walk *= 0.9;
  const gy = walkH(me.position.x, me.position.z);
  if (!grounded || me.position.y > gy + 0.3) { grounded = false; vy -= (lowG > 0 ? 8 : 24) * dt; me.position.y += vy * dt; if (me.position.y <= gy) { me.position.y = gy; vy = 0; grounded = true; onLand(); } }
  else me.position.y = gy + Math.abs(Math.sin(walk)) * 0.12 * (moving ? 1 : 0);
  me.userData.arms.forEach((a, i) => a.rotation.x = grounded ? Math.sin(walk + i * Math.PI) * (moving ? 0.7 : 0.05) : -2.4);
  ring.material.opacity *= 0.96;
  if (flipT >= 0) { flipT += dt / 0.55; body.rotation.x = -Math.min(flipT, 1) * Math.PI * 2; if (flipT >= 1) { flipT = -1; body.rotation.x = 0; score(2, 'FLIP!'); burst(me.position.clone().setY(me.position.y + 1), '#9fd3ff', 14); } }
  comboTimer -= dt; if (comboTimer <= 0 && combo > 1) { combo = 1; $('#combo').textContent = ''; }
  TRAMPS.forEach(tp => { if (Math.hypot(me.position.x - tp.x, me.position.z - tp.z) < 1.7 && me.position.y < tp.y + 0.6 && vy <= 0) { vy = 17; grounded = false; jumpsLeft = 1; me.position.y = tp.y + 0.62; tp.m.scale.y = 0.4; sfx('jump'); sfx('coin'); } tp.m.scale.y += (1 - tp.m.scale.y) * Math.min(1, dt * 8); });
  HOOPS.forEach(h => { h.m.rotation.y += dt * 0.8; if (h.cd > 0) { h.cd -= dt; h.m.visible = h.cd <= 0; return; } if (me.position.distanceTo(h.m.position) < 1.9 || v3.copy(me.position).setY(me.position.y + 1).distanceTo(h.m.position) < 1.6) { h.cd = 8; h.m.visible = false; score(5, 'HOOP!'); burst(h.m.position, '#ffd27a', 40); } });
  { const n = nextPlace(); guide.visible = !!n && started; if (n) { guide.position.set(me.position.x, me.position.y + 3.1 + Math.sin(t * 3) * 0.12, me.position.z); guide.lookAt(n.door[0], me.position.y + 3.1, n.door[1]); $('#nextBtn').innerHTML = `Next stop: <b>${SIGNS[n.id] === 'CORNELL' ? 'Cornell' : n.name}</b> →`; } else $('#nextBtn').textContent = 'Tour complete ✓'; }
  sprites.forEach((sp, i) => sp.position.y = sp.userData.y + Math.sin(t * 1.5 + i) * 0.3);
  PLACES.forEach(pl => { if (!pl.toured && Math.hypot(me.position.x - pl.door[0], me.position.z - pl.door[1]) < 5.5) { pl.toured = true; pl.visited = true; pl.q.classList.add('done'); points += 10; hud(); toast(`Found ${pl.name}! +10 · press Enter to open`); sfx('win'); if (PLACES.every(q => q.toured)) setTimeout(() => toast('Campus tour complete! +50'), 2900), points += 50; } });
  // camera
  intro += ((started ? 0 : 1) - intro) * Math.min(1, dt * 1.4);
  const d = dist + intro * 75, p = pitch + intro * 0.38, y = yaw + intro * (0.6 + t * 0.04);
  camPos.set(me.position.x + Math.sin(y) * Math.cos(p) * d, me.position.y + 2 + Math.sin(p) * d, me.position.z + Math.cos(y) * Math.cos(p) * d);
  camera.position.lerp(camPos, Math.min(1, dt * 4));
  look.lerp(v3.set(me.position.x, me.position.y + 2, me.position.z), Math.min(1, dt * 6)); camera.lookAt(look);
  sun.position.set(me.position.x + 50, 95, me.position.z + 60); sun.target.position.copy(me.position);
  // world animation
  const wp = wg.attributes.position;
  for (let i = 0; i < wp.count; i++) { const x = wBase[i * 3], z = wBase[i * 3 + 2]; wp.setY(i, Math.sin(x * 0.05 + t * 0.9) * 0.22 + Math.cos(z * 0.07 + t * 0.7) * 0.18); }
  wp.needsUpdate = true; wg.computeVertexNormals();
  fallTex.offset.y = (fallTex.offset.y + dt * 1.6) % 1;
  leafData.forEach((l, i) => { l.y -= l.v * dt; l.s += dt; if (l.y < -1) { l.y = 14; l.x = (Math.random() - 0.5) * 60; l.z = (Math.random() - 0.5) * 60; } const wx = me.position.x + l.x + Math.sin(l.s * 1.3) * 1.2, wz = me.position.z + l.z; dObj.position.set(wx, walkH(wx, wz) + l.y, wz); dObj.rotation.set(l.s * 2, l.s * 1.4, l.s); dObj.updateMatrix(); leaves.setMatrixAt(i, dObj.matrix); });
  leaves.instanceMatrix.needsUpdate = true;
  tokens.forEach(c => {
    if (!c.visible) return; c.rotation.y += dt * 2.4; c.position.y = c.userData.y + Math.sin(t * 2 + c.userData.ph) * 0.18;
    if (Math.hypot(c.position.x - me.position.x, c.position.z - me.position.z) < 1.1 && Math.abs(c.position.y - (me.position.y + 1)) < 1.25) {
      c.visible = false; got++; points++; hud(); burst(c.position, '#ff5a4f'); sfx('coin');
      if (got === tokens.length) { points += 20; hud(); sfx('win'); toast('All Big Red tokens collected! +20'); burst(me.position.clone().setY(me.position.y + 2), '#ffd27a', 90); }
    }
  });
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i], a = b.pts.geometry.attributes.position; b.life -= dt * 1.1;
    for (let j = 0; j < b.vel.length / 3; j++) { b.vel[j * 3 + 1] -= 9 * dt; a.array[j * 3] += b.vel[j * 3] * dt; a.array[j * 3 + 1] += b.vel[j * 3 + 1] * dt; a.array[j * 3 + 2] += b.vel[j * 3 + 2] * dt; }
    a.needsUpdate = true; b.pts.material.opacity = Math.max(0, b.life);
    if (b.life <= 0) { scene.remove(b.pts); b.pts.geometry.dispose(); bursts.splice(i, 1); }
  }
  nightK += (nightT - nightK) * Math.min(1, dt * 2.5); applySky(nightK);
  // labels + proximity
  active = null;
  PLACES.forEach(pl => {
    v3.copy(pl.top).project(camera);
    const dd = Math.hypot(me.position.x - pl.door[0], me.position.z - pl.door[1]);
    const vis = v3.z < 1 && started;
    pl.el.style.transform = `translate(${(v3.x * 0.5 + 0.5) * innerWidth}px,${(-v3.y * 0.5 + 0.5) * innerHeight}px)`;
    pl.el.style.opacity = vis ? Math.max(0.3, Math.min(1, 1.7 - dd / 55)) : 0;
    pl.el.style.pointerEvents = vis ? 'auto' : 'none';
    if (dd < 5.5) active = pl;
  });
  if (active) { prompt.classList.add('on'); $('#pTitle').textContent = active.name; $('#pDesc').textContent = active.desc; $('#pOpen').href = active.href; if (arrivedAt === active && !target) { arrivedAt = null; if (touring || true) openDrawer(active); } $('#pAct').style.display = active.act ? '' : 'none'; } else prompt.classList.remove('on');
  eggTick(dt, t);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
applySky(nightK);
camera.position.set(-4, 90, 120); look.set(-4, 3, 4);
frame();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
