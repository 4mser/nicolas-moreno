/* Genera /lab/<id>.html a partir de lab-content.js y del catálogo de lab.js.
   Se corre a mano:  node build-lab.js
   La plantilla comparte los tokens de tema con index.html leyéndolos de ahí,
   así un cambio de paleta no queda desincronizado entre páginas. */
const fs = require('fs');
const path = require('path');
const CONTENT = require('./lab-content.js');

const ROOT = __dirname;
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Tokens de tema, CSS del nav y links de fuentes: todo tomado del index para
// que exista una sola verdad de estilo en el sitio.
const themes = index.slice(index.indexOf('    /* ── Temas ──'), index.indexOf('    html{scroll-behavior'));
const navCss = index.slice(index.indexOf('    /* NAV — like observatory control panel */'),
                           index.indexOf('    /* ═══ HERO'));
if (!navCss.trim()) { console.error('No se pudo extraer el CSS del nav de index.html'); process.exit(1); }
// El bloque del index usa el selector `nav` a secas. En estas páginas hay otros
// <nav> (migas y paginador) que quedarían con position:fixed encima del resto,
// así que se acota a la barra real antes de inyectarlo.
const navCssScoped = navCss.replace(/^(\s*)nav(\b(?![-.]))/gm, '$1nav.site-nav$2');

// Cursor personalizado: mismo bloque que el home, incluida la regla que oculta
// el cursor nativo. chrome.js inserta el markup y lo mueve.
// La regla del index cubre body, a y button. En estas páginas hay sliders,
// bloques de código y texto donde el cursor nativo reaparecía: se amplía a todo.
const cursorAll = '    @media(hover:hover) and (pointer:fine){ *,*::before,*::after{cursor:none!important;} }\n';
const cursorCss =
  index.slice(index.indexOf('    @media(hover:hover) and (pointer:fine){\n      body,a,button{cursor:none!important;}'),
              index.indexOf('    ::selection{')) +
  '    ::selection{background:rgb(var(--accent-rgb)/0.25);color:var(--text);}\n';
if (!cursorCss.includes('.cursor-ring')) { console.error('No se pudo extraer el CSS del cursor'); process.exit(1); }
const fonts = (index.match(/<link[^>]*fonts[^>]*>/g) || []).join('\n  ');

// Catálogo (nombre y nota) desde lab.js, sin ejecutar el motor completo
const labSrc = fs.readFileSync(path.join(ROOT, 'lab.js'), 'utf8');
function catalog() {
  const out = [];
  // lab.js declara los textos con el helper L(en, es)
  const re = /\{\s*id:\s*'([a-z0-9]+)',\s*\n\s*name:\s*L\('([^']*)',\s*'([^']*)'\),\s*\n\s*note:\s*L\('([^']*)',\s*\n?\s*'([^']*)'\)/g;
  let m;
  while ((m = re.exec(labSrc))) out.push({ id: m[1], name: { en: m[2], es: m[3] }, note: { en: m[4], es: m[5] } });
  return out;
}
const CAT = catalog();

// Aísla el bloque fuente de un experimento para que los marcadores no se crucen
function blockOf(id) {
  const start = labSrc.indexOf(`{ id: '${id}',`);
  if (start < 0) throw new Error('experimento no encontrado en lab.js: ' + id);
  const next = labSrc.indexOf("\n    { id: '", start + 5);
  return labSrc.slice(start, next < 0 ? labSrc.length : next);
}

// Recorta el código REAL entre dos marcadores. Si alguno no está, el build cae:
// así la documentación no puede quedar describiendo código que ya no existe.
function slice(id, from, to) {
  const lines = blockOf(id).split('\n');
  const a = lines.findIndex(l => l.includes(from));
  if (a < 0) throw new Error(`[${id}] marcador inicial no encontrado: ${from}`);
  let b = lines.findIndex((l, i) => i >= a && l.includes(to));
  if (b < 0) throw new Error(`[${id}] marcador final no encontrado: ${to}`);
  const chunk = lines.slice(a, b + 1);
  const indent = Math.min(...chunk.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  return chunk.map(l => l.slice(indent)).join('\n').replace(/\s+$/, '');
}
if (!CAT.length) { console.error('No se pudo leer el catálogo de lab.js'); process.exit(1); }

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const bi = (o, k) => `data-en="${esc(o.en)}" data-es="${esc(o.es)}"`;

function page(exp, i, prev, next) {
  const c = CONTENT[exp.id];
  if (!c) return null;
  const num = String(i + 1).padStart(3, '0');

  const mathRows = c.math.map(m => `
        <div class="eq-row">
          <div class="eq">${esc(m.eq)}</div>
          <p class="eq-note" ${bi(m)}>${esc(m.en)}</p>
        </div>`).join('');

  const STEPS = (require('./lab-content.js').steps || {})[exp.id] || [];
  const codeCards = STEPS.map((st, k) => {
    const code = slice(exp.id, st.from, st.to);
    return `
        <article class="step">
          <div class="step-head">
            <span class="step-n">${String(k + 1).padStart(2, '0')}</span>
            <h3 class="step-t" ${bi(st.title)}>${esc(st.title.en)}</h3>
            <button class="copy" type="button" data-en="Copy" data-es="Copiar">Copy</button>
          </div>
          <pre class="code"><code>${esc(code)}</code></pre>
          <p class="step-x" ${bi(st.explain)}>${esc(st.explain.en)}</p>
        </article>`;
  }).join('');

  const block = (title, body) => `
      <section class="blk">
        <h2 class="blk-h" ${bi(title)}>${esc(title.en)}</h2>
        <p class="blk-p" ${bi(body)}>${esc(body.en)}</p>
      </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0a0806">
  <script>(function(){try{var t=localStorage.getItem('nm-theme');
    if(t&&['amber','lilac','magenta','blue','jade','aurora','nova'].indexOf(t)>-1)
      document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
  <title>${esc(exp.name.en)} — Lab — Nicolás Moreno</title>
  <meta name="description" content="${esc(c.lede.en.slice(0, 155))}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="https://nicolas-moreno.vercel.app/lab/${exp.id}">
  <meta property="og:title" content="${esc(exp.name.en)} — Lab">
  <meta property="og:description" content="${esc(c.lede.en.slice(0, 155))}">
  ${fonts}
  <script src="/lab.js" defer></script>
  <script src="/chrome.js" defer></script>
  <style>
${themes}${navCssScoped}${cursorCss}${cursorAll}    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;}
    body{font-family:'IBM Plex Sans',-apple-system,sans-serif;background:var(--bg);
      color:var(--text);-webkit-font-smoothing:antialiased;}
    a{color:inherit;}
    .wrap{max-width:900px;margin:0 auto;padding:0 2rem;}

    .top{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:6.5rem 0 2rem;
      font-family:'IBM Plex Mono',monospace;font-size:0.58rem;letter-spacing:0.16em;
      text-transform:uppercase;color:var(--text-3);}
    .top a{color:var(--accent);text-decoration:none;}
    .top a:hover{text-decoration:underline;}

    /* El canvas manda: entra grande y se queda pegado mientras lees */
    .hero{padding:1rem 0 3rem;}
    .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:0.6rem;letter-spacing:0.2em;
      text-transform:uppercase;color:var(--accent);margin-bottom:1rem;}
    h1{font-family:'Fraunces',serif;font-weight:400;font-size:clamp(2.1rem,6vw,3.6rem);
      line-height:1.05;letter-spacing:-0.02em;margin-bottom:1.2rem;}
    .lede{font-size:1.06rem;line-height:1.75;color:var(--text-2);max-width:60ch;}

    .stage{position:relative;width:100%;aspect-ratio:16/10;margin:2.5rem 0 0;
      background:rgba(0,0,0,0.28);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
      border:1px solid var(--border);overflow:hidden;}
    .stage canvas{display:block;width:100%;height:100%;}
    .stage .idx{position:absolute;top:0.7rem;right:0.8rem;font-family:'IBM Plex Mono',monospace;
      font-size:0.5rem;letter-spacing:0.18em;color:rgb(var(--accent-rgb)/0.75);}

    .blk{padding:3.2rem 0 0;opacity:0;transform:translateY(22px);
      transition:opacity 0.7s ease,transform 0.7s cubic-bezier(0.16,1,0.3,1);}
    .blk.in{opacity:1;transform:none;}
    .blk-h{font-family:'Fraunces',serif;font-weight:400;font-size:1.5rem;
      letter-spacing:-0.01em;margin-bottom:0.9rem;color:var(--text);}
    .blk-p{font-size:0.98rem;line-height:1.8;color:var(--text-2);max-width:62ch;}

    .eqs{padding:3.2rem 0 0;}
    .eq-row{border-top:1px solid var(--border);padding:1.4rem 0;}
    .eq-row:last-child{border-bottom:1px solid var(--border);}
    .eq{font-family:'IBM Plex Mono',monospace;font-size:1.02rem;color:var(--accent);
      margin-bottom:0.6rem;letter-spacing:0.01em;overflow-x:auto;}
    .eq-note{font-size:0.9rem;line-height:1.75;color:var(--text-3);max-width:62ch;}

    /* Controles */
    .ctls{display:grid;gap:0.7rem;margin-top:1.2rem;}
    .ctl{display:grid;grid-template-columns:1fr 200px 62px;align-items:center;gap:1rem;}
    .ctl-l{font-family:'IBM Plex Mono',monospace;font-size:0.6rem;letter-spacing:0.14em;
      text-transform:uppercase;color:var(--text-3);}
    .ctl input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:2px;
      background:var(--border-2);outline:none;cursor:pointer;}
    .ctl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;
      border-radius:50%;background:var(--accent);border:0;cursor:pointer;
      box-shadow:0 0 0 4px rgb(var(--accent-rgb)/0.14);}
    .ctl input[type=range]::-moz-range-thumb{width:13px;height:13px;border-radius:50%;
      background:var(--accent);border:0;cursor:pointer;}
    .ctl-v{font-family:'IBM Plex Mono',monospace;font-size:0.68rem;color:var(--accent);text-align:right;}
    .ctl-reset{justify-self:start;font-family:'IBM Plex Mono',monospace;font-size:0.55rem;
      letter-spacing:0.14em;text-transform:uppercase;color:var(--text-3);background:none;
      border:1px solid var(--border-2);padding:0.4rem 0.7rem;cursor:pointer;
      transition:color .3s ease,border-color .3s ease;}
    .ctl-reset:hover{color:var(--accent);border-color:var(--accent);}
    .hint{margin-top:0.9rem;font-family:'IBM Plex Mono',monospace;font-size:0.55rem;
      letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);}
    .hint-touch{display:none;}
    @media(max-width:640px){
      /* Etiqueta y valor comparten fila; el deslizador ocupa el ancho completo
         debajo. Antes se apilaban los tres y el valor quedaba huérfano. */
      .ctl{grid-template-columns:1fr auto;gap:0.5rem 0.9rem;}
      .ctl-l{grid-row:1;grid-column:1;font-size:0.72rem;letter-spacing:0.1em;}
      .ctl-v{grid-row:1;grid-column:2;text-align:right;font-size:0.82rem;}
      .ctl input[type=range]{grid-row:2;grid-column:1/-1;height:3px;}
      /* Pulgar más grande: 13px es imposible de agarrar con el dedo */
      .ctl input[type=range]::-webkit-slider-thumb{width:20px;height:20px;
        box-shadow:0 0 0 5px rgb(var(--accent-rgb)/0.14);}
      .ctl input[type=range]::-moz-range-thumb{width:20px;height:20px;}
      .ctls{gap:1.1rem;margin-top:1.6rem;}
      .ctl-reset{font-size:0.68rem;padding:0.7rem 1.1rem;min-height:44px;}
      .eyebrow{font-size:0.72rem;}
    }
    /* En pantalla táctil no hay cursor que mover: el aviso cambia, no desaparece */
    @media(hover:none),(pointer:coarse){
      .hint-fine{display:none;}
      .hint-touch{display:block;}
    }
    @media(max-width:640px){ .hint{letter-spacing:0.1em;line-height:1.6;} }

    /* Tarjetas de código */
    .steps{padding-top:3.2rem;}
    .step{border:1px solid var(--border);margin-top:1.5rem;}
    .step-head{display:flex;align-items:center;gap:0.8rem;padding:0.8rem 1rem;
      border-bottom:1px solid var(--border);}
    .step-n{font-family:'IBM Plex Mono',monospace;font-size:0.58rem;letter-spacing:0.16em;
      color:rgb(var(--accent-rgb)/0.8);}
    .step-t{flex:1;font-family:'IBM Plex Sans',sans-serif;font-size:0.82rem;font-weight:600;
      letter-spacing:0.01em;color:var(--text);}
    .copy{font-family:'IBM Plex Mono',monospace;font-size:0.55rem;letter-spacing:0.14em;
      text-transform:uppercase;color:var(--accent);background:rgb(var(--accent-rgb)/0.08);
      border:1px solid rgb(var(--accent-rgb)/0.35);padding:0.35rem 0.6rem;cursor:pointer;
      transition:background .3s ease,border-color .3s ease;}
    .copy:hover{background:rgb(var(--accent-rgb)/0.18);border-color:var(--accent);}
    .copy.done{color:var(--text);border-color:var(--text-3);}
    pre.code{margin:0;padding:1rem;overflow-x:auto;background:rgba(0,0,0,0.35);}
    pre.code code{font-family:'IBM Plex Mono',monospace;font-size:0.72rem;line-height:1.75;
      color:var(--text-2);white-space:pre;}
    .step-x{padding:0.95rem 1rem 1.1rem;font-size:0.88rem;line-height:1.75;color:var(--text-3);
      border-top:1px solid var(--border);}

    .pager{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;
      border-top:1px solid var(--border);margin-top:4rem;padding:2rem 0 4rem;
      font-family:'IBM Plex Mono',monospace;font-size:0.6rem;letter-spacing:0.14em;
      text-transform:uppercase;}
    .pager a{color:var(--accent);text-decoration:none;}
    .pager a:hover{text-decoration:underline;}
    .pager .void{color:var(--text-dim);}

    @media(max-width:640px){
      .wrap{padding:0 1.25rem;}
      .stage{aspect-ratio:4/3;margin-top:2rem;}
      .blk{padding-top:2.6rem;}
      .hero{padding-top:0.5rem;}
      .lede{font-size:1.02rem;line-height:1.7;}
      .blk-h{font-size:1.35rem;}
      .blk-p{font-size:0.96rem;line-height:1.75;}
      .eqs{padding-top:2.6rem;}
      .eq{font-size:0.92rem;}
      .eq-row{padding:1.2rem 0;}
      .eq-note{font-size:0.88rem;line-height:1.7;}
      .steps{padding-top:2.6rem;}
      .step{margin-top:1.1rem;}
      /* Migas: eran de 9px y quedaban pegadas al borde superior */
      /* Copiar código: 47×24 es demasiado chico para el dedo */
      .step-head .copy{min-height:44px;padding:0 0.9rem;font-size:0.72rem;}
      .step-head{align-items:center;}
      nav.top{font-size:0.72rem;}
      nav.top a{min-height:44px;display:inline-flex;align-items:center;}
      .pager{font-size:0.72rem;padding:1.6rem 0 3rem;}
      .pager a{min-height:44px;display:inline-flex;align-items:center;}
      .stage .idx{font-size:0.68rem;}
      .step-n{font-size:0.72rem;}
      .ctl-reset{font-size:0.72rem;}
      .hint{font-size:0.72rem;}
    }
    @media(prefers-reduced-motion:reduce){ .blk{opacity:1;transform:none;transition:none;} }
  </style>
</head>
<body>
  <div class="wrap">
    <nav class="top">
      <a href="/lab" data-en="&larr; All experiments" data-es="&larr; Todos los experimentos">&larr; All experiments</a>
      <span>EXP-${num}</span>
    </nav>

    <header class="hero">
      <div class="eyebrow" ${bi(c.tag)}>${esc(c.tag.en)}</div>
      <h1 ${bi(exp.name)}>${esc(exp.name.en)}</h1>
      <p class="lede" ${bi(c.lede)}>${esc(c.lede.en)}</p>
      <div class="stage"><span class="idx">EXP-${num}</span><canvas id="stage"></canvas></div>
      <div class="ctls" id="ctls"></div>
      <p class="hint hint-fine" data-en="Move the cursor over the canvas — it is part of the simulation."
         data-es="Mueve el cursor sobre el canvas: es parte de la simulación.">Move the cursor over the canvas &mdash; it is part of the simulation.</p>
      <p class="hint hint-touch" data-en="Drag your finger across the canvas — it is part of the simulation."
         data-es="Arrastra el dedo sobre el canvas: es parte de la simulación.">Drag your finger across the canvas &mdash; it is part of the simulation.</p>
    </header>

    <main>
      ${block({ en: 'What to look for', es: 'Qué mirar' }, c.watch)}

      <section class="eqs blk">
        <h2 class="blk-h" data-en="The maths" data-es="Las matemáticas">The maths</h2>
        ${mathRows}
      </section>

      ${block({ en: 'How it is built', es: 'Cómo está construido' }, c.how)}

      ${codeCards ? `<section class="steps blk">
        <h2 class="blk-h" data-en="The code, step by step" data-es="El código, paso a paso">The code, step by step</h2>
        <p class="blk-p" data-en="Cut straight from lab.js. These are the real lines that run above, not a simplified version."
           data-es="Cortado directo de lab.js. Estas son las líneas reales que corren arriba, no una versión simplificada.">Cut straight from lab.js. These are the real lines that run above, not a simplified version.</p>
        ${codeCards}
      </section>` : ''}
      ${block({ en: 'Why it matters', es: 'Por qué importa' }, c.why)}
    </main>

      <section class="blk">
        <h2 class="blk-h" data-en="The whole thing" data-es="El código completo">The whole thing</h2>
        <p class="blk-p" data-en="Everything above, in one piece. This is the entire experiment as it lives in lab.js."
           data-es="Todo lo anterior, de una pieza. Este es el experimento entero tal como vive en lab.js.">Everything above, in one piece. This is the entire experiment as it lives in lab.js.</p>
        <article class="step" style="margin-top:1.5rem">
          <div class="step-head">
            <span class="step-n">FULL</span>
            <h3 class="step-t">lab.js &middot; ${exp.id}</h3>
            <button class="copy" type="button" data-en="Copy" data-es="Copiar">Copy</button>
          </div>
          <pre class="code"><code>${esc(blockOf(exp.id).replace(/\s+$/, '').replace(/^\s*\{ id:/, '{ id:'))}</code></pre>
        </article>
      </section>

    <nav class="pager">
      ${prev ? `<a href="/lab/${prev.id}">&larr; ${esc(prev.name.en)}</a>` : '<span class="void">&larr;</span>'}
      ${next ? `<a href="/lab/${next.id}">${esc(next.name.en)} &rarr;</a>` : '<span class="void">&rarr;</span>'}
    </nav>
  </div>

<script>
(function(){
  function go(){
    if(!window.LAB) return setTimeout(go,60);
    LAB.mount(document.getElementById('stage'), '${exp.id}', {controls: document.getElementById('ctls')});
  }
  go();
  // Bloques que entran al llegar
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.15});
  document.querySelectorAll('.blk').forEach(function(b){io.observe(b);});
  // Copiar el fragmento al portapapeles
  document.querySelectorAll('.copy').forEach(function(btn){
    btn.addEventListener('click',function(){
      var code=btn.closest('.step').querySelector('code').textContent;
      var done=function(){
        var prev=btn.textContent; btn.textContent=document.documentElement.lang==='es'?'Copiado':'Copied';
        btn.classList.add('done');
        setTimeout(function(){btn.textContent=prev;btn.classList.remove('done');},1600);
      };
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(code).then(done).catch(fallback);
      } else fallback();
      function fallback(){
        var ta=document.createElement('textarea'); ta.value=code;
        ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta);
        ta.select(); try{document.execCommand('copy');done();}catch(e){}
        document.body.removeChild(ta);
      }
    });
  });
  // Idioma guardado
  try{ if(localStorage.getItem('nm-lang')==='es'){
    document.documentElement.lang='es';
    document.querySelectorAll('[data-en][data-es]').forEach(function(el){el.innerHTML=el.dataset.es;});
  } }catch(e){}
})();
</script>
</body>
</html>
`;
}

const dir = path.join(ROOT, 'lab');
fs.mkdirSync(dir, { recursive: true });
let n = 0;
CAT.forEach((exp, i) => {
  const html = page(exp, i, CAT[i - 1], CAT[i + 1]);
  if (!html) { console.log('  sin contenido:', exp.id); return; }
  fs.writeFileSync(path.join(dir, exp.id + '.html'), html);
  n++;
});
console.log(`${n}/${CAT.length} páginas generadas en /lab`);

// El índice /lab mantiene su propia copia del CSS del nav (divergió del bloque
// del index y no se puede reemplazar entero sin romper sus estilos propios).
// Esto avisa si el nav cambia y esa copia se queda atrás.
const labIndex = path.join(dir, 'index.html');
if (fs.existsSync(labIndex)) {
  const li = fs.readFileSync(labIndex, 'utf8');
  const falta = ['nav.site-nav .nav-links', 'min-height:44px'].filter(k => !li.includes(k));
  if (falta.length) {
    console.error('  ⚠ lab/index.html quedó atrás del nav actual, le falta:', falta.join(', '));
    process.exit(1);
  }
}
