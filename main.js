const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- data ---------- */
const PROJECTS=[
 {t:'Thermoelectric A/C',cat:['research','energy'],yr:'2023',d:'Can a temperature gradient cool a room? A Peltier + LTC3108 harvester that powers a fan from waste heat.',m:'Project Paradigm finalist · 5°F cooler at 10 min',tags:['Seebeck effect','Arduino','Experiment'],link:'https://github.com/chiaraluey/2023-A-C-Research-Project',linkLabel:'GitHub repo',poster:null,more:['Selected as a Project Paradigm finalist (top 100 of 50,000+ worldwide).','Built insulated test boxes, a Peltier tile, LTC3108 energy harvester, transformer and capacitor bank, with Arduino thermal + hygrometer logging.','Result: 5°F difference at 10 minutes, 7°F peak at 9 minutes, ~0.5°F/min cooling.']},
 {t:'CO₂ → Ethanol Tailpipe Device',cat:['research','energy'],yr:'2024',d:'An attachable tailpipe device that captures CO₂ and converts it to ethanol using a MOF + catalyst combination.',m:'CJSJ semifinalist · carbon-capture catalyst',tags:['Chemistry','MOFs','Catalysis'],yt:'pEp48JJ8qF8',link:'https://www.youtube.com/watch?v=pEp48JJ8qF8',linkLabel:'Watch the video',poster:'assets/yt-tailpipe.jpg',more:['Original research on a novel carbon-capture catalyst, selected as a Columbia Junior Science Journal semifinalist (~3% acceptance).']},
 {t:'Energy-Free H₂ Catalyst',cat:['research','energy'],yr:'2024',d:'Simulating an energy-free catalyst that splits water for on-demand hydrogen fuel.',m:'Water splitting · simulation',tags:['Python','Electrochemistry','Hydrogen'],link:'https://github.com/chiaraluey/energy-free-catalyst-for-hydrogen-production',linkLabel:'GitHub repo',poster:null,more:['Explores clean hydrogen production without external energy input.','Part of my research arc on clean fuels and carbon capture.']},
 {t:'Underground Climate Change',cat:['research','energy'],yr:'video',d:'A short STEM explainer on the climate effects happening beneath the surface.',m:'YouTube · STEM project',tags:['Climate','Geoscience','Science communication'],yt:'5ZgSESacrg8',link:'https://www.youtube.com/watch?v=5ZgSESacrg8',linkLabel:'Watch the video',poster:'assets/yt-5ZgSESacrg8.jpg',more:['From my YouTube channel of STEM projects.']},
 {t:'Generative AI Math Project',cat:['ai'],yr:'video',d:'A circle-geometry proof walkthrough — congruent central angles ⇔ congruent chords — built as a generative-AI math project.',m:'YouTube · math project',tags:['Math','Generative AI'],yt:'VWfAZupO91A',link:'https://www.youtube.com/watch?v=VWfAZupO91A',linkLabel:'Watch the video',poster:'assets/yt-VWfAZupO91A.jpg',more:['From my YouTube channel of STEM projects.']},
 {t:'AI & Geometry',cat:['ai'],yr:'video',d:'Working a secant–tangent circle problem step by step, pairing AI with classic geometry.',m:'YouTube · math project',tags:['Math','Geometry','AI'],yt:'Xc7NdsnZKLM',link:'https://www.youtube.com/watch?v=Xc7NdsnZKLM',linkLabel:'Watch the video',poster:'assets/yt-Xc7NdsnZKLM.jpg',more:['From my YouTube channel of STEM projects.']},
 {t:'Cornell Nutrition',cat:['web'],yr:'2026',d:'An unofficial, much faster Cornell Dining browser — every menu, every macro, filtered your way.',m:'Live site · auto-scraped daily',tags:['JavaScript','Scraping','GitHub Pages'],link:'https://chiaraluey.github.io/cornell-nutrition/',linkLabel:'Open live site',poster:null,more:['Search across all dining halls, filter by dietary needs and see what’s open right now.','Customize meals and track nutrition totals.','Data is scraped and redeployed automatically.']},
 {t:'Energizing Youth',cat:['energy'],yr:'ongoing',d:'The nonprofit I founded: hands-on clean-energy lessons for K–8 kids in under-resourced schools.',m:'500+ students · Zambia · Brazil',tags:['Education','Nonprofit','Curriculum'],link:'https://energizingyouth.org',linkLabel:'Visit site',poster:'assets/classroom.jpg',more:['Started as a single preschool lesson.','Lessons like Paper Circuits and Wind Power Pinwheels; the 7-Day Energy Challenge.','Branches abroad in Zambia and Brazil.']},
];

/* ---------- loader + split text ---------- */
$$('.split').forEach(el=>{const t=el.textContent;el.textContent='';[...t].forEach((c,i)=>{const s=document.createElement('span');s.className='char';s.textContent=c;s.style.transitionDelay=(.05*i+(el.classList.contains('italic')?.25:0))+'s';el.appendChild(s)})});
addEventListener('load',()=>{setTimeout(()=>{$('#loader').classList.add('done');document.body.classList.add('loaded');$$('.hero .reveal').forEach((e,i)=>{e.style.setProperty('--d',(.4+i*.12)+'s');e.classList.add('in')})},reduce?0:600)});

/* ---------- rotator ---------- */
(()=>{const words=['prove it','power schools','map the grid','teach kids','train models','move policy'];let w=0,i=words[0].length,del=true;const el=$('#rotator');
 const tick=()=>{const cur=words[w];if(del){i--;if(i<=0){del=false;w=(w+1)%words.length}}else{i++;if(i>=words[w].length){del=true;el.textContent=words[w];return setTimeout(tick,2200)}}el.textContent=words[w].slice(0,Math.max(i,0))||'\u00a0';setTimeout(tick,del?40:80)};
 setTimeout(tick,3000)})();

/* ---------- hero canvas: energy grid ---------- */
(()=>{const c=$('#grid'),x=c.getContext('2d');let W,H,nodes=[],pulses=[],mouse={x:-999,y:-999},dpr=Math.min(devicePixelRatio,2);
 const acc=()=>getComputedStyle(document.documentElement).getPropertyValue('--acc').trim();
 function init(){W=c.offsetWidth;H=c.offsetHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);const n=Math.round(W*H/16000);nodes=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.6+.6}))}
 init();addEventListener('resize',init);
 c.parentElement.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top});
 c.parentElement.addEventListener('mouseleave',()=>mouse={x:-999,y:-999});
 let visible=true;new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(c);
 function frame(){requestAnimationFrame(frame);if(!visible)return;const A=acc();x.clearRect(0,0,W,H);const D=130;
  for(const n of nodes){n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1;const dx=n.x-mouse.x,dy=n.y-mouse.y,dm=Math.hypot(dx,dy);if(dm<160){n.x+=dx/dm*.8;n.y+=dy/dm*.8}}
  x.lineWidth=1;
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<D){const near=Math.hypot((a.x+b.x)/2-mouse.x,(a.y+b.y)/2-mouse.y)<200;x.strokeStyle=near?A:'rgba(150,160,150,'+(1-d/D)*.18+')';x.globalAlpha=near?(1-d/D)*.7:1;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();x.globalAlpha=1;if(!reduce&&Math.random()<.0008&&pulses.length<40)pulses.push({a,b,t:0})}}
  for(const n of nodes){x.fillStyle='rgba(200,210,200,.5)';x.beginPath();x.arc(n.x,n.y,n.r,0,7);x.fill()}
  x.fillStyle=A;x.shadowColor=A;x.shadowBlur=12;
  pulses=pulses.filter(p=>{p.t+=.02;if(p.t>1)return false;const px=p.a.x+(p.b.x-p.a.x)*p.t,py=p.a.y+(p.b.y-p.a.y)*p.t;x.beginPath();x.arc(px,py,2.2,0,7);x.fill();return true});
  x.shadowBlur=0}
 frame()})();

/* ---------- reveals ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15,rootMargin:'0px 0px -40px 0px'});
const watch=()=>$$('.reveal:not(.in)').forEach(el=>{if(!el.closest('.hero')){const sib=[...el.parentElement.children].filter(c=>c.classList.contains('reveal'));el.style.setProperty('--d',Math.min(sib.indexOf(el),6)*.08+'s');io.observe(el)}});

/* ---------- counters ---------- */
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,end=+el.dataset.count,suf=el.dataset.suffix||'',t0=performance.now(),dur=2000;cio.unobserve(el);
 const step=t=>{const p=Math.min((t-t0)/dur,1),v=Math.round(end*(1-Math.pow(1-p,4)));el.innerHTML=v.toLocaleString()+'<span class="suf">'+suf+'</span>';if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step)}),{threshold:.5});
$$('[data-count]').forEach(el=>cio.observe(el));

/* ---------- projects ---------- */
const grid=$('#projectGrid');
grid.innerHTML=PROJECTS.map((p,i)=>`<button class="proj reveal tilt${p.poster?' has-poster':''}" data-i="${i}" data-cat="${p.cat.join(' ')}">${p.poster?`<div class="proj-poster"><img src="${p.poster}" alt="" loading="lazy"></div>`:''}<div class="proj-top"${p.poster?' style="margin-top:1.4rem"':''}><span class="proj-ico">${String(i+1).padStart(2,"0")}</span><span class="mono">${p.yr}</span></div><span class="open">↗</span><h3>${p.t}</h3><p>${p.d}</p><div class="metric">${p.m}</div><div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div></button>`).join('');
$$('.filter').forEach(b=>b.addEventListener('click',()=>{$$('.filter').forEach(f=>f.classList.remove('active'));b.classList.add('active');const f=b.dataset.filter;
 $$('.proj').forEach((p,i)=>{const show=f==='all'||p.dataset.cat.includes(f);p.classList.toggle('hide',!show);if(show){p.classList.remove('in');p.style.setProperty('--d',0);requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add('in')))}})}));
const modal=$('#projModal');
grid.addEventListener('click',e=>{const card=e.target.closest('.proj');if(!card)return;const p=PROJECTS[card.dataset.i];
 $('#projBody').innerHTML=`<span class="mono" style="color:var(--mute)">${p.yr} · ${p.cat.join(" / ")}</span><h3>${p.t}</h3><p class="mono" style="color:var(--acc)">${p.m}</p>${p.yt?`<div class="lb-frame" style="width:100%;transform:none;margin:1rem 0"><iframe src="https://www.youtube-nocookie.com/embed/${p.yt}?rel=0" allow="encrypted-media; fullscreen" allowfullscreen title="${p.t}"></iframe></div>`:p.poster?`<img class="modal-poster" src="${p.poster}" alt="${p.t} poster">`:''}<p>${p.d}</p><ul>${p.more.map(m=>`<li>${m}</li>`).join('')}</ul><div class="tags">${p.tags.map(t=>`<span>${t}</span>`).join('')}</div><a class="btn btn-primary" href="${p.link}" target="_blank" rel="noopener">${p.linkLabel} ↗</a>`;
 open(modal)});

/* ---------- overlays ---------- */
function open(el){el.classList.add('open');el.setAttribute('aria-hidden','false')}
function close(el){el.classList.remove('open');el.setAttribute('aria-hidden','true');if(el.id==='lightbox')setTimeout(()=>$('#lbFrame').innerHTML='',400);if(el.id==='projModal')setTimeout(()=>$('#projBody').innerHTML='',400)}
$$('.lightbox,.modal,.cmd').forEach(el=>el.addEventListener('click',e=>{if(e.target===el||e.target.closest('.lb-close'))close(el)}));
$$('[data-yt]').forEach(b=>b.addEventListener('click',()=>playYT(b.dataset.yt)));
function playYT(id){$('#lbFrame').innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Video"></iframe>`;open($('#lightbox'))}

/* ---------- command palette ---------- */
const cmd=$('#cmd'),inp=$('#cmdInput'),list=$('#cmdList');let sel=0,items=[];
const go=h=>()=>document.querySelector(h).scrollIntoView({behavior:'smooth'});
const ACTIONS=[
 {l:'Impact',k:'section',f:go('#impact')},{l:'Experience',k:'section',f:go('#work')},{l:'Projects',k:'section',f:go('#projects')},{l:'Media & press',k:'section',f:go('#media')},{l:'Contact',k:'section',f:go('#contact')},
 {l:'Watch TEDx — Circles',k:'video',f:()=>playYT('wiUsqBOQTuw')},{l:'Watch award video',k:'video',f:()=>playYT('C1NDCvmvOU0')},{l:'Watch CO₂ → ethanol research',k:'video',f:()=>playYT('pEp48JJ8qF8')},
 {l:'Copy email',k:'action',f:()=>copyEmail()},{l:'Toggle light / dark',k:'action',f:()=>toggleTheme()},
 {l:'LinkedIn',k:'link',f:()=>window.open('https://www.linkedin.com/in/chiara-luey')},{l:'GitHub',k:'link',f:()=>window.open('https://github.com/chiaraluey')},{l:'Globe Anew podcast',k:'link',f:()=>window.open('https://globeanew.net/episodes/chiara-luey-climate-movement-before-college')},{l:'Energizing Youth',k:'link',f:()=>window.open('https://energizingyouth.org')},
 ...PROJECTS.map((p,i)=>({l:p.t,k:'project',f:()=>{go('#projects')();setTimeout(()=>$(`.proj[data-i="${i}"]`).click(),500)}}))];
function render(){const q=inp.value.toLowerCase();items=ACTIONS.filter(a=>(a.l+' '+a.k).toLowerCase().includes(q));sel=Math.min(sel,Math.max(items.length-1,0));
 list.innerHTML=items.map((a,i)=>`<li class="${i===sel?'sel':''}" data-i="${i}">${a.l}<small>${a.k}</small></li>`).join('')||'<li>No results</li>'}
function openCmd(){open(cmd);inp.value='';sel=0;render();setTimeout(()=>inp.focus(),50)}
function run(i){const a=items[i];if(!a)return;close(cmd);a.f()}
inp.addEventListener('input',()=>{sel=0;render()});
list.addEventListener('click',e=>{const li=e.target.closest('li[data-i]');if(li)run(+li.dataset.i)});
list.addEventListener('mousemove',e=>{const li=e.target.closest('li[data-i]');if(li&&+li.dataset.i!==sel){sel=+li.dataset.i;render()}});
$('#cmdOpen').addEventListener('click',openCmd);
addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();cmd.classList.contains('open')?close(cmd):openCmd();return}
 if(e.key==='Escape')$$('.open').forEach(close);
 if(cmd.classList.contains('open')){if(e.key==='ArrowDown'){sel=(sel+1)%items.length;render();e.preventDefault()}if(e.key==='ArrowUp'){sel=(sel-1+items.length)%items.length;render();e.preventDefault()}if(e.key==='Enter')run(sel)}
 else if(e.key==='/'&&document.activeElement===document.body){e.preventDefault();openCmd()}});

/* ---------- theme ---------- */
const root=document.documentElement;const saved=localStorage.getItem('theme');if(saved)root.dataset.theme=saved;
function toggleTheme(){root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('theme',root.dataset.theme)}
$('#themeToggle').addEventListener('click',toggleTheme);

/* ---------- email ---------- */
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)};
function copyEmail(){navigator.clipboard?.writeText('chiara@luey.us').then(()=>toast('Email copied ✓'),()=>location.href='mailto:chiara@luey.us')}
$('#copyEmail').addEventListener('click',copyEmail);

/* ---------- cursor, magnetic, tilt ---------- */
if(matchMedia('(pointer:fine)').matches&&!reduce){
 const cur=$('#cursor'),dot=$('#cursorDot');let mx=0,my=0,cx=0,cy=0;
 addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform=`translate(${mx}px,${my}px)`});
 (function loop(){cx+=(mx-cx)*.18;cy+=(my-cy)*.18;cur.style.transform=`translate(${cx}px,${cy}px)`;requestAnimationFrame(loop)})();
 document.addEventListener('mouseover',e=>cur.classList.toggle('hover',!!e.target.closest('a,button,.g,.chips span')));
 $$('[data-magnetic]').forEach(el=>{el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.25}px,${(e.clientY-r.top-r.height/2)*.35}px)`});el.addEventListener('mouseleave',()=>el.style.transform='')});
 document.addEventListener('mousemove',e=>{const t=e.target.closest('.tilt');if(!t)return;const r=t.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;t.style.setProperty('--mx',px*100+'%');t.style.setProperty('--my',py*100+'%');if(t.classList.contains('in'))t.style.transform=`perspective(900px) rotateX(${(.5-py)*6}deg) rotateY(${(px-.5)*6}deg)`});
 document.addEventListener('mouseout',e=>{const t=e.target.closest('.tilt');if(t&&!t.contains(e.relatedTarget))t.style.transform=''});
}

/* ---------- scroll: progress, nav hide, timeline fill, active link, parallax ---------- */
let lastY=0;const nav=$('#nav'),prog=$('#progress'),tl=$('.timeline'),fill=$('#tlFill'),links=$$('.nav-links a'),secs=links.map(a=>$(a.getAttribute('href')));
function onScroll(){const y=scrollY,h=document.documentElement.scrollHeight-innerHeight;prog.style.transform=`scaleX(${y/h})`;
 nav.classList.toggle('hide',y>lastY&&y>400&&!$('.open'));lastY=y;
 const r=tl.getBoundingClientRect();fill.style.transform=`scaleY(${Math.min(Math.max((innerHeight*.6-r.top)/r.height,0),1)})`;
 let cur=-1;secs.forEach((s,i)=>{if(s.getBoundingClientRect().top<innerHeight*.4)cur=i});links.forEach((l,i)=>l.classList.toggle('active',i===cur));
 if(!reduce){$('.hero-visual').style.translate=`0 ${y*.15}px`;$('.float-img').style.translate=`0 ${(r.top*0)+(-$('.about').getBoundingClientRect().top*.08)}px`}}
addEventListener('scroll',onScroll,{passive:true});onScroll();

$('#yr').textContent=new Date().getFullYear();
setInterval(()=>$('#clock').textContent='Ithaca '+new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit'}),1000);
watch();
