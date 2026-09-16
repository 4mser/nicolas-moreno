/* ═══════════════════════════════════════════════════════════════════════
   El chasis: escala, navegación y el reloj de las simulaciones.

   Un mismo documento, dos modos. En pantalla ancha es una PRESENTACIÓN: una
   lámina de 1280×720 a la vista, escalada en bloque, y sólo esa animándose.
   En pantalla angosta es una PÁGINA: las láminas sueltan su tamaño fijo y
   caen en flujo vertical, cada simulación corriendo únicamente mientras se la
   ve. No hay un segundo HTML.

   Genérico a propósito: no conoce el contenido de ninguna propuesta. Los
   rótulos del índice se leen del propio documento.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const SIS = window.__SIS, CFG = window.__SIMCFG;
  const DPR = CFG.DPR, QUIETO = CFG.QUIETO;

  const pista   = document.getElementById('pista');
  const laminas = [...document.querySelectorAll('.slide')];
  const total   = laminas.length;
  const indice  = document.getElementById('indice');
  const cuenta  = document.getElementById('cuenta');
  const titulo  = document.getElementById('rotulo');
  const avance  = document.getElementById('avance');
  const bAnt    = document.getElementById('ant');
  const bSig    = document.getElementById('sig');
  const ayuda   = document.getElementById('ayuda');

  /* Modo PDF: `?pdf=1`. Las láminas vuelven al flujo —una por página—, cada
     sistema se resuelve una vez y se congela, y no se monta navegación
     ninguna. Es el mismo documento; lo único que cambia es que el tiempo se
     detiene. Se marca en el <html> antes de tocar nada para que la hoja de
     estilo ya esté aplicada cuando se midan los lienzos. */
  const PDF = new URLSearchParams(location.search).has('pdf');
  if(PDF) document.documentElement.dataset.pdf = '1';

  const MQ = matchMedia('(max-width: 900px)');
  const PAGINA = !PDF && MQ.matches;
  /* Al cruzar el umbral —girar el teléfono, redimensionar— se recarga: los
     dos modos montan escuchas distintas y desmontarlas a mano es mucha
     superficie para un caso que ocurre una vez. */
  if(!PDF) MQ.addEventListener('change', e => { if(e.matches !== PAGINA) location.reload(); });

  let actual = -1, ultimo = 0, corriendo = false;

  /* El paralaje y la escala escriben el mismo `transform`, así que se
     componen en un solo lugar. Se declaran antes que nada porque `escalar()`
     corre en la carga y ya los necesita. */
  let px = 0, py = 0, tpx = 0, tpy = 0, kEsc = 1;
  function componer(){
    pista.style.transform = 'translate(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px) scale(' + kEsc + ')';
  }

  /* ── Escala ───────────────────────────────────────────────────────────
     La lámina mide 1280×720 y la ventana casi nunca. Se calcula el factor
     para que quepa entera —con aire para la barra y el pie— y se aplica en
     bloque. Escalar el bloque en vez de remaquetar es lo que mantiene el
     documento idéntico a su versión impresa. */
  let vertical = false;
  function escalar(){
    if(PAGINA || PDF) return;
    const angosta = innerWidth < 820;
    const w = innerWidth - (angosta ? 12 : 32);
    const h = innerHeight - (angosta ? 116 : 132);
    kEsc = Math.min(w/1280, h/720); componer();
    // En vertical una lámina apaisada queda diminuta: no es maquetación, es
    // la proporción del documento. Se sugiere girar.
    vertical = angosta && innerHeight > innerWidth;
    refrescarAyuda();
  }
  addEventListener('resize', escalar); escalar();

  /* ── Cursor ───────────────────────────────────────────────────────────
     El punto se mueve por transform directo —tiene que ir clavado al
     puntero— y el anillo se interpola en un rAF: ese retraso es lo que lo
     hace sentir físico. Cualquier cuadro perdido ahí se ve como un cursor
     partido en dos, así que el anillo NUNCA se actualiza fuera del bucle. */
  (function(){
    if(!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const dot = document.createElement('div'); dot.className = 'cur-dot';
    const ring = document.createElement('div'); ring.className = 'cur-ring';
    document.body.append(dot, ring);
    let x = innerWidth/2, y = innerHeight/2, rx = x, ry = y, on = false;
    addEventListener('pointermove', e=>{
      x = e.clientX; y = e.clientY;
      if(!on){ on = true; rx = x; ry = y; dot.style.opacity = ring.style.opacity = '1'; }
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
    }, {passive:true});
    (function loop(){
      requestAnimationFrame(loop);
      rx += (x-rx)*.16; ry += (y-ry)*.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
    })();
    const HIT = 'a, button, [data-hover]';
    const SIMVIVA = () => !!(window.__LAMINAVIVA && window.__LAMINAVIVA());
    addEventListener('pointerover', e=>{
      const t = e.target;
      const hit = t.closest && t.closest(HIT);
      const sim = !hit && t.closest && t.closest('.slide.activa') && SIMVIVA();
      // Sobre una simulación el anillo se abre MÁS: es la señal de que ahí no
      // sólo se hace clic, ahí se juega con el sistema.
      ring.classList.toggle('sim', !!sim);
      ring.classList.toggle('on', !!hit);
      dot.classList.toggle('fijo', !!(sim || hit));
    }, {passive:true});
  })();

  /* ── Paralaje ─────────────────────────────────────────────────────────
     La lámina se corre unos píxeles siguiendo al cursor. Es una TRASLACIÓN,
     no una inclinación en perspectiva: inclinar deformaría la caja de los
     canvas y las coordenadas que las simulaciones leen del puntero dejarían
     de coincidir con lo que se ve. */
  if(!QUIETO && matchMedia('(hover:hover) and (pointer:fine)').matches){
    addEventListener('pointermove', e=>{
      tpx = (e.clientX/innerWidth  - .5) * 14;
      tpy = (e.clientY/innerHeight - .5) * 9;
    }, {passive:true});
    (function suave(){
      requestAnimationFrame(suave);
      px += (tpx-px)*.06; py += (tpy-py)*.06;
      componer();
    })();
  }

  /* ── Rótulos del índice ──────────────────────────────────────────────
     Se leen del documento: el titular de la lámina, o su kicker si no tiene.
     Los divisores de sección se marcan con una barra en vez de un punto, así
     el índice dibuja la estructura y no una fila plana de veinticinco. */
  const rotulos = laminas.map((s,i)=>{
    if(s.dataset.rotulo) return s.dataset.rotulo;
    const k = s.querySelector('.kicker, .div-sub');
    const h = s.querySelector('h2, .div-tit, h1');
    const t = h ? h.innerHTML.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim() : '';
    const c = k ? k.textContent.replace(/\s+/g,' ').trim() : '';
    return (t || c || 'Lámina ' + (i+1)).slice(0,58);
  });

  laminas.forEach((s,i)=>{
    const b = document.createElement('button');
    b.type = 'button';
    if(s.classList.contains('full')) b.className = 'div';
    b.title = (i+1) + ' · ' + rotulos[i];
    b.setAttribute('aria-label', b.title);
    b.addEventListener('click', ()=> ir(i));
    indice.appendChild(b);
  });
  const puntos = [...indice.children];

  /* ── Simulaciones ─────────────────────────────────────────────────────
     Cada canvas se ata a su sistema. Sólo corre el de la lámina a la vista:
     fuera de ella el sistema conserva su estado y deja de pedir cuadros, que
     es lo que permite que el que sí se ve vaya fluido. */
  const vivos = [];
  document.querySelectorAll('canvas[data-sim]').forEach(cv=>{
    const nombre = cv.dataset.sim;
    // La onda aparece más de una vez y cada una necesita su propia malla.
    const base = nombre === 'onda' ? CFG.nuevaOnda() : SIS[nombre];
    if(!base) return;
    vivos.push({ cv, sis: Object.create(base), lamina: cv.closest('.slide'),
                 off: parseFloat(cv.dataset.off || 0), listo:false,
                 m:{ x:0, y:0, dentro:false, movido:false } });
  });

  function medir(v){
    const W = v.cv.offsetWidth, H = v.cv.offsetHeight;
    if(!W || !H) return false;
    // La lámina escalada devuelve medidas ya escaladas; el búfer se dimensiona
    // con el tamaño de DISEÑO para que el trazo no dependa del zoom.
    v.cv.width  = Math.round(W*DPR);
    v.cv.height = Math.round(H*DPR);

    /* ── Sin canal alfa en el PDF ─────────────────────────────────────
       Un lienzo transparente se embebe como imagen MÁS una máscara de
       opacidad del mismo tamaño, y el visor tiene que descomprimir las dos y
       componerlas por cada página. Con nueve sistemas eso son dieciocho
       imágenes de dos megapíxeles y el documento se arrastra al pasar de
       lámina — medido contra el de GO Delivery, que tiene cinco máscaras.

       Los lienzos no necesitan transparencia: van sobre el papel de la
       lámina y el velo se pinta ENCIMA, por CSS. Pidiendo el contexto sin
       alfa, Chrome embebe una sola imagen sin máscara.

       `clearRect` se redefine porque en un lienzo opaco borra a NEGRO, y
       todos los sistemas empiezan su cuadro llamándolo. Se conserva el
       fillStyle del sistema para no alterar lo que dibuje después. */
    if(PDF){
      v.ctx = v.cv.getContext('2d', {alpha:false});
      const papel = (getComputedStyle(document.documentElement)
                       .getPropertyValue('--bg') || '#ffffff').trim();
      v.ctx.clearRect = (x,y,w,h) => {
        const antes = v.ctx.fillStyle;
        v.ctx.fillStyle = papel;
        v.ctx.fillRect(x,y,w,h);
        v.ctx.fillStyle = antes;
      };
      v.ctx.clearRect(0,0,v.cv.width,v.cv.height);
    } else {
      v.ctx = v.cv.getContext('2d');
    }
    v.ctx.setTransform(DPR,0,0,DPR,0,0);
    /* `data-off` corre el dibujo hacia la derecha: en los divisores el texto
       ocupa la mitad izquierda y el sistema tiene que vivir en la otra. Se
       traslada el origen y se dibuja con el ancho restante, en vez de escalar
       —escalar deformaría las proporciones del sistema—. */
    v.W = (v.off && !PAGINA) ? W*(1-v.off) : W;
    v.H = H;
    v.tx = (v.off && !PAGINA) ? W*v.off : 0;
    /* El sistema recibe los data-* de su lienzo. Con esto un mismo sistema se
       encuadra distinto en cada lámina sin cablear la lámina dentro del
       sistema: `data-caja="x y w h"` en fracciones. Es lo que evita el fallo
       de sumar dos desplazamientos —el del lienzo y el interno del sistema— y
       terminar con el dibujo estrujado contra el borde. */
    v.sis.datos = v.cv.dataset;
    if(v.tx) v.ctx.translate(v.tx, 0);
    v.ctx.beginPath(); v.ctx.rect(0, 0, v.W, v.H); v.ctx.clip();
    return true;
  }

  vivos.forEach(v=>{
    /* Se escucha en la LÁMINA y se traduce al espacio del canvas. Escuchar en
       el canvas parece lo natural: falla en cuanto algo lo tapa —el velo de
       los divisores lo cubre entero— y falla también fuera de sus bordes,
       cuando el cursor va por el margen y uno espera que el sistema siga
       acusándolo. */
    const leer = e => {
      const r = v.cv.getBoundingClientRect();
      if(!r.width) return;
      // Se divide por el factor de escala REAL, medido, no por el que creemos
      // haber aplicado.
      const k = r.width / (v.cv.offsetWidth || 1);
      const x = (e.clientX - r.left)/k - v.tx;
      const y = (e.clientY - r.top)/k;
      // Fuera del área de la simulación el cursor no cuenta: sobre el titular
      // de un divisor, x es negativa y el sistema respondía a un puntero que
      // no estaba encima de él.
      if(x < 0 || y < 0 || x > v.W || y > v.H){ v.m.dentro = false; return; }
      v.m.x = x; v.m.y = y; v.m.dentro = true; v.m.movido = true;
    };
    v.lamina.addEventListener('pointermove', leer, {passive:true});
    v.lamina.addEventListener('pointerdown', e=>{ leer(e); if(v.sis.reiniciar) v.sis.reiniciar(); }, {passive:true});
    v.lamina.addEventListener('pointerleave', ()=>{ v.m.dentro = false; }, {passive:true});
  });

  const INTERACTIVAS = new Set(vivos.filter(v=>v.sis.interactivo).map(v=>v.lamina));
  // El cursor pregunta por acá si la lámina a la vista tiene con qué jugar.
  window.__LAMINAVIVA = () => !QUIETO && INTERACTIVAS.has(laminas[actual]);

  function refrescarAyuda(){
    if(!ayuda) return;
    if(vertical){ ayuda.textContent = 'GIRA EL TELÉFONO PARA VERLA COMPLETA'; return; }
    const l = laminas[actual];
    ayuda.textContent = (!QUIETO && l && INTERACTIVAS.has(l))
      ? 'MUEVE EL PUNTERO SOBRE LA SIMULACIÓN'
      : 'FLECHAS · RUEDA · DESLIZAR';
  }

  function bucle(t){
    if(!corriendo) return;
    const dt = Math.min(.05, (t - ultimo)/1000) || .016;
    ultimo = t;
    for(const v of vivos){
      if(PAGINA ? !v.aLaVista : v.lamina !== laminas[actual]) continue;
      if(!v.listo){ if(!medir(v)) continue; v.sis.pagina = PAGINA; v.sis.init(v.W, v.H); v.listo = true; }
      v.sis.frame(dt, v.ctx, v.W, v.H, v.m);
      v.m.movido = false;
    }
    requestAnimationFrame(bucle);
  }
  function arrancar(){
    if(corriendo) return;
    corriendo = true; ultimo = performance.now();
    requestAnimationFrame(bucle);
  }
  function detener(){ corriendo = false; }

  /* Con movimiento reducido cada sistema se dibuja una sola vez al llegar a
     su lámina: el documento se ve completo y nada se mueve. */
  function unaVez(i){
    for(const v of vivos){
      if(v.lamina !== laminas[i]) continue;
      if(!v.listo){ if(!medir(v)) continue; v.sis.pagina = PAGINA; v.sis.init(v.W, v.H); v.listo = true; }
      for(let k=0;k<90;k++) v.sis.frame(.033, v.ctx, v.W, v.H, v.m);
    }
  }

  /* ── Modo PDF ─────────────────────────────────────────────────────────
     Todas las láminas están en flujo y visibles, así que todos los lienzos
     tienen caja: cada sistema se inicia y se adelanta cinco segundos de golpe
     —lo que tarda un atractor en trazarse entero y la cobranza en pasar del
     vencimiento— y ahí se queda. No hay bucle: el documento impreso no corre.

     Se sale antes de montar navegación, paralaje o modo página: en un PDF no
     hay nada que navegar. */
  if(PDF){
    const congelar = () => {
      for(const v of vivos){
        if(!medir(v)) continue;
        v.sis.pagina = false;
        v.sis.init(v.W, v.H);
        for(let k=0;k<150;k++) v.sis.frame(.033, v.ctx, v.W, v.H, v.m);
      }
      document.documentElement.dataset.listo = '1';
    };
    laminas.forEach(s=> s.classList.add('activa'));
    /* Se espera a las fuentes ANTES de dibujar. Un lienzo se pinta con la
       fuente que haya en ese instante y queda pintado: si se dibuja antes de
       que Newsreader e IBM Plex Mono estén resueltas, los rótulos de las
       simulaciones quedan congelados en la mono de respaldo del sistema —y en
       el PDF eso ya no se puede arreglar, porque el lienzo es un mapa de bits.
       En pantalla no se nota: ahí el sistema repinta cada cuadro. */
    document.fonts && document.fonts.ready
      ? document.fonts.ready.then(congelar)
      : congelar();
    return;
  }

  function ir(i){
    i = Math.max(0, Math.min(total-1, i));
    if(i === actual) return;
    actual = i;
    laminas.forEach((s,k)=> s.classList.toggle('activa', k===i));
    puntos.forEach((b,k)=>{
      b.classList.toggle('on', k===i);
      b.classList.toggle('vista', k<i);
    });
    cuenta.innerHTML = '<b>' + String(i+1).padStart(2,'0') + '</b> / ' + total;
    titulo.textContent = rotulos[i];
    avance.style.width = (i/(total-1)*100) + '%';
    bAnt.disabled = i === 0; bSig.disabled = i === total-1;
    history.replaceState(null, '', '#l' + (i+1));

    // Las láminas que quedan atrás sueltan el estado del puntero.
    vivos.forEach(v=>{ if(v.lamina !== laminas[i]) v.m.dentro = false; });

    if(QUIETO) unaVez(i);
    else {
      // Se re-mide al entrar: la lámina estaba oculta y su canvas no tenía caja.
      vivos.forEach(v=>{ if(v.lamina === laminas[i] && !v.listo) v.listo = false; });
      arrancar();
    }
    refrescarAyuda();
  }

  /* ── Mandos ───────────────────────────────────────────────────────────
     Teclado, rueda y gesto táctil. La rueda se acumula y se descarta durante
     medio segundo tras cambiar: un trackpad entrega decenas de eventos por
     gesto y sin freno se saltarían cinco láminas de una. */
  const sig = () => ir(actual+1), ant = () => ir(actual-1);
  bSig.addEventListener('click', sig);
  bAnt.addEventListener('click', ant);

  addEventListener('keydown', e=>{
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    switch(e.key){
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': e.preventDefault(); sig(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); ant(); break;
      case 'Home': e.preventDefault(); ir(0); break;
      case 'End': e.preventDefault(); ir(total-1); break;
    }
  });

  let freno = 0, acumulado = 0;
  addEventListener('wheel', e=>{
    const ahora = performance.now();
    if(ahora < freno) return;
    acumulado += e.deltaY;
    if(Math.abs(acumulado) < 40) return;
    acumulado > 0 ? sig() : ant();
    acumulado = 0; freno = ahora + 520;
  }, {passive:true});

  let tx0 = 0, ty0 = 0;
  addEventListener('touchstart', e=>{
    tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY;
  }, {passive:true});
  addEventListener('touchend', e=>{
    const t = e.changedTouches[0];
    const dx = t.clientX - tx0, dy = t.clientY - ty0;
    // El gesto sólo cuenta si es claramente largo: si no, se lo queda la
    // simulación, que también recibe el dedo.
    if(Math.max(Math.abs(dx), Math.abs(dy)) < 60) return;
    if(Math.abs(dy) > Math.abs(dx)) dy < 0 ? sig() : ant();
    else dx < 0 ? sig() : ant();
  }, {passive:true});

  // Se pausa al perder la pestaña: nadie está mirando y el portátil lo agradece.
  document.addEventListener('visibilitychange', ()=>{
    document.hidden ? detener() : (QUIETO ? 0 : arrancar());
  });

  /* ── El calendario explica lo que se está mirando ─────────────────────
     Cada barra lleva su tramo en porcentaje del ancho del track, y el track
     son las semanas del proyecto. De ahí sale, sin escribir nada a mano, en
     qué tramo empieza y en cuál termina cada hito: es el propio dato de la
     lámina, leído. */
  (function(){
    const gantt = document.querySelector('.gantt');
    if(!gantt || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const cols = [...gantt.querySelectorAll('.gmes span')].slice(1);   // el primero es la columna de rótulos
    const filas = [...gantt.querySelectorAll('.gfila')];
    if(!cols.length) return;
    const ANCHO = 100/cols.length;

    const guia = document.createElement('div');
    guia.className = 'gguia';
    guia.innerHTML = '<i></i><i></i><b></b>';
    gantt.appendChild(guia);
    const [gi, gf] = guia.querySelectorAll('i');
    const rotulo = guia.querySelector('b');

    filas.forEach(fila=>{
      const bar = fila.querySelector('.gbar');
      if(!bar) return;
      const l = parseFloat(bar.style.left) || 0;
      const w = parseFloat(bar.style.width) || 0;
      const i0 = Math.max(0, Math.min(cols.length-1, Math.floor(l/ANCHO)));
      const i1 = Math.max(i0, Math.min(cols.length-1, Math.ceil((l+w)/ANCHO) - 1));

      fila.addEventListener('pointerenter', ()=>{
        gantt.classList.add('mirando');
        filas.forEach(o=> o.classList.toggle('viendo', o===fila));
        cols.forEach((m,i)=> m.classList.toggle('dentro', i>=i0 && i<=i1));

        /* Con offsetLeft/offsetTop y NO con getBoundingClientRect: la lámina
           va escalada, así que el rect devuelve píxeles de PANTALLA mientras
           que el `left` que se escribe se interpreta en píxeles del
           documento. Mezclarlos deja las guías corridas respecto a la barra.
           Las medidas de offset ya vienen en el espacio del documento, y su
           offsetParent es el propio .gantt, que es position:relative. */
        const track = fila.querySelector('.gtrack');
        const x0 = track.offsetLeft + track.offsetWidth * l/100;
        const x1 = track.offsetLeft + track.offsetWidth * (l+w)/100;
        gi.style.left = x0 + 'px';
        gf.style.left = x1 + 'px';
        rotulo.textContent = i0 === i1
          ? cols[i0].textContent.trim()
          : cols[i0].textContent.trim() + ' — ' + cols[i1].textContent.trim();

        /* El rótulo va en la línea de la barra, no en la cabecera: ahí tapaba
           el nombre del tramo que le quedara debajo. Y se pone al lado que
           tenga sitio: el último hito termina pegado al borde derecho. */
        rotulo.style.top = (fila.offsetTop + fila.offsetHeight/2 - 7) + 'px';
        const ancho = rotulo.offsetWidth || 76;
        const derecha = track.offsetLeft + track.offsetWidth;
        rotulo.style.left = (x1 + 12 + ancho < derecha ? x1 + 12 : x0 - 12 - ancho) + 'px';
      }, {passive:true});
    });

    gantt.addEventListener('pointerleave', ()=>{
      gantt.classList.remove('mirando');
      filas.forEach(o=> o.classList.remove('viendo'));
      cols.forEach(m=> m.classList.remove('dentro'));
    }, {passive:true});
  })();


  if(PAGINA){
    /* El documento impreso coloca varios bloques a mano, con posición
       absoluta. Acá se sueltan para que fluyan — pero sólo los que llevan
       contenido: los velos y degradados tienen que seguir absolutos, porque
       su trabajo es justamente cubrir la lámina. */
    laminas.forEach(s=>{
      [...s.children].forEach(d=>{
        if(d.tagName !== 'DIV') return;
        if(getComputedStyle(d).position !== 'absolute') return;
        const contenido = d.textContent.trim().length || d.querySelector('img,canvas,table,ul');
        if(!contenido) return;                       // velo: se queda donde está
        d.classList.add('fluye');
        if(d.querySelector('.div-num')) d.classList.add('centrado');
      });
      /* ── Los lienzos ──────────────────────────────────────────────────
         En la lámina apaisada, la simulación de una portada o de un divisor
         va a sangre y el texto encima, apagada por un velo. En el teléfono la
         lámina crece hasta el alto del texto, y el lienzo crece con ella: el
         sistema se reparte por toda la columna y el texto queda ilegible
         sobre él por mucho velo que se le ponga.

         Así que a sangre deja de tener sentido. El lienzo pasa a ser una
         BANDA propia al principio de la lámina, con su alto, y el texto fluye
         debajo. La simulación se sigue viendo entera y el texto se lee sobre
         papel limpio. El velo se va con ella, para rematar el borde. */
      s.querySelectorAll('canvas').forEach(cv=>{
        const p = cv.parentElement;
        if(p !== s){ p.classList.add('cajacanvas'); return; }
        const caja = document.createElement('div');
        caja.className = 'cajacanvas';
        s.insertBefore(caja, s.firstChild);
        caja.appendChild(cv);
        const velo = s.querySelector(':scope > .velo');
        if(velo) caja.appendChild(velo);
      });
    });

    /* ── Qué se apila y qué no ─────────────────────────────────────────
       El recurso de las tarjetas que se montan unas sobre otras sirve cuando
       cada una es alta: ahí ahorra pantallas de scroll muerto. En piezas
       cortas tapa contenido que se leía de un vistazo. Se decide MIDIENDO la
       tarjeta, no por la clase del contenedor: la misma rejilla de tres
       columnas sostiene las credenciales —largas, se apilan— y las fases
       —cortas, no—. */
    document.querySelectorAll('.cols-3, .idx, .cols').forEach(g=>{
      const hijos = [...g.children].filter(c=>c.nodeType===1);
      if(hijos.length < 3 || hijos.length > 5) return;
      if(Math.max(...hijos.map(c=>c.offsetHeight)) < 240) return;
      g.classList.add('apila');
    });

    /* ── El calendario se recorre solo ─────────────────────────────────
       El bloque se envuelve en un contenedor que reserva, en ALTO, el
       recorrido lateral que hay que consumir. Mientras el calendario está
       pegado arriba, bajar la página lo desplaza hacia el final; subir lo
       devuelve. Así se ve entero sin depender de que a alguien se le ocurra
       arrastrarlo, y sin robarle el scroll a la página. */
    const cal = document.querySelector('.gantt');
    if(cal){
      const pin = document.createElement('div'); pin.className = 'gantt-pin';
      const fijo = document.createElement('div'); fijo.className = 'gantt-fijo';
      cal.parentNode.insertBefore(pin, cal);
      pin.appendChild(fijo);
      // Se lleva al bloque pegado todo lo que hay antes del calendario en la
      // lámina —kicker y titular— para que no se escapen mientras se recorre.
      const cuerpo = pin.parentElement;
      [...cuerpo.children].forEach(el=>{
        if(el === pin) return;
        if(el.compareDocumentPosition(pin) & Node.DOCUMENT_POSITION_FOLLOWING) fijo.appendChild(el);
      });
      fijo.appendChild(cal);
      const hint = document.createElement('div');
      hint.className = 'gantt-hint';
      hint.innerHTML = 'SEM 1 <i><b></b></i> SEM 10';
      fijo.appendChild(hint);
      const marca = hint.querySelector('b');
      let pedido = false;
      const recorrer = () => {
        pedido = false;
        const sobra = cal.scrollWidth - cal.clientWidth;
        /* Alto reservado: el del bloque más el recorrido lateral por un
           factor. Con 2,2 el recorrido se consumía en medio segundo y el
           bloque se despegaba antes de que la vista llegara al final. */
        pin.style.height = sobra < 8 ? '' : (fijo.offsetHeight + sobra * 3.4) + 'px';
        if(sobra < 8){ cal.scrollLeft = 0; return; }
        const util = pin.offsetHeight - fijo.offsetHeight;
        const k = Math.min(1, Math.max(0, -pin.getBoundingClientRect().top / util));
        cal.scrollLeft = sobra * k;
        marca.style.width = (k*100).toFixed(1) + '%';
      };
      addEventListener('scroll', ()=>{
        if(pedido) return;
        pedido = true;
        requestAnimationFrame(recorrer);
      }, {passive:true});
      addEventListener('resize', recorrer);
      setTimeout(recorrer, 60);
    }

    /* Cada simulación se enciende al entrar en pantalla y se apaga al salir:
       una docena de canvas animándose a la vez fundiría la batería de un
       teléfono, y de todos modos sólo se ve uno. El margen las prepara antes
       de que asomen, para que nunca se vea una lámina en blanco. */
    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{
        const v = vivos.find(x => x.cv === e.target);
        if(v) v.aLaVista = e.isIntersecting;
      });
    }, {rootMargin:'240px 0px'});
    vivos.forEach(v=> io.observe(v.cv));

    /* Entrada al hacer scroll. La unidad es la LÁMINA, no la pieza: agrupar y
       escalonar hace que cada sección se lea como un bloque en vez de armarse
       a tropezones. */
    if(!QUIETO){
      laminas.forEach(s=>{
        [...(s.querySelector('.cuerpo') || s).children]
          .filter(el => !el.matches('canvas,.velo,.esq,.nav,.pie'))
          .forEach(el=> el.classList.add('ap'));
      });
      /* Revelado por comprobación en el scroll y no con IntersectionObserver.
         El observador es más fino, pero cuando el lector salta por encima de
         una sección el elemento pasa de "fuera, abajo" a "fuera, arriba" sin
         llegar a intersecar nunca, y el callback no se emite: la sección
         queda invisible para siempre. Comprobar posiciones en cada scroll no
         tiene ese agujero, y con un conjunto que se va vaciando el coste
         desaparece a medida que se avanza. */
      const pendientes = new Set(document.querySelectorAll('.ap'));
      const revelar = () => {
        if(!pendientes.size) return;
        for(const el of [...pendientes]){
          if(el.getBoundingClientRect().top >= innerHeight*0.88) continue;
          const grupo = [...el.parentElement.children].filter(x=>pendientes.has(x));
          grupo.forEach((g,i)=>{
            g.style.setProperty('--apd', i*80 + 'ms');
            g.classList.add('on');
            pendientes.delete(g);
          });
        }
      };
      addEventListener('scroll', revelar, {passive:true});
      addEventListener('resize', revelar);
      revelar();
    } else {
      document.querySelectorAll('.ap').forEach(el=> el.classList.add('on'));
    }

    // Progreso de lectura y contador de lámina según lo que se esté viendo.
    const barra = document.getElementById('lectura');
    const pintar = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      barra.style.width = (h > 0 ? (scrollY/h)*100 : 0) + '%';
      let i = 0;
      for(let k=0;k<laminas.length;k++){
        if(laminas[k].getBoundingClientRect().top <= innerHeight*0.45) i = k;
      }
      if(i !== actual){
        actual = i;
        cuenta.innerHTML = '<b>' + String(i+1).padStart(2,'0') + '</b> / ' + total;
      }
    };
    addEventListener('scroll', pintar, {passive:true});
    addEventListener('resize', pintar);
    pintar();
    arrancar();
    document.documentElement.dataset.listo = '1';
    return;
  }

  // Entrada directa a una lámina por el ancla de la URL.
  const h = parseInt((location.hash||'').replace('#l',''), 10);
  ir(Number.isFinite(h) && h>=1 && h<=total ? h-1 : 0);
  document.documentElement.dataset.listo = '1';
})();
