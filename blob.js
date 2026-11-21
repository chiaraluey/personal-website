import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const wrap = document.querySelector('.dots-wrap'), dots = document.querySelector('#dots');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (wrap && dots && !reduce) init();

function init() {
  const root = document.documentElement;
  const cv = document.createElement('canvas');
  cv.className = 'glass'; cv.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false }); } catch (e) { return; }
  wrap.appendChild(cv);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -4000, 4000);

  // the halftone portrait, copied onto an opaque texture so the glass can refract it
  const flat = document.createElement('canvas'), fx = flat.getContext('2d');
  const tex = new THREE.CanvasTexture(flat); tex.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scene.add(plane);

  const U = { uTime: { value: 0 }, uAmp: { value: .3 }, uFreq: { value: .62 }, uRim: { value: .5 } };
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: .06, metalness: 0, ior: 1.42, thickness: .8,
    transmission: 1, iridescence: 1, iridescenceIOR: 1.55, iridescenceThicknessRange: [180, 820],
    clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.25, dispersion: 9, specularIntensity: 1
  });
  mat.onBeforeCompile = s => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime,uAmp,uFreq;\n' + NOISE + `
float dsp(vec3 p){return snoise(p*uFreq+vec3(0.,uTime*.22,uTime*.13))*uAmp+snoise(p*uFreq*1.7-uTime*.11)*uAmp*.18;}
vec3 warp(vec3 p){return p*(1.+dsp(p));}`)
      .replace('#include <beginnormal_vertex>', `vec3 p0=normalize(position);
vec3 tg=normalize(cross(p0,abs(p0.y)<.99?vec3(0.,1.,0.):vec3(1.,0.,0.)));vec3 bt=normalize(cross(p0,tg));
vec3 w0=warp(p0),w1=warp(normalize(p0+tg*.012)),w2=warp(normalize(p0+bt*.012));
vec3 objectNormal=normalize(cross(w1-w0,w2-w0));`)
      .replace('#include <begin_vertex>', 'vec3 transformed=w0;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime,uRim;')
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
float fr=pow(1.-abs(dot(geometryViewDir,geometryNormal)),2.6);
gl_FragColor.rgb+=fr*uRim*(.55+.45*cos(6.2832*(fr*1.4+vec3(0.,.33,.67)+uTime*.04)));`);
  };
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), mat);
  scene.add(blob);

  let W = 0, H = 0, R = 0, dr = null;
  const theme = () => {
    const dark = root.dataset.theme === 'dark';
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim() || (dark ? '#111' : '#f3efe5');
    scene.background = new THREE.Color(bg);
    flat.dataset.bg = bg;
    // milky liquid by day, clear glass at night
    mat.transmission = dark ? 1 : .42; U.uRim.value = dark ? .55 : .45; mat.roughness = dark ? .02 : .07;
    mat.attenuationDistance = Infinity;
    mat.envMapIntensity = dark ? 1.6 : 1.15;
  };
  const size = () => {
    const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    renderer.setSize(W, H, false);
    Object.assign(cam, { left: -W / 2, right: W / 2, top: H / 2, bottom: -H / 2 }); cam.updateProjectionMatrix();
    dr = dots.getBoundingClientRect();
    const sc = Math.min(devicePixelRatio || 1, 2); flat.width = dr.width * sc; flat.height = dr.height * sc;
    plane.scale.set(dr.width, dr.height, 1);
    plane.position.set(dr.left - r.left + dr.width / 2 - W / 2, -(dr.top - r.top + dr.height / 2 - H / 2), 0);
    R = dr.width * .21;
  };
  theme(); size();
  new MutationObserver(theme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('resize', size);

  const pos = new THREE.Vector2(), tgt = new THREE.Vector2(), vel = new THREE.Vector2();
  let ptr = null, last = performance.now(), wob = 0, on = true, first = true, t0 = last;
  addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left - W / 2, y = -(e.clientY - r.top - H / 2);
    if (Math.abs(x) < W * .75 && Math.abs(y) < H * .75) { ptr = [x, y]; } else ptr = null;
  }, { passive: true });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) requestAnimationFrame(frame); }).observe(wrap);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });

  function frame(now) {
    if (!on || document.hidden) return;
    const dt = Math.min((now - last) / 1000, .05), t = (now - t0) / 1000; last = now;
    if (ptr) tgt.set(Math.max(-W / 2 + R, Math.min(W / 2 - R, ptr[0])), Math.max(-H / 2 + R, Math.min(H / 2 - R, ptr[1])));
    else tgt.set(Math.sin(t * .23) * dr.width * .22, Math.cos(t * .31) * dr.height * .2 + dr.height * .06);
    const prev = pos.clone(); pos.lerp(tgt, 1 - Math.pow(.06, dt));
    vel.subVectors(pos, prev).divideScalar(Math.max(dt, 1e-3));
    wob += (Math.min(vel.length() / 900, .35) - wob) * Math.min(dt * 3, 1);
    U.uTime.value = t * (1 + wob * 2); U.uAmp.value = .3 + wob * .45;
    blob.position.set(pos.x, pos.y, 400);
    const sx = 1 + Math.sin(t * .5) * .12 + vel.x / 9000, sy = 1 + Math.cos(t * .43) * .12 + vel.y / 9000;
    blob.scale.set(R * sx, R * sy, R);
    blob.rotation.set(t * .17 + vel.y / 4000, t * .23 - vel.x / 4000, t * .07);
    // copy the live halftone onto an opaque background
    fx.fillStyle = flat.dataset.bg; fx.fillRect(0, 0, flat.width, flat.height);
    fx.drawImage(dots, 0, 0, flat.width, flat.height); tex.needsUpdate = true;
    renderer.render(scene, cam);
    if (first) { first = false; wrap.classList.add('glassy'); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const NOISE = `vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;
