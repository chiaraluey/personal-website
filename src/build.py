"""Generates the static pages. Run: python3 src/build.py"""
import os, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = '46'
E = html.escape

NAV = [('about.html', 'About'), ('work.html', 'Work'), ('projects.html', 'Projects & Research'), ('press.html', 'Press'), ('service.html', 'Service'), ('jewelry.html', 'Jewelry'), ('design.html', 'Design'), ('campus.html', '3D Campus')]
SOCIALS = [('LinkedIn', 'https://www.linkedin.com/in/chiara-luey'), ('GitHub', 'https://github.com/chiaraluey'), ('YouTube', 'https://www.youtube.com/@ChiaraLuey')]

THEME_BOOT = "<script>(()=>{const t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;if(location.search.includes('embed'))document.documentElement.classList.add('embed')})()</script>"
SUN = '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>'
MOON = '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'

THEME_BTN = f'<button class="theme" id="theme" aria-label="Toggle dark mode">{SUN}{MOON}</button>'

def ext(url):
    return ' target="_blank" rel="noopener"' if url.startswith('http') else ''

def page(slug, title, desc, body, scripts='', hdr=None):
    header = hdr.format(nav='{nav}', theme=THEME_BTN) if hdr else ('' if slug == 'index.html' else '<header class="top"><a class="brand" href="index.html">← Chiara Luey</a></header>')
    cur = ' aria-current="page"'
    nav = ''.join(f'<a href="{h}"{cur if h == slug else ""}>{n}</a>' for h, n in NAV)
    soc = ''.join(f'<a href="{u}"{ext(u)}>{n}</a>' for n, u in SOCIALS)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta property="og:title" content="{E(title)}"><meta property="og:image" content="assets/portrait.jpg">
{THEME_BOOT}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="site.css?v={V}">
</head>
<body class="p-{slug.split('.')[0]}">
{header.replace('{nav}', nav)}
<main class="main">
{body}
</main>
<footer class="ftr">
  <nav class="ftr-nav">{nav}</nav>
  <button class="copy" data-copy="chiara@luey.us">chiara@luey.us</button>
  <div class="ftr-links">{soc}</div>
  <span class="ftr-c"><span class="clock" id="clock">Ithaca, NY</span> © 2026 Chiara Luey {THEME_BTN}</span>
</footer>
<div class="lb" id="lb" aria-hidden="true"><button class="lb-x" aria-label="Close">✕</button><div class="lb-body" id="lbBody"></div></div>
<div class="hover-img" id="hoverImg" aria-hidden="true"><img alt=""></div>
<div class="toast" id="toast">Copied</div>
<script src="https://unpkg.com/lenis@1.1.13/dist/lenis.min.js"></script>
{scripts}<script src="site.js?v={V}"></script>
</body>
</html>
'''

def logo(src, name):
    if src:
        return f'<span class="logo"><img src="assets/logos/{src}" alt="" loading="lazy"></span>'
    initials = ''.join(w[0] for w in name.replace('&', '').split()[:2]).upper()
    return f'<span class="logo mono-logo">{initials}</span>'

def rows(items):
    out = []
    for it in items:
        name, role, date, desc, src, url = it
        tag, attrs = ('a', f' href="{url}"{ext(url)}') if url else ('div', '')
        arrow = '<i class="arr">↗</i>' if url else ''
        out.append(f'<li class="reveal"><{tag} class="row"{attrs}>{logo(src, name)}<span class="row-main"><span class="row-org">{E(name)}{arrow}</span><span class="row-role">{E(role)}</span>{f"<span class=row-desc>{E(desc)}</span>" if desc else ""}</span><span class="row-date">{E(date)}</span></{tag}></li>')
    return '<ul class="rows">' + ''.join(out) + '</ul>'

def head(title, sub):
    return f'<div class="page-head"><h1 class="page-title" data-split>{title}</h1><p class="page-sub reveal">{sub}</p></div>'

# ---------- home ----------
INDEX = [
    ('work.html', 'Work', 'Cornell VC, WestLight, Stanford, PlateTale', 'assets/pce-team.jpg'),
    ('projects.html', 'Projects & Research', 'Research posters, papers and code', 'assets/ac-poster.jpg'),
    ('press.html', 'Press', 'TEDx, podcasts and articles', 'assets/yt-tedx.jpg'),
    ('service.html', 'Service', 'Energizing Youth, the UN youth group, honors', 'assets/classroom.jpg'),
    ('jewelry.html', 'Jewelry', 'Chiara Malia, my jewelry brand', 'assets/cm-1.jpg'),
]
home = f'''<section class="home">
  <div class="home-text">
    <p class="hello reveal">Hi! Nice to meet you.</p>
    <h1 class="home-name" data-split>I’m Chiara Luey.</h1>
    <p class="lead reveal">A freshman at Cornell studying Environmental Engineering. I love energy and economics: how clean power gets invented, paid for and brought to the people who need it most.</p>
    <ul class="index">{''.join(f'<li class="reveal"><a href="{h}" data-img="{img}"><span class="ix-t">{t}</span><span class="ix-d">{d}</span><i>→</i></a></li>' for h, t, d, img in INDEX)}</ul>
  </div>
  <figure class="home-photo"><img src="assets/portrait.jpg" alt="Chiara Luey"></figure>
</section>'''

# ---------- work ----------
CORNELL = [
    ('Cornell University', 'B.S. Environmental Engineering', '2026 — 2030', 'Ithaca, NY. Coursework and certificates in quantitative modeling (Wharton) and modelling and measuring the energy transition (Politecnico di Milano).', 'cornell-seal.svg', 'https://www.cornell.edu'),
    ('Cornell Venture Capital', 'New Member Education · Fall ’26 class', '2026 — now', 'Working alongside the club’s VCs on sourcing and diligence, and on the deal team for Cognition AI. Writing investment theses on seed and Series A AI-infrastructure startups, including Hatchet, Atomic, Frenos, ZeroDrift and Build.', 'cvc.svg', 'https://cornellvc.com'),
    ('Energy Transition Club', 'Member', '2026 — now', 'Undergraduate organization preparing members to lead in the energy transition through New Member Education, analytical project teams (energy storage, grid modernization, carbon capture, climate policy and more), site visits and speaker sessions.', 'etc.png', 'https://www.cornelletc.org'),
]
EXPERIENCE = [
    ('PlateTale', 'Operations & Growth Intern', 'Jun — Aug 2026', 'Helped take an AI food-tech startup from 0 to 1 by building chef and customer partnerships, reaching out to 100+ prospective customers and VC-backed startups, and refining its AI taste model. Secured 3 VC sponsors and hosted the flagship dinner club, convening 20 founders from Stanford, Berkeley, MIT and YC-backed companies.', 'platetale.png', 'https://platetale.com'),
    ('WestLight Energy', 'Clean Energy Advisor · former intern', 'Mar 2025 — now', 'Manage a $50K electrification grant, mentor interns and expand K–12 outreach to 360+ students across the Peninsula. Co-led Electric-First campaigns that passed clean-energy resolutions in 4 school districts, mobilizing 9,000+ students and cutting an estimated 2M+ kg of CO₂ a year. Represented Peninsula Clean Energy at regional energy events and guest-spoke to 400+ students.', 'westlight-mark.png', 'https://www.westlightenergy.org'),
    ('Shields Mobility', 'Research Analyst', 'Jun 2025 — Apr 2026', 'Sourced and scored 300+ EV commercial-fleet charging sites across California, identifying high-potential acquisitions and tracking incentive programs to steer investment toward underserved infrastructure. Built an ArcGIS site to visualize and sort properties.', None, 'https://www.shieldsmobility.com'),
    ('RE-volv', 'Analyst', 'Apr 2025 — Mar 2026', 'Built and pitched a solar financing proposal for a church, modeling 30%+ federal incentives, 20-year project economics and projected energy savings. Collaborated with Peninsula Clean Energy to expand nonprofit solar across the Bay Area.', 'revolv-color.png', 'https://re-volv.org'),
    ('Stanford University · Chemistry', 'Research Intern', 'Jun — Jul 2025', 'Assisted graduate-student projects in computational molecular physics and energy storage in the Waymouth and Rotskoff labs.', 'stanford-s.svg', 'https://chemistry.stanford.edu'),
    ('Elytra Robotics', 'Market Researcher', 'Feb — Aug 2025', 'Merged 2 public datasets and used spatial clustering and predictive modeling to map trash hot spots for autonomous waste collection. Supported Elytra, a 10-person robotics-infrastructure startup later acquired by a hardware company serving Generalist and Dyna.', 'elytra.png', 'https://elytrarobotics.com'),
]
RESEARCH = [
    ('Independent research', 'Sustainability & materials science', '2022 — 2026', 'Simulated copper–MOF catalytic pathways that turn vehicle CO₂ into ethanol, reaching 91% Faradaic efficiency, and published a paper with mentors from MIT, Stanford and Washington State. Prototyped an LTC3108-based air conditioner that cools without refrigerants. Presented at ICAE (UN Bangkok), Columbia Junior Science Journal, MIT THINK, JSHS and the California Science & Engineering Fair.', None, 'projects.html'),
    ('Crystal Springs Uplands School', 'High school · 4.12 GPA', '2019 — 2026', 'Distinguished Award in Science. President of STEM Invention Studio: mentored 20+ members, grew membership 50% and ran a research symposium with 15 guest judges. Elected to Student Government for 6 years, including Co-President; led 30+ events, from a $50K prom to Social Justice Week.', 'csus.png', 'https://www.csus.org'),
]
STATS = [(9000, '+', 'students mobilized by Electric-First campaigns'), (2, 'M+ kg', 'CO₂ cut per year (est.)'), (300, '+', 'EV fleet-charging sites scored'), (50, 'K', 'electrification grant managed ($)'), (500, '+', 'K–8 students taught'), (91, '%', 'Faradaic efficiency in my MOF research')]
stats_html = '<div class="stats">' + ''.join(f'<div class="stat reveal"><b data-count="{n}" data-suf="{E(su)}">0</b><span>{E(l)}</span></div>' for n, su, l in STATS) + '</div>'
work = head('Work', 'Clean energy, venture and research. Every row links to the organization.') + stats_html + f'''
<section class="group" id="cornell"><h2 class="g-t reveal">At Cornell</h2>{rows(CORNELL)}</section>
<section class="group" id="experience"><h2 class="g-t reveal">Experience</h2>{rows(EXPERIENCE)}</section>
<section class="group" id="research"><h2 class="g-t reveal">Research & school</h2>{rows(RESEARCH)}</section>
<p class="more reveal"><a href="https://www.linkedin.com/in/chiara-luey" target="_blank" rel="noopener">Full history on LinkedIn ↗</a></p>'''

# ---------- projects ----------
projects = head('Projects &amp; Research', 'Science-fair research, a published paper and things I’ve built. Click one for posters and details.') + '''
<div class="filters reveal"><button class="f on" data-f="all">All</button><button class="f" data-f="research">Research</button><button class="f" data-f="energy">Energy</button><button class="f" data-f="web">Web</button></div>
<div class="tiles" id="tiles"></div>
<p class="more reveal"><a href="https://github.com/chiaraluey" target="_blank" rel="noopener">More on GitHub ↗</a></p>'''

# ---------- press ----------
VIDEOS = [('wiUsqBOQTuw', 'assets/yt-tedx.jpg', 'TEDx Crystal Springs Youth', 'Circles'), ('C1NDCvmvOU0', 'assets/yt-award.jpg', 'Sustainable San Mateo County', 'Youth Sustainability Award'), ('pEp48JJ8qF8', 'assets/yt-tailpipe.jpg', 'Research video', 'CO₂ → ethanol tailpipe device')]
ARTICLES = [
    ('Starting a Climate Movement Before College', 'Globe Anew · Podcast', 'https://globeanew.net/episodes/chiara-luey-climate-movement-before-college', 'assets/art-globe.jpg'),
    ('2026 Youth Sustainability Award Winner', 'Sustainable San Mateo County', 'https://sustainablesanmateo.org/2026/01/15/2026-youth-sustainability-award-winner-chiara-luey/', 'assets/award-card.jpg'),
    ('Class Notes: Chiara Luey named award winner', 'San Mateo Daily Journal', 'https://www.smdailyjournal.com/community/class-notes-chiara-luey-named-2026-youth-sustainability-award-winner-by-sustainable-san-mateo-county/image_5a49ca98-437d-4ee4-a4cd-7eb466e898de.html', 'assets/art-smdj.jpg'),
    ('Interview Series: Chiara Luey', 'Awesome Math Girls', 'https://awesomemathgirls.org/posts/interview-series-featuring-chiara-luey/', 'assets/poster-session.jpg'),
    ('From Classrooms to County: the Peninsula’s first electrification outreach team', 'Silicon Valley Youth Climate Action', 'https://www.linkedin.com/posts/silicon-valley-youth-climate-action_from-classrooms-to-county-how-a-group-of-activity-7448157926998872064-Fyjr', 'assets/art-li.jpg'),
    ('How Energizing Youth started', 'energizingyouth.org', 'https://energizingyouth.org/our-story', 'assets/classroom.jpg'),
    ('STEM projects & research videos', 'YouTube', 'https://www.youtube.com/@ChiaraLuey/videos', 'assets/yt-5ZgSESacrg8.jpg'),
]
PHOTOS = [('assets/classroom.jpg', 'Energizing Youth lesson'), ('assets/podium.jpg', 'Speaking'), ('assets/pce-team.jpg', 'Peninsula Clean Energy team'), ('assets/poster-session.jpg', 'Poster session'), ('assets/award-card.jpg', 'Youth Sustainability Award'), ('assets/friends.jpg', 'With friends')]
press = head('Press', 'Talks, interviews and articles.') + f'''
<div class="videos">{''.join(f'<button class="vid reveal{" big" if i == 0 else ""}" data-yt="{y}"><img src="{img}" alt="" loading="lazy"><span class="play">▶</span><span class="vid-cap"><small>{E(s)}</small>{E(t)}</span></button>' for i, (y, img, s, t) in enumerate(VIDEOS))}</div>
<section class="group"><h2 class="g-t reveal">Articles & podcasts</h2><ul class="articles">{''.join(f'<li class="reveal"><a class="art" href="{u}" target="_blank" rel="noopener"><span class="art-th"><img src="{img}" alt="" loading="lazy"></span><span class="art-m"><span class="art-t">{E(t)}</span><span class="art-s">{E(s)}</span></span><i class="arr">↗</i></a></li>' for t, s, u, img in ARTICLES)}</ul></section>
<blockquote class="quote reveal">“There’s something that happens when a peer stands up and talks about clean energy.”<cite>On youth-led electrification</cite></blockquote>
<section class="group"><h2 class="g-t reveal">Photos</h2><div class="photos">{''.join(f'<button class="ph reveal" data-full="{s}"><img src="{s}" alt="{E(c)}" loading="lazy"><span>{E(c)}</span></button>' for s, c in PHOTOS)}</div></section>'''

# ---------- service ----------
SERVICE = [
    ('Energizing Youth', 'Founder → board member', '2024 — now', 'Clean-energy lessons for 500+ K–8 students, with branches in Zambia and Brazil.', None, 'https://energizingyouth.org'),
    ('UN Major Group for Children & Youth', 'Individual Delegate', '2025 — 2026', 'Youth delegate on sustainable development.', 'mgcy.png', 'https://www.unmgcy.org'),
    ('California Association of Youth Commissions', 'Steering Committee, Chair of Events', '2025 — 2026', 'Statewide network of 500+ youth commissioners across 20+ cities.', None, None),
    ('National Charity League', 'VP Communications · past President', '2020 — 2026', 'Raised $16,000 for My New Red Shoes across 40+ service initiatives.', None, 'https://www.nationalcharityleague.org'),
    ('Hillsborough Youth Commission', 'Environmental Chair', '', 'School waste audits that cut landfill waste by 25%.', None, None),
    ('Silicon Valley Youth Climate Action', 'Youth advocate', '', 'Electric-First resolutions; spoke before the Sequoia Union HSD board.', None, 'https://www.linkedin.com/posts/silicon-valley-youth-climate-action_from-classrooms-to-county-how-a-group-of-activity-7448157926998872064-Fyjr'),
    ('STEM Invention Studio', 'President', '2023 — 2026', 'Grew membership 50% and ran a research symposium with 15 judges.', None, None),
]
HONORS = [('Nov 2026', 'Judges’ Choice, Local AI Hackathon', 'Cornell Commons · Adam, an offline AI econ tutor'), ('2026', 'NCWIT Aspirations in Computing', 'National Award'), ('2026', 'Youth Sustainability Award', 'Sustainable San Mateo County'), ('2026', 'TEDx speaker', 'TEDxCrystal Springs Youth · “Circles”'), ('', 'Elks Foundation Scholarship', 'Elks National Foundation'), ('', 'Project Paradigm finalist', 'Top 100 internationally'), ('', 'Columbia Junior Science Journal', 'Semifinalist'), ('2×', 'National Women in Geoscience', ''), ('', 'Intl. Astrophysics & Astronomy Competition', 'Silver Finalist'), ('Gold', 'Presidential Volunteer Service Award', 'Young Adult'), ('', 'National Merit', 'Commended')]
service = head('Service', 'Volunteering, youth policy, and the recognition along the way.') + f'''
<section class="group"><h2 class="g-t reveal">Volunteering</h2>{rows(SERVICE)}</section>
<section class="group"><h2 class="g-t reveal">Honors</h2><ul class="honors">{''.join(f'<li class="reveal"><span class="h-y">{E(y)}</span><span class="h-t">{E(t)}</span><span class="h-o">{E(o)}</span></li>' for y, t, o in HONORS)}</ul></section>'''

# ---------- jewelry ----------
CM = [('cm-1.jpg', 'Onda stud + Mare huggie'), ('cm-2.jpg', 'Onda + Mare Station necklaces'), ('cm-3.jpg', 'Onda cuff · Marea bangle'), ('cm-4.jpg', 'Wave bangles'), ('cm-5.jpg', 'On the shoreline')]
jewelry = head('Chiara Malia', 'A wave, caught in gold. My jewelry brand.') + f'''
<div class="cm-strip reveal">{''.join(f'<figure><img src="assets/{s}" alt="{E(c)}" loading="lazy"><figcaption>{E(c)}</figcaption></figure>' for s, c in CM)}</div>
<div class="cm-copy">
  <p class="reveal">In Italian, <em>chiara</em> means clear and bright; <em>malìa</em> is an old word for a charm, a little spell. The brand started as waves drawn in the margins of my notebooks, the same curl sketched over and over until it felt like the sea. That curl became the Onda wave.</p>
  <p class="reveal">The first collection, <em>Onda e Marea</em>, takes three ideas from the shoreline: Onda, the wave as it curls over; Marea, the line the tide leaves on sand; Mare, sky-blue stones in a blue I call <em>Blu Cielo</em>.</p>
  <dl class="facts reveal"><div><dt>Collection</dt><dd>Onda e Marea · 19 pieces</dd></div><div><dt>Materials</dt><dd>14k gold-filled · sterling silver</dd></div><div><dt>From</dt><dd>$52</dd></div><div><dt>Giving back</dt><dd>Ocean conservation · women’s shelters</dd></div></dl>
  <a class="btn reveal" href="https://www.chiaramalia.com/" target="_blank" rel="noopener">Visit chiaramalia.com ↗</a>
</div>'''


# ---------- landing ----------
def lk(href, text, logo='', only=False, pic=''):
    img = f'<img src="assets/logos/{logo}" alt="{E(text) if only else ""}">' if logo else ''
    di = f' data-img="{pic}"' if pic else ''
    return f'<a class="lk{" lk-only" if only else ""}" href="{href}"{ext(href)}{di}>{img}{"" if only else E(text)}</a>'
RESEARCH = [
    ('Copper–MOF catalysts for converting CO₂ into ethanol', 'projects.html', 'assets/mof-poster.jpg', '91% Faradaic efficiency. Published with mentors from MIT, Stanford and Washington State.', 'ICAE (with the UN, Bangkok) · MIT THINK · JSHS · Columbia Junior Science Journal'),
    ('Refrigerant-free thermoelectric air conditioning', 'projects.html', 'assets/poster-session.jpg', 'A low-power cooling system built around an LTC3108 energy harvester.', 'California Science & Engineering Fair'),
]
di = lambda im: f' data-img="{im}"' if im else ''
res_html = ''.join(f'<li><a class="r-t" href="{h}"{ext(h)}{di(im)}>{E(t)}</a><p>{E(d)}</p><p class="venue">{E(v)}</p></li>' for t, h, im, d, v in RESEARCH)
PRESS_ITEMS = [(t, o, u, im) for t, o, u, im in ARTICLES[:4]]
press_html = '<li><button class="r-t" data-yt="wiUsqBOQTuw" data-img="assets/yt-tedx.jpg">“Circles”, my TEDx talk</button><span>TEDxCrystal Springs Youth</span></li>' + ''.join(f'<li><a class="r-t" href="{u}" target="_blank" rel="noopener" data-img="{im}">{E(t)}</a><span>{E(o)}</span></li>' for t, o, u, im in PRESS_ITEMS)
LOGOS = [('cornell-seal.svg', 'Cornell'), ('stanford-s.svg', 'Stanford'), ('cognition.svg', 'Cognition'), ('cvc.svg', 'Cornell VC'), ('ted.svg', 'TEDx'), ('un.svg', 'UN'), ('westlight-mark.png', 'WestLight'), ('revolv-color.png', 'RE-volv'), ('platetale.png', 'PlateTale'), ('elytra.png', 'Elytra'), ('etc.png', 'ETC')]
logos_html = ''.join(f'<img src="assets/logos/{s}" alt="{E(n)}" title="{E(n)}">' for s, n in LOGOS)
landing = f'''<section class="intro">
  <div class="intro-t">
    <h1 class="big-name" aria-label="Chiara Luey">{''.join(f'<span aria-hidden="true" style="--i:{i}">{c}</span>' if c != ' ' else ' ' for i, c in enumerate('Chiara Luey'))}</h1>
    <svg class="ink" viewBox="0 0 400 24" aria-hidden="true"><path d="M2 14 C 30 4, 52 4, 76 13 S 124 23, 150 12 S 200 2, 226 12 S 276 22, 302 12 S 350 4, 398 10"/></svg>
    <p class="intro-sub">Environmental Engineering at Cornell</p>
    <p class="intro-links"><a href="mailto:chiara@luey.us">Email</a><a href="https://www.linkedin.com/in/chiara-luey" target="_blank" rel="noopener">LinkedIn</a><a href="https://github.com/chiaraluey" target="_blank" rel="noopener">GitHub</a></p>
    <p class="intro-pages">{''.join(f'<a href="{h}">{n}</a>' for h, n in NAV[:-1])}</p>
  </div>
  <figure class="dots-wrap"><canvas id="dots" data-src="assets/portrait-cut.png" aria-label="Portrait of Chiara Luey"></canvas></figure>
</section>
<div class="home">

  <section class="h-sec reveal h-thesis">
    <p class="thesis">Interested in venture capital, finance, AI, operations and energy.</p>
    <p class="skills"><span>Skills:</span> Python, financial modeling, diligence, ArcGIS, predictive modeling, AI data cleaning</p>
  </section>

  <section class="h-sec reveal">
    <h2>Work</h2>
    <p>I study Environmental Engineering at {lk('https://www.cornell.edu', 'Cornell', 'cornell-seal.svg')}. I’m on the {lk('https://cornellvc.com', 'Cornell Venture Capital', 'cvc.svg')} deal team for {lk('https://cognition.ai', 'Cognition AI', 'cognition.svg', True)}, and a member of the {lk('https://www.cornelletc.org', 'Energy Transition Club', 'etc.png')}.</p>
    <p>I’m a Clean Energy Advisor at {lk('work.html#experience', 'WestLight Energy', 'westlight-mark.png', pic='assets/pce-team.jpg')}, where I co-led Electric-First campaigns in 4 school districts, mobilizing 9,000+ students for an estimated 2M+ kg of CO₂ cut a year.</p>
    <p>Before that, I was a research intern in {lk('work.html#experience', 'Stanford Chemistry', 'stanford-s.svg', pic='assets/poster-session.jpg')}, an operations &amp; growth intern at {lk('work.html#experience', 'PlateTale', 'platetale.png')}, an analyst at {lk('https://re-volv.org', 'RE-volv', 'revolv-color.png')} and a market researcher at {lk('https://elytrarobotics.com', 'Elytra Robotics', 'elytra.png')}.</p>
    <p>I also founded {lk('https://energizingyouth.org', 'Energizing Youth', pic='assets/classroom.jpg')}, which has taught 500+ kids about clean energy, and my jewelry brand {lk('jewelry.html', 'Chiara Malia', pic='assets/cm-1.jpg')}.</p>
  </section>

  <section class="h-sec reveal">
    <h2>Research</h2>
    <ul class="h-list">{res_html}</ul>
  </section>

  <section class="h-sec reveal">
    <h2>Talks &amp; press</h2>
    <ul class="h-press">{press_html}</ul>
    <p class="h-more"><a href="press.html">More press →</a></p>
  </section>

  <section class="h-sec reveal">
    <div class="h-logos">{logos_html}</div>
  </section>

  <p class="h-campus"><a href="campus.html">Explore my Cornell campus in 3D →</a></p>

</div>'''


# ---------- design ----------
DESIGNS = [
    ('nutrition', 'Cornell Nutrition', 'UI/UX, product'),
    ('malia', 'Chiara Malia', 'Brand identity, packaging'),
    ('electric', 'Electric-First', 'Campaign posters'),
    ('adam', 'Adam, AI economics tutor', 'Product UI'),
    ('ey', 'Energizing Youth', 'Brand system, social'),
    ('mof', 'Tailpipe CO₂ to ethanol', 'Research infographic'),
    ('etc', 'Energy Transition Club', 'Recruiting posters'),
]
DESIGN_TILES = [
    ('nutrition', 'nutrition', 'wide'), ('malia', 'malia', 'wide'),
    ('el1', 'electric', 'half'), ('el2', 'electric', 'half'),
    ('adam2', 'adam', 'wide'), ('ey', 'ey', 'wide'),
    ('eyig', 'ey', 'half'), ('mof', 'mof', 'half'),
    ('etc1', 'etc', 'half'), ('etc2', 'etc', 'half'),
]
_dmeta = {k: (n, t) for k, n, t in DESIGNS}
design_nav = ''.join(f'<li><a href="#d-{k}"><span>{i+1:02d}</span>{E(n)}</a></li>' for i, (k, n, t) in enumerate(DESIGNS))
_seen = set()
def _dtile(img, k, sz):
    n, t = _dmeta[k]
    idattr = '' if k in _seen else f' id="d-{k}"'
    _seen.add(k)
    return f'<a{idattr} class="d-tile d-{sz} reveal" data-p="{k}" href="assets/design/{img}.jpg" data-full="assets/design/{img}.jpg" data-cap="{E(n)}" data-type="{E(t)}"><img src="assets/design/{img}.jpg" alt="{E(n)}: {E(t)}" loading="lazy"></a>'
design_tiles = ''.join(_dtile(*x) for x in DESIGN_TILES)
design = f'''<div class="d-wrap">
  <aside class="d-side"><h1 class="d-h">Design</h1><p class="d-sub">Brand, product and poster work for the things I build.</p><ol class="d-nav">{design_nav}</ol></aside>
  <div class="d-grid">{design_tiles}</div>
</div>
<div class="d-cap" id="dCap" aria-hidden="true"></div>'''

PAGES = [
    ('index.html', 'Chiara Luey', 'Chiara Luey: Cornell Environmental Engineering. Published catalyst research, TEDx speaker, Cornell VC Cognition AI deal team.', landing, ''),
    ('about.html', 'About · Chiara Luey', 'Chiara Luey: Cornell Environmental Engineering student working on clean energy and economics.', home, ''),
    ('work.html', 'Work · Chiara Luey', 'Experience at Cornell Venture Capital, WestLight Energy, Stanford and more.', work, ''),
    ('projects.html', 'Projects & Research · Chiara Luey', 'Research projects, science-fair posters and code.', projects, f'<script src="assets/projects.js?v={V}"></script>'),
    ('press.html', 'Press · Chiara Luey', 'TEDx talk, podcasts and articles.', press, ''),
    ('service.html', 'Service · Chiara Luey', 'Volunteering and honors.', service, ''),
    ('jewelry.html', 'Chiara Malia · Chiara Luey', 'Chiara Malia, a jewelry brand by Chiara Luey.', jewelry, ''),
    ('design.html', 'Design · Chiara Luey', 'Brand, poster and product design by Chiara Luey.', design, ''),
]
for slug, title, desc, body, scripts, *h in PAGES:
    with open(os.path.join(ROOT, slug), 'w') as f:
        f.write(page(slug, title, desc, body, scripts, *h))
print('built', len(PAGES), 'pages')
