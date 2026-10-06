/* =====================================================
   v5.8 : feuille de style du devblog, écrite à la main dans l'esprit du
   jeu (fond spatial, panneaux biseautés, liserés cyan, titres Chakra
   Petch). PROSE_CSS (contenu des articles) sert aussi à l'aperçu de
   l'espace rédaction, sous la classe .prose.
===================================================== */

/** Couleurs et polices du blog (aussi posées sur l'aperçu de l'éditeur). */
export const BLOG_VARS = `--bg:#03040a;--panel:rgba(10,15,32,.78);--panel-solid:#0a0f20;--edge:rgba(75,232,255,.16);--edge-strong:rgba(75,232,255,.32);--cyan:#4be8ff;--gold:#ffd86b;--mint:#5cf2b0;--ember:#ff8a4c;--violet:#b18cff;--danger:#ff5c7a;--t1:#f1f5f9;--t2:#cbd5e1;--t3:#94a3b8;--t4:#64748b;--f-title:"Chakra Petch",system-ui,sans-serif;--f-body:Inter,system-ui,sans-serif;--f-mono:"JetBrains Mono",ui-monospace,monospace;--cut:polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px);--cut-sm:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)`;

export const PROSE_CSS = `
.prose{color:var(--t2);font-size:17px;line-height:1.75;word-wrap:break-word}
.prose>*:first-child{margin-top:0}
.prose p{margin:0 0 1.1em}
.prose h2,.prose h3,.prose h4{font-family:var(--f-title);color:#fff;letter-spacing:.04em;line-height:1.25;margin:1.9em 0 .6em;position:relative;scroll-margin-top:90px}
.prose h2{font-size:1.55em;text-transform:uppercase;padding-bottom:.35em;border-bottom:1px solid var(--edge)}
.prose h2::after{content:"";position:absolute;left:0;bottom:-1px;width:64px;height:2px;background:var(--cyan);box-shadow:0 0 12px var(--cyan)}
.prose h3{font-size:1.25em;color:var(--cyan)}
.prose h4{font-size:1.05em;color:var(--gold);text-transform:uppercase;letter-spacing:.12em}
.prose .anchor{position:absolute;left:-1.1em;color:var(--t4);text-decoration:none;opacity:0;transition:opacity .2s}
.prose h2:hover .anchor,.prose h3:hover .anchor,.prose h4:hover .anchor{opacity:1}
.prose a{color:var(--cyan);text-decoration:none;border-bottom:1px solid rgba(75,232,255,.35);transition:border-color .2s,color .2s}
.prose a:hover{color:#fff;border-bottom-color:var(--cyan)}
.prose strong{color:#fff;font-weight:600}
.prose em{color:var(--t1)}
.prose del{color:var(--t4)}
.prose mark{background:rgba(255,216,107,.18);color:var(--gold);padding:0 .25em;border-radius:2px}
.prose kbd{font-family:var(--f-mono);font-size:.8em;padding:.1em .45em;border:1px solid var(--edge-strong);border-bottom-width:2px;background:rgba(255,255,255,.04);color:var(--t1);border-radius:3px}
.prose code{font-family:var(--f-mono);font-size:.86em;background:rgba(75,232,255,.08);color:#9ff3ff;padding:.12em .4em;border-radius:2px;border:1px solid rgba(75,232,255,.14)}
.prose hr{border:0;height:1px;margin:2.4em 0;background:linear-gradient(90deg,transparent,var(--edge-strong),transparent)}
.prose ul,.prose ol{margin:0 0 1.2em;padding-left:1.4em}.prose ul{list-style:disc}.prose ol{list-style:decimal}.prose ul ul{list-style:circle}
.prose li{margin:.35em 0}
.prose ul>li::marker{color:var(--cyan)}
.prose ol>li::marker{color:var(--cyan);font-family:var(--f-mono);font-size:.9em}
.prose ul.tasks{list-style:none;padding-left:.2em}
.prose .task{display:inline-grid;place-items:center;width:1.05em;height:1.05em;margin-right:.55em;border:1px solid var(--edge-strong);font-size:.75em;color:#03040a;vertical-align:-.1em}
.prose .task.done{background:var(--mint);border-color:var(--mint);box-shadow:0 0 10px rgba(92,242,176,.5)}
.prose blockquote{margin:1.4em 0;padding:.6em 1.2em;border-left:3px solid var(--violet);background:rgba(177,140,255,.06);color:var(--t1);font-style:italic}
.prose blockquote p:last-child{margin-bottom:0}
.prose figure{margin:1.8em 0}
.prose figure img,.prose figure video,.prose p>img{display:block;max-width:100%;height:auto;margin:0 auto;border:1px solid var(--edge);clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}
.prose figure video{width:100%;background:var(--bg)}
.prose figcaption{text-align:center;font-family:var(--f-mono);font-size:.72em;letter-spacing:.08em;color:var(--t4);margin-top:.7em}
.prose img.emoji{display:inline-block;width:1.45em;height:1.45em;vertical-align:-.35em;margin:0 .05em;border:0;clip-path:none;object-fit:contain}
.prose .md-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:1.6em 0}
.prose .md-grid figure{margin:0}
.prose .table-wrap{overflow-x:auto;margin:1.4em 0;border:1px solid var(--edge)}
.prose table{width:100%;border-collapse:collapse;font-size:.9em}
.prose th{font-family:var(--f-mono);font-size:.75em;font-weight:500;text-transform:uppercase;letter-spacing:.14em;color:var(--t3);background:rgba(75,232,255,.06);padding:.8em 1em;border-bottom:1px solid var(--edge-strong);text-align:left}
.prose td{padding:.7em 1em;border-top:1px solid rgba(255,255,255,.05)}
.prose tbody tr:hover td{background:rgba(255,255,255,.02)}
.prose .callout{margin:1.6em 0;padding:1em 1.2em;border:1px solid;border-left-width:3px;background:rgba(255,255,255,.02)}
.prose .callout p:last-child{margin-bottom:0}
.prose .callout-title{font-family:var(--f-title);font-weight:600;text-transform:uppercase;letter-spacing:.1em;font-size:.82em;margin-bottom:.5em}
.prose .callout-note,.prose .callout-info{border-color:rgba(75,232,255,.35);background:rgba(75,232,255,.05)}.prose .callout-note .callout-title,.prose .callout-info .callout-title{color:var(--cyan)}
.prose .callout-tip{border-color:rgba(92,242,176,.35);background:rgba(92,242,176,.05)}.prose .callout-tip .callout-title{color:var(--mint)}
.prose .callout-warning,.prose .callout-important{border-color:rgba(255,216,107,.4);background:rgba(255,216,107,.05)}.prose .callout-warning .callout-title,.prose .callout-important .callout-title{color:var(--gold)}
.prose .callout-danger{border-color:rgba(255,92,122,.4);background:rgba(255,92,122,.06)}.prose .callout-danger .callout-title{color:var(--danger)}
.prose .callout-lore{border-color:rgba(177,140,255,.4);background:linear-gradient(135deg,rgba(177,140,255,.08),transparent)}.prose .callout-lore .callout-title{color:var(--violet)}.prose .callout-lore p{font-style:italic}
.prose details.spoiler{margin:1.4em 0;border:1px solid var(--edge);background:rgba(255,255,255,.02)}
.prose details.spoiler summary{cursor:pointer;padding:.7em 1em;font-family:var(--f-title);text-transform:uppercase;letter-spacing:.08em;font-size:.85em;color:var(--t1);list-style:none}
.prose details.spoiler summary::before{content:"▸";display:inline-block;margin-right:.6em;color:var(--cyan);transition:transform .2s}
.prose details.spoiler[open] summary::before{transform:rotate(90deg)}
.prose .spoiler-body{padding:0 1em 1em}
.prose .code-block{position:relative;margin:1.4em 0}
.prose .code-lang{position:absolute;top:0;left:0;font-family:var(--f-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--t4);padding:.45em .9em;border-right:1px solid var(--edge);border-bottom:1px solid var(--edge)}
.prose .code-copy{position:absolute;top:6px;right:6px;font-family:var(--f-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);background:rgba(255,255,255,.04);border:1px solid var(--edge);padding:.35em .7em;cursor:pointer}
.prose .code-copy:hover{color:var(--cyan);border-color:var(--cyan)}
.prose pre.code{margin:0;padding:2.4em 1.2em 1.1em;overflow-x:auto;background:#060a16;border:1px solid var(--edge);font-family:var(--f-mono);font-size:13.5px;line-height:1.65;color:#cbd5e1}
.prose pre.code code{background:none;border:0;padding:0;color:inherit;font-size:inherit}
.prose .tk-k{color:#ff8adf}.prose .tk-s{color:#a5f3a0}.prose .tk-n{color:#ffd86b}.prose .tk-c{color:#5b6b86;font-style:italic}.prose .tk-p{color:#7fdcff}
.prose .api-card{margin:1.6em 0;border:1px solid var(--edge-strong);background:linear-gradient(135deg,rgba(75,232,255,.06),rgba(6,10,22,.9) 60%);clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)}
.prose .api-head{display:flex;flex-wrap:wrap;align-items:center;gap:.6em;padding:.8em 1em;border-bottom:1px solid var(--edge)}
.prose .api-method{font-family:var(--f-mono);font-size:.72em;font-weight:700;letter-spacing:.1em;padding:.3em .7em;color:#03040a}
.prose .api-get{background:var(--mint)}.prose .api-post{background:var(--cyan)}.prose .api-put,.prose .api-patch{background:var(--gold)}.prose .api-delete{background:var(--danger)}
.prose .api-path{background:none;border:0;color:#fff;font-size:.92em;padding:0}
.prose .api-auth{margin-left:auto;font-family:var(--f-mono);font-size:.68em;letter-spacing:.12em;text-transform:uppercase;padding:.3em .6em;border:1px solid}
.prose .api-auth-public{color:var(--mint);border-color:rgba(92,242,176,.4)}.prose .api-auth-private{color:var(--gold);border-color:rgba(255,216,107,.4)}
.prose .api-desc{margin:0;padding:.8em 1em;font-size:.92em;color:var(--t2)}
.prose .api-body{margin:0 1em 1em;padding-top:1em}
.prose .api-try{display:flex;align-items:center;gap:1em;padding:0 1em 1em}
.prose .api-run{font-family:var(--f-title);font-size:.8em;text-transform:uppercase;letter-spacing:.12em;font-weight:600;color:#03040a;background:var(--cyan);border:0;padding:.6em 1.1em;cursor:pointer;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);box-shadow:0 0 18px rgba(75,232,255,.35)}
.prose .api-run:hover{filter:brightness(1.15)}
.prose .api-run:disabled{opacity:.5;cursor:wait}
.prose .api-status{font-family:var(--f-mono);font-size:.78em;color:var(--t3)}
.prose .api-status.ok{color:var(--mint)}.prose .api-status.err{color:var(--danger)}
.prose .api-out{margin:0 1em 1em;padding-top:1em;max-height:360px}
`;

export const BLOG_CSS = `
:root{${BLOG_VARS}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--t2);font-family:var(--f-body);-webkit-font-smoothing:antialiased;min-height:100vh;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;z-index:-2;background:radial-gradient(1200px 600px at 85% -10%,rgba(75,232,255,.10),transparent 60%),radial-gradient(900px 700px at -10% 30%,rgba(177,140,255,.08),transparent 60%),radial-gradient(800px 500px at 60% 120%,rgba(255,138,76,.06),transparent 60%),var(--bg)}
body::after{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.55;background-image:radial-gradient(1px 1px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 120px 80px,rgba(255,255,255,.7),transparent),radial-gradient(1.5px 1.5px at 200px 160px,rgba(75,232,255,.9),transparent),radial-gradient(1px 1px at 320px 40px,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 260px 260px,#fff,transparent),radial-gradient(1px 1px at 60px 220px,rgba(255,216,107,.8),transparent);background-size:360px 300px;animation:drift 120s linear infinite}
@keyframes drift{to{background-position:360px 300px}}
@media (prefers-reduced-motion:reduce){body::after{animation:none}*{transition:none!important}}
a{color:inherit}
img{max-width:100%}
.wrap{width:100%;max-width:1200px;margin:0 auto;padding:0 20px}
.skip{position:absolute;left:-999px}.skip:focus{left:12px;top:12px;z-index:99;background:var(--cyan);color:#000;padding:8px 12px}
/* En-tête */
.topbar{position:sticky;top:0;z-index:20;backdrop-filter:blur(14px);background:rgba(3,4,10,.72);border-bottom:1px solid var(--edge)}
.topbar .wrap{display:flex;align-items:center;gap:18px;height:64px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;flex-shrink:0}
.brand img{width:34px;height:34px}
.brand b{font-family:var(--f-title);font-weight:700;letter-spacing:.18em;font-size:15px}
.brand span{font-family:var(--f-mono);font-size:11px;letter-spacing:.24em;color:var(--cyan);border-left:1px solid var(--edge-strong);padding-left:10px}
.nav{display:flex;gap:4px;margin-left:auto;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav a{font-family:var(--f-title);font-size:13px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;color:var(--t3);padding:8px 12px;white-space:nowrap;transition:color .2s}
.nav a:hover,.nav a.on{color:#fff}
.nav a.on{box-shadow:inset 0 -2px 0 var(--cyan)}
.play{flex-shrink:0;font-family:var(--f-title);font-weight:700;font-size:13px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:#03040a;background:linear-gradient(90deg,var(--cyan),#9ff3ff);padding:9px 16px;clip-path:var(--cut-sm);box-shadow:0 0 22px rgba(75,232,255,.35)}
.play:hover{filter:brightness(1.1)}
.topbar .wrap{flex-wrap:wrap;height:auto;padding-top:10px;gap:4px 12px}.topbar .play{margin-left:auto}.nav{order:3;width:100%;margin:0;border-top:1px solid var(--edge)}.nav a:first-child{padding-left:0}
@media (max-width:900px){.nav{-webkit-mask-image:linear-gradient(90deg,#000 85%,transparent);mask-image:linear-gradient(90deg,#000 85%,transparent)}}
@media (max-width:760px){.topbar .wrap{flex-wrap:wrap;height:auto;padding-top:10px;gap:8px 12px}.brand span{display:none}.topbar .play{margin-left:auto;padding:7px 12px;font-size:12px}.nav{order:3;width:100%;margin:0 -20px;padding:0 12px;border-top:1px solid var(--edge)}.nav a{padding:10px 10px;font-size:12px}.hero{padding-top:36px}}
/* Héros */
.hero{padding-top:56px;padding-bottom:28px;position:relative}
.eyebrow{font-family:var(--f-mono);font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--cyan)}
.hero h1{font-family:var(--f-title);font-size:clamp(38px,6vw,72px);line-height:1;margin:.25em 0 .2em;color:#fff;text-transform:uppercase;letter-spacing:.04em;text-shadow:0 0 40px rgba(75,232,255,.25)}
.hero p.lead{max-width:640px;font-size:18px;color:var(--t3);margin:0}
.crumbs{font-family:var(--f-mono);font-size:12px;letter-spacing:.12em;color:var(--t4);margin-bottom:6px}
.crumbs a{text-decoration:none;color:var(--t3)}.crumbs a:hover{color:var(--cyan)}
/* Mise en page */
.layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:32px;padding-bottom:64px}
@media (max-width:980px){.layout{grid-template-columns:minmax(0,1fr)}}
.panel{background:var(--panel);border:1px solid var(--edge);clip-path:var(--cut);padding:20px}
.side{display:flex;flex-direction:column;gap:20px}
.side h3{font-family:var(--f-mono);font-size:11px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--t4);margin:0 0 12px}
.search{display:flex;border:1px solid var(--edge-strong);background:rgba(0,0,0,.25)}
.search input{flex:1;min-width:0;background:none;border:0;color:#fff;font:inherit;font-size:14px;padding:10px 12px;outline:none}
.search button{background:none;border:0;border-left:1px solid var(--edge);color:var(--cyan);padding:0 14px;cursor:pointer;font-size:16px}
.cats{list-style:none;margin:0;padding:0}
.cats a{display:flex;align-items:center;gap:10px;text-decoration:none;padding:9px 4px;border-top:1px solid rgba(255,255,255,.05);color:var(--t2);font-size:14px;transition:color .2s,padding .2s}
.cats li:first-child a{border-top:0}
.cats a:hover{color:#fff;padding-left:10px}
.cats .n{margin-left:auto;font-family:var(--f-mono);font-size:12px;color:var(--t4)}
.cats .dot{width:8px;height:8px;transform:rotate(45deg);flex-shrink:0}
.tagcloud{display:flex;flex-wrap:wrap;gap:6px}
.tag{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:11.5px;letter-spacing:.04em;color:var(--t3);text-decoration:none;border:1px solid var(--edge);padding:4px 9px;transition:all .2s}
.tag::before{content:"#";color:var(--cyan);margin-right:2px}
.tag:hover,.tag.on{color:#fff;border-color:var(--cyan);background:rgba(75,232,255,.08)}
.side .cta{display:block;text-align:center;text-decoration:none}
/* Cartes */
.cat-ico{width:2em;height:2em;margin:-.4em 0;object-fit:contain;vertical-align:middle}
.chip{display:inline-flex;align-items:center;gap:6px;font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;padding:4px 10px;border:1px solid currentColor;background:rgba(0,0,0,.35);backdrop-filter:blur(6px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:20px}
.card{position:relative;display:flex;flex-direction:column;text-decoration:none;color:inherit;background:var(--panel);border:1px solid var(--edge);clip-path:var(--cut);transition:transform .25s,border-color .25s,box-shadow .25s}
.card:hover{transform:translateY(-3px);border-color:var(--edge-strong);box-shadow:0 14px 40px -18px rgba(75,232,255,.45)}
.card .cover{aspect-ratio:16/9;background:#070b18 center/cover no-repeat;position:relative;border-bottom:1px solid var(--edge)}
.card .cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(3,4,10,.85))}
.card .cover .chip{position:absolute;left:12px;bottom:12px;z-index:1}
.card .cover .pin{position:absolute;right:12px;top:12px;z-index:1;font-family:var(--f-mono);font-size:10px;letter-spacing:.2em;color:#03040a;background:var(--gold);padding:3px 8px}
.card .body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:10px;flex:1}
.card h2{font-family:var(--f-title);font-size:20px;line-height:1.25;color:#fff;margin:0;letter-spacing:.02em}
.card p{margin:0;font-size:14.5px;line-height:1.6;color:var(--t3)}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-family:var(--f-mono);font-size:11.5px;color:var(--t4)}
.meta .who{display:inline-flex;align-items:center;gap:8px;color:var(--t2)}
.avatar{width:26px;height:26px;object-fit:cover;clip-path:var(--cut-sm);background:#0b1020;border:1px solid var(--edge)}
.card .meta{margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,.05)}
.vtag{color:var(--cyan);border:1px solid var(--edge-strong);padding:1px 6px}
/* Article mis en avant */
.feature{display:grid;grid-template-columns:1.3fr 1fr;margin-bottom:28px;text-decoration:none;color:inherit;background:var(--panel);border:1px solid var(--edge-strong);clip-path:var(--cut);transition:box-shadow .25s}
.feature:hover{box-shadow:0 18px 60px -24px rgba(75,232,255,.55)}
.feature .cover{min-height:300px;background:#070b18 center/cover no-repeat;position:relative}
.feature .cover::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 55%,rgba(10,15,32,.95))}
.feature .body{padding:28px;display:flex;flex-direction:column;gap:14px;justify-content:center}
.feature h2{font-family:var(--f-title);font-size:clamp(24px,3vw,34px);line-height:1.15;margin:0;color:#fff;text-transform:uppercase}
.feature p{margin:0;color:var(--t3);line-height:1.65}
@media (max-width:760px){.feature{grid-template-columns:1fr}.feature .cover{min-height:200px}.feature .cover::after{background:linear-gradient(180deg,transparent 50%,rgba(10,15,32,.95))}}
.section-title{display:flex;align-items:center;gap:14px;font-family:var(--f-mono);font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:var(--t4);margin:8px 0 18px}
.section-title::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--edge-strong),transparent)}
.empty{padding:48px 24px;text-align:center;color:var(--t3)}
.empty b{display:block;font-family:var(--f-title);font-size:22px;color:#fff;text-transform:uppercase;margin-bottom:6px}
.pager{display:flex;justify-content:center;gap:8px;margin-top:32px;font-family:var(--f-mono);font-size:13px}
.pager a,.pager span{padding:8px 13px;border:1px solid var(--edge);text-decoration:none;color:var(--t3)}
.pager a:hover{color:#fff;border-color:var(--cyan)}
.pager .cur{color:#03040a;background:var(--cyan);border-color:var(--cyan)}
/* Article */
.post-hero{position:relative;padding-top:72px;padding-bottom:36px;margin-bottom:12px;overflow:hidden;border-bottom:1px solid var(--edge)}
.post-hero .bg{position:absolute;inset:0;z-index:-1;background:#070b18 center/cover no-repeat;opacity:.45;mask-image:linear-gradient(180deg,#000 30%,transparent)}
.post-hero h1{font-family:var(--f-title);font-size:clamp(32px,5vw,58px);line-height:1.08;color:#fff;margin:.35em 0 .35em;max-width:900px;letter-spacing:.02em;text-shadow:0 0 40px rgba(0,0,0,.6)}
.post-hero .lead{max-width:760px;font-size:19px;line-height:1.6;color:var(--t2);margin:0 0 22px}
.post-hero .meta{font-size:12.5px}
.post-hero .avatar{width:40px;height:40px}
.post-hero .who b{display:block;color:#fff;font-family:var(--f-title);font-size:15px;letter-spacing:.04em}
.post-hero .who small{color:var(--t4)}
.article{padding:28px 32px 36px}
@media (max-width:640px){.article{padding:20px 18px 28px}.prose{font-size:16px}.prose .anchor{display:none}}
.toc{position:sticky;top:84px}
.toc ol{list-style:none;margin:0;padding:0;border-left:1px solid var(--edge)}
.toc a{display:block;text-decoration:none;color:var(--t3);font-size:13.5px;line-height:1.4;padding:6px 0 6px 14px;margin-left:-1px;border-left:2px solid transparent;transition:all .2s}
.toc a:hover{color:#fff}
.toc a.on{color:var(--cyan);border-left-color:var(--cyan)}
.toc .l3 a{padding-left:28px;font-size:12.5px}
.progress{position:fixed;left:0;top:0;height:2px;z-index:30;background:linear-gradient(90deg,var(--cyan),var(--violet));box-shadow:0 0 10px var(--cyan);width:0}
.post-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:28px;padding-top:20px;border-top:1px solid var(--edge)}
.share{margin-left:auto;display:flex;gap:8px}
.btn{font-family:var(--f-title);font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:var(--t1);background:rgba(255,255,255,.04);border:1px solid var(--edge-strong);padding:9px 14px;cursor:pointer;transition:all .2s}
.btn:hover{border-color:var(--cyan);color:var(--cyan)}
.prevnext{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px}
.prevnext a{display:block;text-decoration:none;padding:16px 18px;background:var(--panel);border:1px solid var(--edge);clip-path:var(--cut-sm);transition:border-color .2s}
.prevnext a:hover{border-color:var(--cyan)}
.prevnext small{font-family:var(--f-mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--t4)}
.prevnext b{display:block;margin-top:4px;color:#fff;font-family:var(--f-title);font-size:16px}
.prevnext .next{text-align:right;grid-column:2}
@media (max-width:640px){.prevnext{grid-template-columns:1fr}.prevnext .next{grid-column:1}}
.draft-banner{background:repeating-linear-gradient(-45deg,rgba(255,216,107,.12) 0 12px,transparent 12px 24px);border:1px solid rgba(255,216,107,.5);color:var(--gold);font-family:var(--f-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;padding:10px 14px;margin-top:20px}
/* Pied de page */
.footer{border-top:1px solid var(--edge);background:rgba(3,4,10,.7);padding:36px 0 44px;margin-top:24px}
.footer .wrap{display:flex;flex-wrap:wrap;gap:20px 40px;align-items:flex-start;justify-content:space-between}
.footer p{margin:6px 0 0;font-size:13px;color:var(--t4);max-width:420px}
.footer nav{display:flex;flex-wrap:wrap;gap:8px 22px}
.footer nav a{font-family:var(--f-mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:var(--t3)}
.footer nav a:hover{color:var(--cyan)}
.toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);opacity:0;transition:all .3s;z-index:50;background:var(--panel-solid);border:1px solid var(--cyan);color:#fff;font-family:var(--f-mono);font-size:13px;padding:10px 16px;box-shadow:0 0 30px rgba(75,232,255,.3)}
.toast.show{opacity:1;transform:translate(-50%,0)}
.reveal{animation:rise .6s ease-out both}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.grid .card:nth-child(2){animation-delay:.06s}.grid .card:nth-child(3){animation-delay:.12s}.grid .card:nth-child(4){animation-delay:.18s}.grid .card:nth-child(5){animation-delay:.24s}.grid .card:nth-child(6){animation-delay:.3s}
${PROSE_CSS}
`;

/** Script des pages : barre de lecture, sommaire actif, copie du code et des liens, essai des routes de l'API. */
export const BLOG_JS = `
(function(){
  var toast=document.createElement("div");toast.className="toast";document.body.appendChild(toast);
  function say(t){toast.textContent=t;toast.classList.add("show");clearTimeout(say.t);say.t=setTimeout(function(){toast.classList.remove("show")},1800)}
  function copy(t,msg){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){say(msg)},function(){say("Copie impossible")})}
  document.addEventListener("click",function(e){
    var b=e.target.closest&&e.target.closest(".code-copy");
    if(b){var pre=b.parentNode.querySelector("pre");copy(pre?pre.innerText:"","Code copié");return}
    var s=e.target.closest&&e.target.closest("[data-copy]");
    if(s){e.preventDefault();copy(s.getAttribute("data-copy"),"Lien copié");return}
    var r=e.target.closest&&e.target.closest(".api-run");
    if(r){
      var card=r.closest(".api-card"),out=card.querySelector(".api-out"),st=card.querySelector(".api-status"),path=card.getAttribute("data-path"),t0=Date.now();
      r.disabled=true;st.className="api-status";st.textContent="Appel en cours…";
      fetch(path,{headers:{accept:"application/json"}}).then(function(res){return res.text().then(function(txt){return {res:res,txt:txt}})}).then(function(x){
        var body=x.txt;try{body=JSON.stringify(JSON.parse(x.txt),null,2)}catch(_){}
        if(body.length>6000)body=body.slice(0,6000)+"\\n… (tronqué)";
        out.hidden=false;out.querySelector("code").textContent=body;
        st.className="api-status "+(x.res.ok?"ok":"err");st.textContent=x.res.status+" "+(x.res.statusText||"")+" · "+(Date.now()-t0)+" ms";
      }).catch(function(err){st.className="api-status err";st.textContent="Erreur : "+err.message}).then(function(){r.disabled=false});
    }
  });
  var bar=document.querySelector(".progress"),art=document.querySelector(".article");
  var links=[].slice.call(document.querySelectorAll(".toc a")),heads=links.map(function(a){return document.getElementById(a.getAttribute("href").slice(1))});
  function onScroll(){
    if(bar&&art){var r=art.getBoundingClientRect(),h=r.height-innerHeight;bar.style.width=Math.max(0,Math.min(1,-r.top/Math.max(1,h)))*100+"%"}
    if(heads.length){var cur=0;heads.forEach(function(h,i){if(h&&h.getBoundingClientRect().top<120)cur=i});links.forEach(function(a,i){a.classList.toggle("on",i===cur)})}
  }
  addEventListener("scroll",onScroll,{passive:true});onScroll();
})();
`;
