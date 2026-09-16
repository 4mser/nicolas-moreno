/* Barra superior compartida por /lab y por las páginas de detalle.
   Reproduce el nav del home con los mismos controles (idioma y color) y las
   mismas claves de localStorage, así el estado cruza entre rutas.
   El CSS lo inyecta el generador tomándolo de index.html: una sola verdad. */
(function () {
  'use strict';

  const THEMES = {
    amber:   { name: 'Ámbar',   sw: '#ffb347', glow: '#ffb347' },
    lilac:   { name: 'Lila',    sw: '#b98cff', glow: '#b98cff' },
    magenta: { name: 'Magenta', sw: '#ff5da2', glow: '#ff5da2' },
    blue:    { name: 'Azul',    sw: '#5aa8ff', glow: '#5aa8ff' },
    jade:    { name: 'Jade',    sw: '#4ee7a8', glow: '#4ee7a8' },
    aurora:  { name: 'Aurora',  sw: 'linear-gradient(135deg,#7cf5d0,#7aa2ff,#b98cff)', glow: '#7aa2ff' },
    nova:    { name: 'Nova',    sw: 'linear-gradient(135deg,#ffb347,#ff5da2,#b98cff)', glow: '#ff5da2' }
  };

  const LINKS = [
    { href: '/#hero',          en: 'Log',        es: 'Bitácora' },
    { href: '/#observations',  en: 'Now',        es: 'Ahora' },
    { href: '/#field-notes',   en: 'Notes',      es: 'Notas' },
    { href: '/lab',            en: 'Lab',        es: 'Lab' },
    { href: '/#trajectory',    en: 'Trajectory', es: 'Trayectoria' },
    { href: '/#transmission',  en: 'Transmit',   es: 'Contacto' }
  ];

  function build() {
    if (document.querySelector('nav.site-nav')) return;
    const here = location.pathname.startsWith('/lab');

    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.innerHTML =
      '<div class="nav-links" id="navLinks">' +
      LINKS.map(l =>
        `<a href="${l.href}"${here && l.href === '/lab' ? ' class="is-here"' : ''} data-en="${l.en}" data-es="${l.es}">${l.en}</a>`
      ).join('') +
      '</div>' +
      '<button class="nav-menu" id="navMenu" type="button" aria-expanded="false" ' +
        'aria-controls="navLinks" aria-label="Menú"><i></i><i></i></button>' +
      '<button class="lang-toggle" id="langToggle">' +
        '<span class="active" data-lang="en">EN</span> / <span data-lang="es">ES</span></button>' +
      '<div class="theme-pick" id="themePick">' +
        '<button class="theme-trigger" id="themeTrigger" type="button" aria-haspopup="true" ' +
          'aria-expanded="false" aria-label="Color"><i></i></button>' +
        '<div class="theme-panel" id="themePanel" role="group" aria-label="Colores">' +
          '<div class="theme-swatches">' +
            Object.entries(THEMES).map(([id, t]) =>
              `<button type="button" data-set="${id}" style="--sw:${t.sw};--glow:${t.glow}" aria-label="${t.name}"><i></i></button>`
            ).join('') +
          '</div><div class="theme-name" id="themeName">Ámbar</div>' +
        '</div>' +
      '</div>';
    document.body.insertBefore(nav, document.body.firstChild);

    wireLang();
    wireTheme();
    wireMenu();
    cursor();
  }

  /* ── Menú móvil ───────────────────────────────────────────────────────
     Mismo comportamiento que el home: la hoja son los mismos enlaces del nav
     con otro CSS, así que acá solo se abre y se cierra. */
  function wireMenu() {
    const nav = document.querySelector('nav.site-nav');
    const btn = document.getElementById('navMenu');
    const links = document.getElementById('navLinks');
    if (!nav || !btn || !links) return;

    const set = v => {
      nav.classList.toggle('menu-open', v);
      btn.setAttribute('aria-expanded', String(v));
      document.body.style.overflow = v ? 'hidden' : '';
    };
    btn.addEventListener('click', e => { e.stopPropagation(); set(!nav.classList.contains('menu-open')); });
    links.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    matchMedia('(min-width:769px)').addEventListener('change', ev => { if (ev.matches) set(false); });
  }

  /* ── Cursor personalizado ───────────────────────────────────────────────
     Mismo comportamiento que el home: el punto sigue al mouse al instante y
     el anillo con las órbitas lo persiguen con retardo. Solo con puntero fino. */
  function cursor() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (document.getElementById('cursorDot')) return;

    const orbit = document.createElement('div');
    orbit.className = 'cursor-orbit'; orbit.id = 'cursorOrbit';
    orbit.innerHTML = '<div class="orbit-layer orbit-layer-1"></div>' +
                      '<div class="orbit-layer orbit-layer-2"></div>' +
                      '<div class="orbit-layer orbit-layer-3"></div>';
    const ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.id = 'cursorRing';
    const dot = document.createElement('div');  dot.className = 'cursor-dot';  dot.id = 'cursorDot';
    document.body.append(orbit, ring, dot);

    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, ox = mx, oy = my, on = false;

    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      if (!on) { on = true; rx = ox = mx; ry = oy = my;
        dot.style.opacity = ring.style.opacity = '1'; orbit.style.opacity = '1'; }
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    }, { passive: true });

    addEventListener('pointerleave', () => {
      on = false; dot.style.opacity = ring.style.opacity = orbit.style.opacity = '0';
    });

    // El anillo se agranda sobre cualquier cosa clickeable
    const HOVERABLE = 'a, button, .exp, .step, input[type=range]';
    addEventListener('pointerover', e => {
      const hit = e.target.closest && e.target.closest(HOVERABLE);
      ring.classList.toggle('hover', !!hit);
      dot.classList.toggle('hover', !!hit);
      orbit.classList.toggle('hover', !!hit);
    }, { passive: true });

    (function tick() {
      requestAnimationFrame(tick);
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ox += (mx - ox) * 0.09; oy += (my - oy) * 0.09;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      orbit.style.left = ox + 'px'; orbit.style.top = oy + 'px';
    })();
  }

  /* ── Idioma ─────────────────────────────────────────────────────────── */
  function wireLang() {
    const toggle = document.getElementById('langToggle');
    if (!toggle) return;
    const spans = [...toggle.querySelectorAll('span[data-lang]')];
    let current = document.documentElement.lang === 'es' ? 'es' : 'en';

    function set(lang) {
      current = lang;
      spans.forEach(s => s.classList.toggle('active', s.dataset.lang === lang));
      document.documentElement.lang = lang;
      document.querySelectorAll('[data-en][data-es]').forEach(el => {
        const t = el.dataset[lang];
        if (t !== undefined) el.innerHTML = t;
      });
      try { localStorage.setItem('nm-lang', lang); } catch (e) {}
    }
    toggle.addEventListener('click', () => set(current === 'en' ? 'es' : 'en'));

    let saved = 'en';
    try { saved = localStorage.getItem('nm-lang') || 'en'; } catch (e) {}
    set(saved === 'es' ? 'es' : 'en');
  }

  /* ── Color ──────────────────────────────────────────────────────────── */
  function wireTheme() {
    const pick = document.getElementById('themePick');
    if (!pick) return;
    const trigger = document.getElementById('themeTrigger');
    const nameEl = document.getElementById('themeName');
    const btns = [...pick.querySelectorAll('.theme-swatches button')];
    const meta = document.querySelector('meta[name="theme-color"]');
    const canHover = matchMedia('(hover:hover)').matches;
    let current = 'amber';

    const open = v => {
      pick.classList.toggle('open', v);
      trigger.setAttribute('aria-expanded', String(v));
      if (!v) nameEl.textContent = THEMES[current].name;
    };

    function apply(id, persist) {
      if (!THEMES[id]) id = 'amber';
      current = id;
      document.documentElement.setAttribute('data-theme', id);
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.set === id)));
      nameEl.textContent = THEMES[id].name;
      if (meta) meta.setAttribute('content',
        getComputedStyle(document.documentElement).getPropertyValue('--bg-2').trim() || '#0a0806');
      if (persist) { try { localStorage.setItem('nm-theme', id); } catch (e) {} }
      dispatchEvent(new CustomEvent('themechange', { detail: { name: id } }));
    }

    btns.forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation(); apply(b.dataset.set, true);
        if (!canHover) open(false);
      });
      b.addEventListener('pointerenter', () => { nameEl.textContent = THEMES[b.dataset.set].name; });
      b.addEventListener('pointerleave', () => { nameEl.textContent = THEMES[current].name; });
    });

    if (canHover) {
      pick.addEventListener('pointerenter', () => open(true));
      pick.addEventListener('pointerleave', () => open(false));
      pick.addEventListener('focusin', () => open(true));
      pick.addEventListener('focusout', e => { if (!pick.contains(e.relatedTarget)) open(false); });
    } else {
      addEventListener('click', e => { if (!pick.contains(e.target)) open(false); });
    }
    trigger.addEventListener('click', e => { e.stopPropagation(); open(!pick.classList.contains('open')); });
    addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });

    let saved = 'amber';
    try { saved = localStorage.getItem('nm-theme') || 'amber'; } catch (e) {}
    apply(saved, false);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', build, { once: true });
  else build();
})();
