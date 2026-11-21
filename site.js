const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,root=document.documentElement;

// theme: circular reveal from the toggle
$('#theme').addEventListener('click',e=>{
  const next=root.dataset.theme==='dark'?'light':'dark',apply=()=>{root.dataset.theme=next;localStorage.setItem('theme',next)};
  if(!document.startViewTransition||reduce)return apply();
  const x=e.clientX,y=e.clientY,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  root.classList.add('theming');
  const t=document.startViewTransition(apply);
  t.ready.then(()=>root.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},{duration:650,easing:'cubic-bezier(.2,.8,.2,1)',pseudoElement:'::view-transition-new(root)'}));
  t.finished.finally(()=>root.classList.remove('theming'));
});

// split headings into letters
$$('[data-split]').forEach(el=>{let i=0;el.innerHTML=el.textContent.split(/(\s+)/).map(w=>/^\s+$/.test(w)?w:`<span style="display:inline-block;white-space:nowrap">${[...w].map(c=>`<span class="ch" style="--i:${i++}">${c}</span>`).join('')}</span>`).join('')});

// scroll reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -5% 0px'});
const watch=()=>$$('.reveal:not(.in)').forEach(el=>{const sib=[...el.parentElement.children];el.style.setProperty('--d',Math.min(sib.indexOf(el),8)*60+'ms');io.observe(el)});

// floating preview image on [data-img] links
const hv=$('#hoverImg');
if(matchMedia('(pointer:fine)').matches&&!reduce){
  let tx=0,ty=0,cx=0,cy=0,vx=0,raf;
  const loop=()=>{const nx=cx+(tx-cx)*.14;vx=nx-cx;cx=nx;cy+=(ty-cy)*.14;hv.style.transform=`translate(${cx+24}px,${cy-90}px) rotate(${Math.max(-8,Math.min(8,vx*.6))}deg)`;raf=requestAnimationFrame(loop)};
  addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY});
  $$('[data-img]').forEach(a=>{a.addEventListener('mouseenter',e=>{$('img',hv).src=a.dataset.img;if(!hv.classList.contains('on')){cx=tx=e.clientX;cy=ty=e.clientY}hv.classList.add('on');cancelAnimationFrame(raf);loop()});a.addEventListener('mouseleave',()=>hv.classList.remove('on'))});
}

// lightbox
const lb=$('#lb'),lbb=$('#lbBody');
function openLB(html,media){lbb.innerHTML=html;lb.classList.toggle('media',!!media);lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeLB(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');document.body.style.overflow='';setTimeout(()=>lbb.innerHTML='',350)}
lb.addEventListener('click',e=>{if(e.target===lb||e.target.closest('.lb-x'))closeLB()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeLB()});
const yt=id=>`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Video"></iframe>`;
document.addEventListener('click',e=>{const v=e.target.closest('[data-yt]');if(v){openLB(yt(v.dataset.yt),1);return}const f=e.target.closest('[data-full]');if(f){e.preventDefault();openLB(`<img src="${f.dataset.full}" alt="">`,1)}});

// projects
const tiles=$('#tiles');
if(tiles&&window.PROJECTS){
  tiles.innerHTML=PROJECTS.map((p,i)=>`<button class="tile reveal" data-i="${i}" data-cat="${p.cat.join(' ')}"><div class="t-img">${p.poster?`<img src="${p.poster}" alt="" loading="lazy">`:`<div class="t-ph">${p.t[0]}</div>`}</div><div class="t-b"><span class="t-t">${p.t}</span><span class="t-m">${p.yr} · ${p.m}</span></div></button>`).join('');
  tiles.addEventListener('click',e=>{const t=e.target.closest('.tile');if(!t)return;const p=PROJECTS[t.dataset.i];
    const imgs=[p.yt?null:p.poster,...(p.extra||[])].filter(Boolean).map(s=>`<a href="${s}" data-full="${s}"><img src="${s}" alt=""></a>`).join('');
    openLB(`<div class="pm"><h2>${p.t}</h2><p class="pm-m">${p.yr} · ${p.m}</p><p>${p.d}</p>${p.more?`<ul>${p.more.map(m=>`<li>${m}</li>`).join('')}</ul>`:''}<div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div>${p.yt?`<iframe src="https://www.youtube-nocookie.com/embed/${p.yt}?rel=0" allow="encrypted-media; fullscreen" allowfullscreen title="Video"></iframe>`:''}${imgs?`<div class="pm-imgs">${imgs}</div>`:''}<a class="btn" href="${p.link}" target="_blank" rel="noopener">${p.linkLabel||'Open'} ↗</a></div>`)});
  $$('.f').forEach(b=>b.addEventListener('click',()=>{$$('.f').forEach(x=>x.classList.toggle('on',x===b));const f=b.dataset.f;$$('.tile').forEach(t=>t.classList.toggle('hide',f!=='all'&&!t.dataset.cat.includes(f)))}));
}

// copy email
$$('[data-copy]').forEach(b=>b.addEventListener('click',()=>{navigator.clipboard?.writeText(b.dataset.copy);const t=$('#toast');t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1600)}));

watch();

// ---------- v13: motion layer ----------
const fine=matchMedia('(pointer:fine)').matches;
// smooth scroll
if(window.Lenis&&!reduce){const lenis=new Lenis({lerp:.1,smoothWheel:true});const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf);
  if(location.hash){const el=document.querySelector(location.hash);if(el)setTimeout(()=>lenis.scrollTo(el,{offset:-90}),300)}
  window.addEventListener('scroll',()=>document.dispatchEvent(new Event('lscroll')),{passive:true})}
// 3D tilt + sheen on tiles, videos, photos
if(fine&&!reduce)document.addEventListener('mousemove',e=>{const t=e.target.closest('.tile,.vid,.ph');$$('.tilting').forEach(o=>{if(o!==t){o.classList.remove('tilting');o.style.transform=''}});if(!t)return;const r=t.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;t.classList.add('tilting');t.style.setProperty('--sx',px*100+'%');t.style.setProperty('--sy',py*100+'%');t.style.transform=`perspective(900px) rotateX(${(.5-py)*7}deg) rotateY(${(px-.5)*9}deg) translateY(-4px)`});
// timeline line draws with scroll
const lines=$$('.rows');const drawLines=()=>lines.forEach(l=>{const r=l.getBoundingClientRect();l.style.setProperty('--p',Math.min(Math.max((innerHeight*.75-r.top)/r.height,0),1))});
addEventListener('scroll',drawLines,{passive:true});drawLines();
// re-watch tiles rendered by JS
watch();
// count-up stats
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);const el=e.target,n=+el.dataset.count,suf=el.dataset.suf||'',t0=performance.now(),d=1600;const step=t=>{const k=Math.min((t-t0)/d,1),v=Math.round(n*(1-Math.pow(1-k,4)));el.innerHTML=v.toLocaleString()+`<em>${suf}</em>`;if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}),{threshold:.6});
$$('[data-count]').forEach(el=>cio.observe(el));

// halftone portrait
const cv=$('#dots');
if(cv){
  const ctx=cv.getContext('2d'),img=new Image();img.src=cv.dataset.src;
  let W,H,S,dots=[],mx=-1e4,my=-1e4,t0=0,raf=0,active=false;
  const build=()=>{
    const dpr=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    S=Math.max(5,Math.round(W/68));const cols=Math.ceil(W/S),rows=Math.ceil(H/S);
    const o=document.createElement('canvas');o.width=cols;o.height=rows;const oc=o.getContext('2d');
    const k=Math.max(cols/img.width,rows/img.height),iw=img.width*k,ih=img.height*k;oc.drawImage(img,(cols-iw)/2,(rows-ih)/2,iw,ih);
    const d=oc.getImageData(0,0,cols,rows).data;dots=[];
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=(y*cols+x)*4,l=(d[i]*.3+d[i+1]*.59+d[i+2]*.11)/255,al=d[i+3]/255;if(al<.08)continue;dots.push({x:x*S+S/2,y:y*S+S/2,l,al,ox:0,oy:0,dl:(x+y)/(cols+rows)})}
  };
  const draw=t=>{
    const dark=root.dataset.theme==='dark',col=getComputedStyle(root).getPropertyValue('--fg').trim();
    ctx.clearRect(0,0,W,H);ctx.fillStyle=col;const R=W*.18,intro=Math.min((t-t0)/1600,2);let moving=intro<2;
    for(const p of dots){
      let v=dark?p.l:1-p.l;v=Math.min(1,Math.max(.1,(v-.08)*1.25))*p.al;
      const a=Math.min(Math.max((intro-p.dl)*2.2,0),1);if(a<=0)continue;
      const dx=p.x-mx,dy=p.y-my,dd=Math.hypot(dx,dy),f=dd<R?Math.pow(1-dd/R,2):0;
      const tx=f?dx/dd*f*S*3.2:0,ty=f?dy/dd*f*S*3.2:0;p.ox+=(tx-p.ox)*.16;p.oy+=(ty-p.oy)*.16;
      if(Math.abs(tx-p.ox)>.05||Math.abs(ty-p.oy)>.05)moving=true;
      const rad=S*.5*Math.sqrt(v)*(1+f*.5)*(1-Math.pow(1-a,3));
      ctx.beginPath();ctx.arc(p.x+p.ox,p.y+p.oy,rad,0,6.283);ctx.fill();
    }
    raf=(moving||active)?requestAnimationFrame(draw):0;
  };
  const kick=()=>{if(!raf)raf=requestAnimationFrame(draw)};
  img.onload=()=>{build();t0=performance.now();if(reduce)t0-=1e4;kick()};
  addEventListener('resize',()=>{if(img.complete){build();kick()}});
  const mv=e=>{const r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;active=true;kick()};
  cv.addEventListener('pointermove',mv);cv.addEventListener('pointerdown',mv);
  cv.addEventListener('pointerleave',()=>{mx=my=-1e4;active=false;kick()});
  new MutationObserver(kick).observe(root,{attributes:true,attributeFilter:['data-theme']});
}

// name: letters slip into italic near the cursor
(()=>{const n=$('.big-name');if(!n)return;const ls=$$('span',n);
const fix=()=>ls.forEach(s=>{s.style.width='';s.classList.remove('it')}),lock=()=>{fix();ls.forEach(s=>s.style.width=s.offsetWidth+'px')};
document.fonts.ready.then(lock);addEventListener('resize',lock);
const tm=new Map();n.addEventListener('pointermove',e=>ls.forEach(s=>{const r=s.getBoundingClientRect();if(Math.abs(e.clientX-(r.left+r.width/2))<r.width*1.1){s.classList.add('it');clearTimeout(tm.get(s));tm.set(s,setTimeout(()=>s.classList.remove('it'),700))}}))})();
// footer: Ithaca local time
(()=>{const c=$('#clock');if(!c)return;const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'});const u=()=>c.textContent='Ithaca, NY · '+f.format(new Date()).toLowerCase();u();setInterval(u,15000)})();
