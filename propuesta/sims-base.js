/* ═══════════════════════════════════════════════════════════════════════
   Motor de simulaciones — la parte que no cambia entre propuestas.

   Trae el reloj, el generador con semilla, la fábrica de atractores extraños
   y la onda del cierre. Cada propuesta añade encima SUS sistemas, los que
   modelan el problema del cliente, cargando después un archivo propio que
   escribe en `window.__SIS` usando el juego de herramientas que este expone
   en `window.__SIMKIT`.

   Tres reglas de la casa, que valen para cualquier sistema que se agregue:

   · Sólo se anima la lámina a la vista. Una docena de canvas repintando a la
     vez son una docena de bucles peleando por el mismo hilo, y el resultado
     es que ninguno va fluido. Fuera de pantalla el sistema conserva su estado
     y deja de pedir cuadros. De eso se encarga el chasis.

   · La semilla es fija. Cada lámina arranca siempre igual: si el mismo
     documento se ve distinto en dos computadores, deja de ser un documento.
     Nunca Math.random() en `init`.

   · Sobre papel se acumula tinta, no luz. Nada en modo aditivo: aclarar sobre
     un fondo claro es borrar.

   Contrato de un sistema — un objeto con:
     init(W,H)                 monta el estado. `this.pagina` ya está puesto.
     frame(dt, ctx, W, H, m)   dibuja un cuadro. `m` es el puntero:
                               {x, y, dentro, movido} en coordenadas del lienzo.
     interactivo               opcional; si es true, el cursor lo anuncia.
     reiniciar()               opcional; se llama al hacer clic.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOSCO = matchMedia('(pointer: coarse)').matches;
  const TAU = 6.283185307;

  /* La paleta se lee de la hoja de estilo, no se cablea acá: así el documento
     entero —texto y simulaciones— se recolorea cambiando las variables de
     :root y nada más. `--sim-rgb` existe aparte de `--acc-rgb` porque un
     filete de un píxel sobre papel pierde cuerpo y necesita un punto más de
     viveza que el color con el que se compone texto de 10 px. */
  const raiz = getComputedStyle(document.documentElement);
  const tomar = (nom, resp) => (raiz.getPropertyValue(nom) || '').trim() || resp;
  const RGB_ACC   = tomar('--sim-rgb', tomar('--acc-rgb', '176 104 26'));
  const RGB_TINTA = tomar('--ink-rgb', '28 24 21');
  const RGB_PAPEL = tomar('--bg-rgb',  '250 247 241');

  const acc   = a => 'rgb(' + RGB_ACC   + '/' + a + ')';
  const tinta = a => 'rgb(' + RGB_TINTA + '/' + a + ')';
  const papel = a => 'rgb(' + RGB_PAPEL + '/' + a + ')';

  /* Generador congruencial con semilla: el mismo dibujo en cada máquina y en
     cada carga. Se usa SIEMPRE en `init`; en `frame` da igual. */
  const semilla = s => () => (s = (s*1664525 + 1013904223) % 4294967296) / 4294967296;

  const mono = (px, peso) => (peso || 400) + ' ' + px + 'px "IBM Plex Mono", monospace';

  /* Amortiguación exponencial independiente del cuadro: sin el término dt, un
     monitor de 120 Hz interpola al doble de velocidad que uno de 60 y las
     transiciones se sienten distintas según la pantalla. */
  const hacia = (v, obj, k, dt) => v + (obj - v) * (1 - Math.exp(-k*dt));

  const SIS = {};

  /* ══ Atractores ═══════════════════════════════════════════════════════
     Un sistema que se traza solo y después orbita. El puntero toma el mando
     mientras está encima: horizontal gira, vertical inclina. Al soltarlo la
     rotación automática retoma desde donde quedó, sin salto.

     El encuadre se calcula UNA vez sobre el cilindro que envuelve la órbita
     —radio máximo en el plano xy y rango en z— y por construcción sirve para
     cualquier azimut. Recalculando el rectángulo de la figura en cada cuadro,
     el sistema late al girar, se acerca y se aleja solo, y se lee como un
     error de programación y no como una figura. */
  function camara(pts, n){
    let rmax = 0, zmin = 1e9, zmax = -1e9, cx = 0, cy = 0;
    for(let i=0;i<n;i++){ cx += pts[i*3]; cy += pts[i*3+1]; }
    cx /= n; cy /= n;
    for(let i=0;i<n;i++){
      const x = pts[i*3]-cx, y = pts[i*3+1]-cy, z = pts[i*3+2];
      const r = Math.hypot(x,y); if(r>rmax) rmax = r;
      if(z<zmin) zmin = z; if(z>zmax) zmax = z;
    }
    return { cx, cy, cz:(zmin+zmax)/2, rmax, alto:(zmax-zmin) };
  }

  function atractor(cfg){
    return {
      interactivo: true,
      init(W,H){
        const n = cfg.pasos;
        this.P = new Float32Array(n*3);
        let x = cfg.ini[0], y = cfg.ini[1], z = cfg.ini[2];
        for(let i=0;i<n;i++){
          const d = cfg.f(x,y,z);
          x += d[0]*cfg.dt; y += d[1]*cfg.dt; z += d[2]*cfg.dt;
          this.P[i*3]=x; this.P[i*3+1]=y; this.P[i*3+2]=z;
        }
        this.n = n;
        this.c = camara(this.P, n);
        this.dibujado = 0;
        this.yaw = cfg.yaw0 || 0;
        this.pitch = cfg.pitch0 !== undefined ? cfg.pitch0 : .34;
      },
      frame(dt, ctx, W, H, m){
        // El trazo se completa en unos dos segundos y no vuelve a empezar.
        this.dibujado = Math.min(this.n, this.dibujado + this.n * dt / 2.0);

        if(m.dentro){
          this.yaw   = hacia(this.yaw,   (m.x/W - .5) * 3.4, 4, dt);
          this.pitch = hacia(this.pitch, .12 + (m.y/H) * .72, 4, dt);
        } else {
          this.yaw += (cfg.giro || .12) * dt;
        }

        const c = this.c, ca = Math.cos(this.yaw), sa = Math.sin(this.yaw);
        const cb = Math.cos(this.pitch), sb = Math.sin(this.pitch);
        const ancho = c.rmax*2, alto = c.alto*cb + c.rmax*2*sb;
        const K = cfg.lleno || .86;
        const esc = Math.min(W*K/(ancho||1), H*K/(alto||1));
        const OX = W/2, OY = H/2;

        ctx.clearRect(0,0,W,H);
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = acc(cfg.alfa);
        ctx.lineWidth = cfg.ancho;
        /* Por tramos: un solo trazo pinta cada píxel una vez y no acumula
           densidad; partido, las vueltas se superponen y los núcleos ganan
           cuerpo — que es lo que en modo aditivo daría el brillo, y acá no se
           puede usar porque aclarar sobre papel es borrar. */
        const N = this.dibujado|0, CH = 16, largo = Math.ceil(N/CH) || 1;
        for(let k=0;k<CH;k++){
          const a = k*largo, b = Math.min(N, a+largo+1);
          if(b-a < 2) continue;
          ctx.beginPath();
          for(let i=a;i<b;i++){
            const x = this.P[i*3]-c.cx, y = this.P[i*3+1]-c.cy, z = this.P[i*3+2]-c.cz;
            const xr = x*ca - y*sa, yr = x*sa + y*ca;
            const px = OX + xr*esc, py = OY - (z*cb + yr*sb)*esc;
            i===a ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
          }
          ctx.stroke();
        }
      }
    };
  }

  // La misma parametrización del documento de GO Delivery, sin tocar nada.
  SIS.lorenz = atractor({
    pasos: 22000, dt: .004, ini: [.1,0,0],
    alfa: .30, ancho: .62, lleno: .80, giro: .10, yaw0: .6, pitch0: .30,
    f: (x,y,z) => [10*(y-x), x*(28-z)-y, x*y - (8/3)*z]
  });
  SIS.thomas = atractor({
    pasos: 24000, dt: .05, ini: [1.1,1.6,.4], alfa: .26, ancho: .9, lleno: .78, giro: .1,
    f: (x,y,z) => [Math.sin(y)-.1998*x, Math.sin(z)-.1998*y, Math.sin(x)-.1998*z]
  });
  SIS.sprott = atractor({
    pasos: 20000, dt: .012, ini: [.2,.1,.05], alfa: .27, ancho: .85, lleno: .80, giro: .14,
    f: (x,y,z) => [y + 2.017*x*y + x*z, 1 - 1.8*x*x + y*z, x - x*x - y*y]
  });

  /* ══ Corriente ════════════════════════════════════════════════════════
     Trazadores soltados en un campo de velocidad: cada partícula sigue la
     corriente y deja estela, y cuando se va del cuadro renace al otro lado.
     Es la imagen de una operación en movimiento continuo. El puntero empuja
     el campo.

     Se llama `corriente` y no `flujo` a propósito: cada propuesta suele
     traer su propio sistema llamado flujo —un grafo de automatización, una
     ruta de reparto— y dos sistemas con el mismo nombre en `window.__SIS` se
     pisan sin avisar; gana el último archivo cargado. */
  SIS.corriente = {
    interactivo: true,
    init(W,H){
      const rnd = semilla(90210);
      this.N = TOSCO ? 260 : 520;
      this.p = [];
      for(let i=0;i<this.N;i++) this.p.push({ x: rnd()*W, y: rnd()*H, e: [], vida: rnd()*6 });
      this.rnd = rnd;
    },
    campo(x,y,W,H){
      const u = Math.sin(y*.008) + .6*Math.sin(x*.011 + y*.006) + .35*Math.cos(y*.019 - x*.004);
      const v = Math.cos(x*.009)*.7 + .5*Math.sin(x*.006 - y*.012);
      return [u,v];
    },
    frame(dt, ctx, W, H, m){
      ctx.clearRect(0,0,W,H);
      ctx.lineWidth = .9;
      for(const p of this.p){
        let [u,v] = this.campo(p.x, p.y, W, H);
        if(m.dentro){
          const dx = p.x-m.x, dy = p.y-m.y, d2 = dx*dx+dy*dy;
          if(d2 < 42000 && d2 > 1){
            const f = (1 - d2/42000) * 5.5 / Math.sqrt(d2);
            u += dx*f; v += dy*f;
          }
        }
        const n = Math.hypot(u,v) || 1;
        p.x += u/n*95*dt; p.y += v/n*95*dt;
        p.vida += dt;
        p.e.push(p.x, p.y);
        if(p.e.length > 44) { p.e.shift(); p.e.shift(); }
        if(p.x<-20||p.x>W+20||p.y<-20||p.y>H+20||p.vida>7){
          p.x = this.rnd()*W; p.y = this.rnd()*H; p.e.length = 0; p.vida = 0;
        }
        if(p.e.length < 6) continue;
        ctx.beginPath(); ctx.moveTo(p.e[0], p.e[1]);
        for(let k=2;k<p.e.length;k+=2) ctx.lineTo(p.e[k], p.e[k+1]);
        ctx.strokeStyle = acc(.22);
        ctx.stroke();
        ctx.fillStyle = acc(.85);
        ctx.fillRect(p.x-1.1, p.y-1.1, 2.2, 2.2);
      }
    }
  };

  /* ══ Agujero de gusano ════════════════════════════════════════════════
     La garganta de Morris–Thorne con métrica de Ellis. La coordenada radial
     propia l corre de −∞ a +∞ y CRUZA la garganta en vez de detenerse en
     ella: eso es lo que hace transitable a un agujero de gusano, y por eso los
     tres viajeros pasan de una hoja a la otra sin que haya ningún caso
     especial en l = 0.

     El azimut gira solo, y el puntero lo toma: horizontal rota la figura,
     vertical cambia la inclinación de la cámara. */
  SIS.gusano = {
    interactivo: true,
    init(W,H){
      this.LMAX = 3.2;
      this.phi = .62; this.tilt = .34;
      this.v = [ {l:  .20, dir: 1, a:  .45},
                 {l: 2.10, dir: 1, a: 3.05},
                 {l:-2.30, dir:-1, a: 5.30} ];
    },
    frame(dt, ctx, W, H, m){
      const LMAX = this.LMAX;
      if(m.dentro){
        this.phi  += ((m.x/W)*TAU - this.phi > Math.PI ? 0 : 0) + (((m.x/W)*TAU) - this.phi) * Math.min(1, dt*2.5);
        this.tilt += (.12 + (m.y/H)*.72 - this.tilt) * Math.min(1, dt*3);
      } else {
        this.phi += .22*dt;
      }
      const S = (Math.min(W,H)*.48)/Math.sqrt(1+LMAX*LMAX);
      const rOf = l => S*Math.sqrt(1+l*l), zOf = l => S*Math.asinh(l);
      const ca = Math.cos(this.phi), sa = Math.sin(this.phi);
      const kz = Math.cos(this.tilt), ky = Math.sin(this.tilt);
      const CX = W/2, CY = H/2;
      const proy = (l,a) => {
        const r = rOf(l), z = zOf(l);
        const x = r*Math.cos(a), y = r*Math.sin(a);
        return [CX + x*ca - y*sa, CY + (x*sa + y*ca)*ky - z*kz];
      };

      ctx.clearRect(0,0,W,H);
      // Anillos de l constante, de atrás hacia adelante: el que está delante
      // tapa al de atrás por orden de dibujo, no por opacidad.
      const RINGS = TOSCO ? 18 : 26, SEG = TOSCO ? 40 : 64;
      const ls = [];
      for(let i=0;i<=RINGS;i++) ls.push(-LMAX + 2*LMAX*i/RINGS);
      ls.sort((A,B)=>zOf(B)-zOf(A));
      ctx.lineWidth = 1;
      for(const l of ls){
        const cerca = 1 - Math.min(1, Math.abs(l)/LMAX);
        ctx.strokeStyle = acc((.10 + cerca*.45).toFixed(3));
        ctx.beginPath();
        for(let k=0;k<=SEG;k++){ const p = proy(l, k/SEG*TAU); k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); }
        ctx.stroke();
      }
      ctx.strokeStyle = acc(.14);
      for(let k=0;k<16;k++){
        const a = k/16*TAU;
        ctx.beginPath();
        for(let i=0;i<=60;i++){ const p = proy(-LMAX + 2*LMAX*i/60, a); i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); }
        ctx.stroke();
      }
      // La garganta: el círculo mínimo, l = 0, radio exactamente b₀
      ctx.strokeStyle = acc(.95); ctx.lineWidth = 1.6;
      ctx.beginPath();
      for(let k=0;k<=SEG;k++){ const p = proy(0, k/SEG*TAU); k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); }
      ctx.stroke();

      // Los viajeros avanzan a rapidez propia constante y rebotan en el borde
      // de cada hoja para volver a cruzar.
      const NP = 210, DL = .016, DA = .0082;
      for(const v of this.v){
        v.l += v.dir * .62 * dt;
        v.a += .52 * dt;
        if(v.l >  LMAX){ v.l =  LMAX; v.dir = -1; }
        if(v.l < -LMAX){ v.l = -LMAX; v.dir =  1; }
        /* La estela se integra hacia atrás y se CORTA al salir de la hoja: si
           se saltara el punto, el trazo uniría posiciones no consecutivas y
           aparecerían cuerdas rectas atravesando la figura. */
        const est = [];
        for(let k=0;k<NP;k++){
          const l = v.l - v.dir*DL*k;
          if(Math.abs(l) > LMAX) break;
          est.push([l, v.a - DA*k, 1-k/NP]);
        }
        est.reverse();
        ctx.lineWidth = 1.45;
        for(let k=1;k<est.length;k++){
          ctx.strokeStyle = acc((.10 + est[k][2]*.85).toFixed(3));
          const A = proy(est[k-1][0], est[k-1][1]), B = proy(est[k][0], est[k][1]);
          ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke();
        }
        const p = proy(v.l, v.a);
        ctx.fillStyle = acc(1);
        ctx.beginPath(); ctx.arc(p[0], p[1], 4.8, 0, TAU); ctx.fill();
      }
    }
  };

  /* ══ Onda ═════════════════════════════════════════════════════════════
     El cierre. Ecuación de onda amortiguada sobre una malla, dibujada como
     campo de puntos: cada punto se desplaza por el gradiente de altura, que
     es lo que produce la lectura de refracción. La malla se simula al DOBLE
     de la resolución de los puntos — a la resolución de los puntos la onda
     avanza a saltos y se ve digital, no líquida.

     Es una fábrica y no un objeto suelto porque la onda suele aparecer más de
     una vez en el documento y cada aparición necesita su propia malla. */
  function ondaSis(){
    return {
      interactivo: true,
      init(W,H){
        this.PASO = TOSCO ? 20 : 24;
        this.CELDA = this.PASO/2;
        this.cols = Math.ceil(W/this.CELDA)+2;
        this.filas = Math.ceil(H/this.CELDA)+2;
        this.a = new Float32Array(this.cols*this.filas);
        this.b = new Float32Array(this.cols*this.filas);
        this.prox = 1.2; this.acum = 0; this.fase = 0; this.resto = 0;
        // Gotas de arranque con evolución previa: si la superficie empieza
        // plana, la lámina aparece vacía y la onda se nota varios segundos
        // después, cuando ya nadie la mira.
        /* Amortiguación .9986 y no .9972: con la anterior la superficie se
           apagaba entre gota y gota y la lámina de cierre quedaba en una
           retícula de puntos quietos — que es exactamente lo que se congela
           en el PDF si se imprime en el momento equivocado. */
        /* Nueve focos y no cinco, cada uno con evolución previa distinta: lo
           que hace bonita a una superficie de onda es la INTERFERENCIA entre
           frentes, y con dos o tres frentes vivos a la vez la lámina se ve
           como una retícula de puntos quietos con una arruga en un rincón.
           Sembrando más y dejándolos correr un rato distinto cada uno, el
           estado en reposo ya es un campo entero. */
        [[.30,.34,1],[.64,.58,.92],[.78,.28,.78],[.42,.74,.84],[.20,.62,.68],
         [.86,.72,.8],[.12,.20,.7],[.54,.12,.74],[.70,.88,.66]]
          .forEach((g,i)=>{ this.gota(W*g[0], H*g[1], g[2]*1.15);
                            for(let k=0;k<10+i*3;k++) this.paso(); });
      },
      gota(px,py,fuerza){
        const cx = px/this.CELDA, cy = py/this.CELDA, r = 5;
        for(let y=-r;y<=r;y++) for(let x=-r;x<=r;x++){
          const gx = Math.round(cx+x), gy = Math.round(cy+y);
          if(gx<1||gy<1||gx>=this.cols-1||gy>=this.filas-1) continue;
          const d2 = x*x+y*y; if(d2>r*r) continue;
          this.a[gy*this.cols+gx] -= fuerza*Math.exp(-d2/7.5);
        }
      },
      paso(){
        const a=this.a, b=this.b, cols=this.cols, filas=this.filas;
        for(let y=1;y<filas-1;y++){
          const f=y*cols;
          for(let x=1;x<cols-1;x++){
            const i=f+x;
            b[i] = ((a[i-1]+a[i+1]+a[i-cols]+a[i+cols])*0.5 - b[i]) * .9986;
          }
        }
        this.a=b; this.b=a;
      },
      frame(dt, ctx, W, H, m){
        this.acum += dt;
        if(m.dentro && m.movido) this.gota(m.x, m.y, .26);
        if(this.acum > this.prox){
          this.acum = 0; this.fase += 1.7;
          this.prox = 1.2 + Math.random()*1.2;
          this.gota(W*(.2+.6*(.5+.5*Math.sin(this.fase))),
                    H*(.25+.5*(.5+.5*Math.cos(this.fase*.7))), .78);
        }
        /* Ritmo fijo de 60 pasos por segundo pase lo que pase con los
           cuadros. El tope de tres evita que, al volver de una pestaña en
           segundo plano, un dt enorme dispare cientos de pasos de golpe. */
        this.resto = Math.min(.05, (this.resto || 0) + dt);
        let n = 0;
        while(this.resto >= 1/60 && n < 3){ this.paso(); this.resto -= 1/60; n++; }
        const PASO=this.PASO, CELDA=this.CELDA, cols=this.cols, filas=this.filas, a=this.a;
        ctx.clearRect(0,0,W,H);
        for(let py=PASO*.5; py<H; py+=PASO){
          const gy=(py/CELDA)|0; if(gy<1||gy>=filas-1) continue;
          for(let px=PASO*.5; px<W; px+=PASO){
            const gx=(px/CELDA)|0; if(gx<1||gx>=cols-1) continue;
            const i=gy*cols+gx, h=a[i];
            const dx=(a[i+1]-a[i-1])*1.7, dy=(a[i+cols]-a[i-cols])*1.7;
            const mm=Math.min(Math.abs(h),1);
            ctx.fillStyle = acc((.18+mm*.62).toFixed(3));
            ctx.beginPath(); ctx.arc(px+dx, py+dy, 1.15+mm*1.5, 0, TAU); ctx.fill();
          }
        }
      }
    };
  }
  SIS.onda = ondaSis();

  window.__SIS = SIS;
  window.__SIMCFG = { DPR, QUIETO, TOSCO, nuevaOnda: ondaSis };
  // El juego de herramientas para los sistemas propios de cada propuesta.
  window.__SIMKIT = { acc, tinta, papel, TAU, semilla, mono, hacia, atractor, camara,
                      QUIETO, TOSCO };
})();
