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
// cursor with label + aura
if(fine&&!reduce){
  const cur=$('#cur'),lab=$('span',cur),aura=$('.aura');let x=innerWidth/2,y=innerHeight/2,cx=x,cy=y,ax=x,ay=y;
  addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY;document.body.classList.add('has-cur')});
  const tick=()=>{cx+=(x-cx)*.22;cy+=(y-cy)*.22;ax+=(x-ax)*.05;ay+=(y-ay)*.05;cur.style.transform=`translate(${cx}px,${cy}px)`;aura.style.transform=`translate(${ax}px,${ay}px)`;requestAnimationFrame(tick)};tick();
  document.addEventListener('mouseover',e=>{const t=e.target.closest('a,button,[data-yt],[data-full]');cur.classList.toggle('big',!!t);if(t){lab.textContent=t.matches('[data-yt]')?'play':t.matches('.tile')?'open':t.matches('[data-full]')?'view':(t.target==='_blank'?'visit ↗':t.matches('.theme')?'':'')}else lab.textContent=''});
}
// magnetic buttons
if(fine&&!reduce)$$('.btn,.f,.theme,.copy').forEach(b=>{b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`});b.addEventListener('mouseleave',()=>b.style.transform='')});
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
document.addEventListener('pointermove',e=>{const c=e.target.closest('.rc');if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty('--mx',e.clientX-r.left+'px');c.style.setProperty('--my',e.clientY-r.top+'px')});
