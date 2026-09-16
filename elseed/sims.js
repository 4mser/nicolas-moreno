/* ═══════════════════════════════════════════════════════════════════════
   Las simulaciones propias de esta propuesta.

   Cuatro sistemas salen del problema de el seed y no de un banco de imágenes:
   una cartera de arriendos que rota sobre el Gran Concepción, el aislamiento
   por fila que pide el primer hito, el grafo de automatización del tercero y
   un mes de cobranza con su mora. Los divisores restantes llevan atractores
   extraños, que vienen en el motor base.

   El motor —reloj, semilla, paleta leída de la hoja de estilo, fábrica de
   atractores y onda del cierre— vive en /propuesta/sims-base.js y se carga
   antes que este archivo. Acá sólo se AGREGAN sistemas a `window.__SIS`.

   Las reglas de la casa están explicadas en el motor base y valen igual acá:
   semilla fija en `init`, nada de modo aditivo, y el dibujo confinado a su
   caja para que reencuadrar sea mover números y no perseguir trazos.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const SIS = window.__SIS;
  const { acc, tinta, papel, TAU, semilla, mono, hacia } = window.__SIMKIT;

  /* ══ Cartera ══════════════════════════════════════════════════════════
     LA PORTADA. Una cartera de arriendos administrada sobre el Gran
     Concepción: la bahía y el Biobío como referencia, las unidades agrupadas
     por comuna, y cada unidad recorriendo el ciclo que el sistema tiene que
     modelar — captación, mandato firmado, publicada, arrendada, y de vuelta
     por renovación o por vacancia.

     Abajo, la única cifra que le importa a una administradora: la ocupación
     de la cartera a lo largo del tiempo. No es decoración con forma de
     gráfico; es la serie que sale de contar los estados de arriba.

     El puntero adelanta el calendario. */
  const CICLO = [
    { k:'CAPTACIÓN',  dur:[2.0, 4.0] },
    { k:'MANDATO',    dur:[1.5, 3.0] },
    { k:'PUBLICADA',  dur:[2.0, 5.5] },
    { k:'ARRENDADA',  dur:[9.0,17.0] },
    { k:'RENOVACIÓN', dur:[1.0, 2.0] }
  ];
  /* Coordenadas ya normalizadas a [0,1] dentro de la caja del mapa: la
     disposición relativa es la del Gran Concepción —la bahía al norponiente,
     el Biobío cruzando al sur— pero las cifras son de encuadre, no de
     cartografía. Nadie tiene que reconocer una comuna por su latitud; tiene
     que reconocer una CARTERA repartida en plazas. */
  const COMUNAS = [
    // nombre,        cx,  cy,  radio, n
    ['CONCEPCIÓN',    .52, .42, .19, 17],
    ['TALCAHUANO',    .25, .14, .15, 11],
    ['HUALPÉN',       .08, .34, .13,  8],
    ['SAN PEDRO',     .40, .74, .16, 12],
    ['CHIGUAYANTE',   .86, .66, .13,  9],
    ['PENCO',         .82, .08, .11,  6],
    ['CORONEL',       .16, .95, .11,  6]
  ];

  SIS.cartera = {
    interactivo: true,
    init(W,H){
      const rnd = semilla(20260731);
      /* La caja del mapa, en fracción del lienzo. Todo —bahía, comunas,
         unidades y la serie de ocupación— se sitúa DENTRO de ella, así que
         reencuadrar es mover cuatro números y no perseguir trazos sueltos.

         Por defecto LLENA el lienzo que le den. Ese es el punto: en el
         divisor, el chasis ya recorta el lienzo con `data-off` para dejarle la
         izquierda al titular, y si además el sistema se desplazara por dentro
         se sumarían dos desplazamientos y el mapa terminaría estrujado contra
         el borde derecho con un vacío en medio de la lámina. La portada es la
         excepción —lienzo a sangre y titular encima— y por eso declara su
         propia caja en el HTML. */
      const d = ((this.datos && this.datos.caja) || '').trim().split(/[\s,]+/).map(Number);
      this.caja = (d.length === 4 && d.every(n => Number.isFinite(n)))
        ? {x:d[0], y:d[1], w:d[2], h:d[3]}
        : this.pagina ? {x:.06, y:.04, w:.88, h:.60}
                      : {x:.05, y:.10, w:.90, h:.50};
      const C = this.caja;
      this.U = [];
      COMUNAS.forEach(([nom, cx, cy, r, n], ci)=>{
        for(let i=0;i<n;i++){
          // Raíz del uniforme para que el disco quede parejo y no apelmazado
          // en el centro, que es lo que pasa tomando el radio directo.
          const a = rnd()*TAU, d = Math.sqrt(rnd())*r;
          const fase = rnd(), e0 = (rnd()*CICLO.length)|0;
          this.U.push({
            x: (C.x + (cx + Math.cos(a)*d) * C.w) * W,
            y: (C.y + (cy + Math.sin(a)*d) * C.h) * H,
            comuna: ci, e: e0, t: fase,
            /* Cada unidad dura lo suyo dentro del estado: con una duración
               común la cartera entera cambiaría de color a la vez, como un
               semáforo, y una cartera real no hace eso. */
            largo: CICLO[e0].dur[0] + rnd()*(CICLO[e0].dur[1]-CICLO[e0].dur[0]),
            r: 2.3 + rnd()*1.5,
            vacar: rnd()
          });
        }
      });
      this.rnd = rnd;
      this.reloj = 0;
      this.serie = [];       // ocupación observada, mes a mes
      this.mes = 0;
      // Cinco años de historia previa: la serie tiene que existir ya cuando
      // la lámina aparece, no empezar a dibujarse delante del lector.
      for(let k=0;k<600;k++) this.avanzar(.1);
    },
    avanzar(dt){
      this.reloj += dt;
      for(const u of this.U){
        u.t += dt / u.largo;
        while(u.t >= 1){
          u.t -= 1;
          // Desde renovación la unidad vuelve a arrendada, salvo que el
          // arrendatario se vaya: ahí cae a publicada y la cartera pierde
          // ocupación. Esa bifurcación es la vacancia.
          if(CICLO[u.e].k === 'RENOVACIÓN') u.e = (u.vacar < .34) ? 2 : 3;
          else u.e = (u.e + 1) % CICLO.length;
          u.largo = CICLO[u.e].dur[0] + this.rnd()*(CICLO[u.e].dur[1]-CICLO[u.e].dur[0]);
          u.vacar = this.rnd();
        }
      }
      if(this.reloj >= this.mes){
        this.mes += .5;
        let ocup = 0;
        for(const u of this.U) if(CICLO[u.e].k === 'ARRENDADA' || CICLO[u.e].k === 'RENOVACIÓN') ocup++;
        this.serie.push(ocup/this.U.length);
        if(this.serie.length > 96) this.serie.shift();
      }
    },
    frame(dt, ctx, W, H, m){
      // Sobre el lienzo el calendario corre cuatro veces más rápido: el gesto
      // tiene que sentirse como adelantar, no como empujar.
      this.avanzar(dt * (m.dentro ? 4.4 : 1.1));
      ctx.clearRect(0,0,W,H);

      const C = this.caja;
      // De coordenadas de la caja [0,1]² a píxeles del lienzo.
      const MX = u => (C.x + u*C.w) * W;
      const MY = v => (C.y + v*C.h) * H;
      // El radio se escala por el ANCHO de la caja en las dos direcciones: si
      // se escalara cada eje por el suyo, los discos de comuna saldrían
      // elípticos en cuanto la caja deje de ser cuadrada.
      const MR = r => r * C.w * W;

      /* ── La bahía y el río ──────────────────────────────────────────
         Dos trazos de referencia, no un mapa: alcanza para que se lea que
         esto ocurre sobre una ciudad costera con un río al sur. Van
         recortados a la caja para que no se escapen por el lienzo. */
      ctx.save();
      ctx.beginPath();
      ctx.rect(C.x*W, C.y*H - MR(.06), C.w*W, C.h*H + MR(.14));
      ctx.clip();

      // La bahía: una entrante en el borde norponiente. Se mantiene DENTRO de
      // la caja — asomando al lienzo se lee como una raya suelta, no como
      // costa, porque fuera del mapa nada la explica.
      ctx.strokeStyle = tinta(.15); ctx.lineWidth = 1.2;
      ctx.beginPath();
      for(let i=0;i<=60;i++){
        const t = i/60;
        const x = MX(.015 + .175*Math.sin(t*Math.PI*.92));
        const y = MY(-.04 + t*.60);
        i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
      }
      ctx.stroke();

      // El río, cruzando al sur con una curva de verdad: una horizontal recta
      // a este grosor se lee como un filete de la maqueta.
      ctx.beginPath();
      for(let i=0;i<=60;i++){
        const t = i/60;
        const x = MX(.02 + t*.98);
        const y = MY(.78 + .20*Math.sin(t*2.9 + .6));
        i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
      }
      ctx.strokeStyle = tinta(.12); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();

      /* ── Las comunas ── */
      ctx.font = mono(7.5, 400);
      COMUNAS.forEach(([nom, cx, cy, r])=>{
        const x = MX(cx), y = MY(cy), rr = MR(r);
        ctx.strokeStyle = tinta(.065); ctx.lineWidth = 1;
        ctx.setLineDash([2,3]);
        ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = tinta(.30);
        ctx.fillText(nom, x - ctx.measureText(nom).width/2, y - rr - 6);
      });

      /* ── Las unidades ───────────────────────────────────────────────
         El estado se dice con la forma, no sólo con el color: arrendada es
         un cuadrado lleno, publicada un anillo, mandato un cuadrado vacío,
         captación una cruz tenue. Impreso en escala de grises se sigue
         leyendo, que es la prueba de que la codificación sirve. */
      for(const u of this.U){
        const est = CICLO[u.e].k, r = u.r;
        if(est === 'ARRENDADA'){
          ctx.fillStyle = acc(.88);
          ctx.fillRect(u.x-r, u.y-r, r*2, r*2);
        } else if(est === 'RENOVACIÓN'){
          ctx.fillStyle = acc(.88);
          ctx.fillRect(u.x-r, u.y-r, r*2, r*2);
          ctx.strokeStyle = acc(.45); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(u.x, u.y, r + 2.6 + Math.sin(u.t*TAU)*1.1, 0, TAU); ctx.stroke();
        } else if(est === 'PUBLICADA'){
          ctx.strokeStyle = acc(.62); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(u.x, u.y, r*1.05, 0, TAU); ctx.stroke();
        } else if(est === 'MANDATO'){
          ctx.strokeStyle = tinta(.42); ctx.lineWidth = 1;
          ctx.strokeRect(u.x-r, u.y-r, r*2, r*2);
        } else {
          ctx.strokeStyle = tinta(.22); ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(u.x-r, u.y); ctx.lineTo(u.x+r, u.y);
          ctx.moveTo(u.x, u.y-r); ctx.lineTo(u.x, u.y+r);
          ctx.stroke();
        }
      }

      /* ── La ocupación de la cartera ─────────────────────────────────── */
      const s = this.serie;
      if(s.length > 2){
        /* Debajo del mapa, alineada con él: es la lectura agregada de lo que
           se ve arriba. El hueco tiene que despejar la comuna más al sur —que
           con su disco baja hasta 1,06 de la caja— y además su rótulo; si no,
           la etiqueta de ocupación aterriza encima de las unidades. */
        const x0 = MX(.02), x1 = MX(.98);
        const y1 = (C.y + C.h) * H + (this.pagina ? 118 : 112);
        const y0 = y1 - (this.pagina ? 48 : 42);
        ctx.strokeStyle = tinta(.10); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0,y1); ctx.lineTo(x1,y1); ctx.stroke();
        const PX = i => x0 + (x1-x0)*i/(s.length-1);
        const PY = v => y1 - (y1-y0)*Math.max(0, Math.min(1,(v-.45)/.5));
        ctx.beginPath();
        ctx.moveTo(PX(0), y1);
        for(let i=0;i<s.length;i++) ctx.lineTo(PX(i), PY(s[i]));
        ctx.lineTo(PX(s.length-1), y1); ctx.closePath();
        ctx.fillStyle = acc(.05); ctx.fill();
        ctx.beginPath();
        for(let i=0;i<s.length;i++){ const X=PX(i), Y=PY(s[i]); i?ctx.lineTo(X,Y):ctx.moveTo(X,Y); }
        ctx.strokeStyle = acc(.80); ctx.lineWidth = 1.4; ctx.stroke();
        const ult = s[s.length-1];
        ctx.fillStyle = acc(.95);
        ctx.beginPath(); ctx.arc(PX(s.length-1), PY(ult), 2.6, 0, TAU); ctx.fill();
        // 14 px de aire y no 7: a 90% de ocupación la curva va pegada al
        // techo de su banda y el rótulo aterrizaba justo encima del trazo.
        ctx.font = mono(8, 500); ctx.fillStyle = tinta(.42);
        ctx.fillText('OCUPACIÓN DE LA CARTERA · ' + Math.round(ult*100) + '%', x0, y0 - 14);
      }
    }
  };


  /* ══ Aislamiento por fila ═════════════════════════════════════════════
     El primer hito, dibujado. Una tabla de contratos y cuatro roles mirándola
     desde el costado. Cada rol ve exactamente su subconjunto: el arrendatario
     su contrato, el propietario los de sus unidades, el corredor los de su
     cartera, el administrador todo.

     Esto es lo que una política de RLS hace, y es también el argumento de por
     qué el hito 1 no se puede improvisar: la fila que se filtra acá es el
     contrato de arriendo de otra persona.

     El puntero elige el rol; solo, los va rotando. */
  const ROLES = [
    { k:'ARRENDATARIO', p:'tenant_id = auth.uid()',                 ve:f => f.tenant === 0 },
    { k:'PROPIETARIO',  p:'unit_id in (select … where owner_id = …)', ve:f => f.owner === 1 },
    { k:'CORREDOR',     p:'agency_id = current_agency()',            ve:f => f.agency === 0 },
    { k:'ADMIN',        p:'is_admin()',                              ve:_ => true }
  ];

  SIS.rls = {
    interactivo: true,
    init(W,H){
      const rnd = semilla(4208);
      this.N = this.pagina ? 13 : 17;
      this.F = [];
      for(let i=0;i<this.N;i++){
        this.F.push({ tenant:(rnd()*5)|0, owner:(rnd()*4)|0, agency:(rnd()*3)|0,
                      w: .45 + rnd()*.5, luz: 0 });
      }
      this.sel = 0; this.t = 0; this.fade = 1;
    },
    frame(dt, ctx, W, H, m){
      const MARGEN = this.pagina ? 18 : 34;
      const colRol = W * (this.pagina ? .60 : .66);

      if(m.dentro){
        const i = Math.floor((m.y / H) * ROLES.length);
        this.sel = Math.max(0, Math.min(ROLES.length-1, i));
        this.t = 0;
      } else {
        this.t += dt;
        if(this.t > 3.2){ this.t = 0; this.sel = (this.sel + 1) % ROLES.length; }
      }
      const rol = ROLES[this.sel];

      ctx.clearRect(0,0,W,H);

      /* ── La tabla ── */
      const x0 = MARGEN, x1 = colRol - 54;
      const alto = (H - MARGEN*2 - 26) / this.N;
      ctx.font = mono(7.5, 500);
      ctx.fillStyle = tinta(.34);
      ctx.fillText('PUBLIC.LEASE_CONTRACTS', x0, MARGEN + 2);

      this.F.forEach((f,i)=>{
        const y = MARGEN + 16 + i*alto;
        const visible = rol.ve(f);
        f.luz = hacia(f.luz, visible ? 1 : 0, 9, dt);

        // La fila oculta no desaparece: se queda como contorno. Que se vea
        // que EXISTE y no se entrega es justamente lo que hace RLS.
        ctx.strokeStyle = tinta(.09); ctx.lineWidth = 1;
        ctx.strokeRect(x0, y, (x1-x0), alto - 3);

        const w = (x1-x0) * f.w;
        ctx.fillStyle = acc(.10 + f.luz*.72);
        ctx.fillRect(x0, y, w * (.35 + f.luz*.65), alto - 3);

        // Las celdas de la derecha, como sombra de datos.
        ctx.fillStyle = tinta(.06 + f.luz*.20);
        for(let c=0;c<3;c++){
          const cw = (x1-x0-w-10)/3 - 6;
          if(cw <= 2) continue;
          ctx.fillRect(x0 + w + 10 + c*(cw+6), y + alto*.3, cw, Math.max(2, alto*.28));
        }
      });

      /* ── Los roles ── */
      const hRol = H / ROLES.length;
      ctx.textBaseline = 'middle';
      ROLES.forEach((r,i)=>{
        const y = hRol*(i+.5);
        const on = i === this.sel;
        r.luz = hacia(r.luz || 0, on ? 1 : 0, 9, dt);

        // El haz: del rol activo a las filas que sí puede leer.
        if(r.luz > .02){
          ctx.strokeStyle = acc(.05 + r.luz*.13);
          ctx.lineWidth = 1;
          this.F.forEach((f,k)=>{
            if(!r.ve(f)) return;
            const fy = MARGEN + 16 + k*alto + (alto-3)/2;
            ctx.beginPath();
            ctx.moveTo(colRol - 46, y);
            ctx.bezierCurveTo(colRol - 100, y, x1 + 40, fy, x1 + 4, fy);
            ctx.stroke();
          });
        }

        ctx.beginPath();
        ctx.arc(colRol - 40, y, 3.4, 0, TAU);
        ctx.fillStyle = on ? acc(.95) : tinta(.20); ctx.fill();

        ctx.font = mono(on ? 10 : 9, on ? 500 : 400);
        ctx.fillStyle = on ? tinta(.90) : tinta(.28);
        ctx.fillText(r.k, colRol - 28, y - 7);
        ctx.font = mono(7.5, 400);
        ctx.fillStyle = on ? acc(.85) : tinta(.18);
        ctx.fillText(r.p, colRol - 28, y + 6);
      });
      ctx.textBaseline = 'alphabetic';

      // Cuántas filas entrega la política. El número es la consecuencia.
      const n = this.F.filter(f=>rol.ve(f)).length;
      ctx.font = mono(8, 500); ctx.fillStyle = tinta(.40);
      ctx.fillText(n + ' DE ' + this.N + ' FILAS ENTREGADAS', x0, H - MARGEN + 6);
    }
  };


  /* ══ Flujo de automatización ══════════════════════════════════════════
     El tercer hito. Un grafo dirigido con las etapas que el aviso nombra
     —alta de propiedad, mandato, ciclo de arriendo— y sus ramas de
     integración. Por las aristas viajan eventos: cada uno entra por la
     izquierda, se bifurca donde el flujo se bifurca y sale por la derecha.

     Es un autómata, no una animación: los eventos ocupan las aristas de
     verdad, y cuando un nodo recibe uno lo acusa. El puntero inyecta eventos.

     Coordenadas en fracción del lienzo. La columna manda el orden de lectura;
     la fila separa las ramas. */
  const NODOS = [
    { k:'ALTA',        c:0, f:1,   },
    { k:'VALIDACIÓN',  c:1, f:1    },
    { k:'MANDATO',     c:2, f:0.35 },
    { k:'PUBLICACIÓN', c:2, f:1.65 },
    { k:'FIRMA',       c:3, f:0.35 },
    { k:'ARRIENDO',    c:3, f:1.65 },
    { k:'CONTRATO',    c:4, f:1    },
    { k:'COBRO',       c:5, f:0.55 },
    { k:'WHATSAPP',    c:5, f:1.45 }
  ];
  const ARISTAS = [[0,1],[1,2],[1,3],[2,4],[3,5],[4,6],[5,6],[6,7],[6,8]];

  SIS.flujo = {
    interactivo: true,
    init(W,H){
      const cols = 6;
      const mx = W * (this.pagina ? .10 : .09), my = H * .17;
      this.P = NODOS.map(n => ({
        k: n.k,
        x: mx + (W - mx*2) * (n.c/(cols-1)),
        y: my + (H - my*2) * (n.f/2),
        luz: 0
      }));
      this.E = ARISTAS.map(([a,b]) => ({ a, b }));
      this.tok = [];
      this.acum = 0;
      this.rnd = semilla(170724);
      // Arranque con el grafo ya poblado: si empieza vacío la lámina aparece
      // muerta y el primer evento tarda en llegar al final.
      for(let k=0;k<420;k++) this.paso(.033);
    },
    lanzar(){ this.tok.push({ e:0, t:0, v:.42 + this.rnd()*.30 }); },
    paso(dt){
      this.acum += dt;
      if(this.acum > .85){ this.acum = 0; this.lanzar(); }
      const sig = [];
      for(const k of this.tok){
        k.t += k.v * dt;
        if(k.t < 1){ sig.push(k); continue; }
        // Llegó al nodo: lo enciende y sigue por TODAS las aristas que salen.
        const destino = this.E[k.e].b;
        this.P[destino].luz = 1;
        const salidas = [];
        this.E.forEach((e,i)=>{ if(e.a === destino) salidas.push(i); });
        for(const s of salidas) sig.push({ e:s, t:k.t-1, v:k.v });
      }
      this.tok = sig.length > 260 ? sig.slice(-260) : sig;
      for(const p of this.P) p.luz = Math.max(0, p.luz - dt*1.7);
    },
    frame(dt, ctx, W, H, m){
      this.paso(dt);
      if(m.dentro && m.movido && this.rnd() < .16) this.lanzar();
      ctx.clearRect(0,0,W,H);

      /* ── Aristas ── */
      ctx.strokeStyle = tinta(.15); ctx.lineWidth = 1;
      for(const e of this.E){
        const a = this.P[e.a], b = this.P[e.b];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo((a.x+b.x)/2, a.y, (a.x+b.x)/2, b.y, b.x, b.y);
        ctx.stroke();
      }

      /* ── Eventos en tránsito ──────────────────────────────────────────
         Posición sobre la misma cúbica que dibuja la arista, evaluada por su
         polinomio de Bernstein. Interpolar en línea recta los pondría fuera
         del cable en cuanto la curva se abre. */
      for(const k of this.tok){
        const e = this.E[k.e], a = this.P[e.a], b = this.P[e.b], t = k.t;
        const cx1 = (a.x+b.x)/2, cy1 = a.y, cx2 = (a.x+b.x)/2, cy2 = b.y;
        const u = 1-t;
        const x = u*u*u*a.x + 3*u*u*t*cx1 + 3*u*t*t*cx2 + t*t*t*b.x;
        const y = u*u*u*a.y + 3*u*u*t*cy1 + 3*u*t*t*cy2 + t*t*t*b.y;
        ctx.fillStyle = acc(.85);
        ctx.beginPath(); ctx.arc(x, y, 2.1, 0, TAU); ctx.fill();
      }

      /* ── Nodos ── */
      ctx.font = mono(8, 500);
      for(const p of this.P){
        const r = 15 + p.luz*3.4;
        ctx.fillStyle = papel(.96);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = p.luz > .04 ? acc(.35 + p.luz*.6) : tinta(.24);
        ctx.lineWidth = 1 + p.luz*.9;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
        ctx.fillStyle = acc(.20 + p.luz*.70);
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.6 + p.luz*1.4, 0, TAU); ctx.fill();

        ctx.fillStyle = tinta(.44);
        const w = ctx.measureText(p.k).width;
        ctx.fillText(p.k, p.x - w/2, p.y + r + 13);
      }
    }
  };


  /* ══ Cobranza ═════════════════════════════════════════════════════════
     Un mes de recaudación de arriendos. Cada contrato paga un día; los que
     cruzan el vencimiento caen al carril de abajo, donde el sistema los
     persigue —recordatorio, segundo aviso, gestión— hasta que pagan o quedan
     en mora dura al cierre.

     Es el argumento del cuarto hito: la pasarela y el WhatsApp no son
     integraciones sueltas, son el brazo de este carril. El puntero corre el
     día del mes. */
  SIS.cobranza = {
    interactivo: true,
    init(W,H){
      const rnd = semilla(31072026);
      this.N = this.pagina ? 22 : 30;
      this.C = [];
      for(let i=0;i<this.N;i++){
        /* Dos poblaciones: la que paga dentro del plazo y la cola que se
           atrasa — el bulto temprano y la cola larga que tiene de verdad una
           recaudación de arriendos. */
        const puntual = rnd() < .66;
        this.C.push({ dia: puntual ? .6 + rnd()*4.3 : 6 + Math.pow(rnd(), .8)*20,
                      dura: !puntual && rnd() < .16 });
      }
      // Ordenados por cuánto tardaron: la forma de la cola se ve de una vez.
      this.C.sort((a,b)=>a.dia-b.dia);
      /* Empieza con el mes CERRADO, y el puntero retrocede en el tiempo.
         Barriendo sola de cero a treinta, la lámina pasa la mayor parte del
         rato mostrando un mes a medias —y el instante que queda congelado en
         el PDF es justamente uno de esos—. El estado en reposo tiene que ser
         el que más dice: el mes entero, con su bulto y su cola. */
      this.d = 30;
    },
    frame(dt, ctx, W, H, m){
      const DIAS = 30, VENC = 5;
      const MX = this.pagina ? 20 : 46;
      const x0 = MX + (this.pagina ? 0 : 26), x1 = W - MX;
      const PX = d => x0 + (x1-x0) * Math.min(1, Math.max(0, d/DIAS));

      // Sin puntero encima, el mes se queda cerrado. Con puntero, se rebobina.
      if(m.dentro) this.d = Math.max(0, Math.min(DIAS, (m.x - x0)/(x1-x0) * DIAS));
      else this.d = hacia(this.d, DIAS, 3, dt);
      const hoy = Math.min(DIAS, this.d);

      ctx.clearRect(0,0,W,H);

      /* ── Una fila por contrato ────────────────────────────────────────
         Y NO un calendario con dos carriles, que fue el primer intento: en un
         eje lineal de treinta días, dos tercios de los pagos caen dentro de
         los cinco primeros, así que el carril de arriba quedaba como un grumo
         contra el margen y el 80% de su largo vacío. Sorteadas por demora, las
         filas dibujan la distribución completa —el bulto y la cola— y llenan
         el encuadre sin un solo hueco muerto. */
      const paso = Math.min(19, (H*.74) / this.N);
      const yIni = (H - paso*this.N)/2 + paso/2;
      const alto = Math.max(2.5, paso*.42);

      ctx.font = mono(7.5, 500);
      ctx.fillStyle = tinta(.36);
      ctx.fillText('CONTRATOS DEL MES, POR DÍAS HASTA EL PAGO', x0, yIni - paso*1.5 - 4);

      const xv = PX(VENC);
      let enPlazo = 0, recuperados = 0, enGestion = 0;

      this.C.forEach((c,i)=>{
        const y = yIni + i*paso;
        const pagado = hoy >= c.dia;
        const hasta = pagado ? c.dia : hoy;
        const xb = PX(hasta);

        // El riel completo, tenue: dice cuánto mes queda por delante.
        ctx.strokeStyle = tinta(.06); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();

        if(hasta <= 0) return;

        // Tramo dentro del plazo, en tinta.
        ctx.fillStyle = tinta(.44);
        ctx.fillRect(x0, y - alto/2, Math.min(xb, xv) - x0, alto);

        // Tramo en cobranza, en bronce: es lo que cuesta cada día de atraso.
        if(xb > xv){
          ctx.fillStyle = acc(pagado ? .78 : .40);
          ctx.fillRect(xv, y - alto/2, xb - xv, alto);
          // Los avisos que el sistema ya mandó, uno cada cuatro días.
          ctx.strokeStyle = papel(.85); ctx.lineWidth = 1;
          for(let a=1;a<=4;a++){
            const ax = PX(VENC + a*4);
            if(ax > xb - 1) break;
            ctx.beginPath(); ctx.moveTo(ax, y - alto/2); ctx.lineTo(ax, y + alto/2); ctx.stroke();
          }
        }

        if(pagado){
          c.dia > VENC ? recuperados++ : enPlazo++;
          ctx.fillStyle = c.dia > VENC ? acc(.95) : tinta(.55);
          ctx.beginPath(); ctx.arc(xb, y, 2.4, 0, TAU); ctx.fill();
        } else if(hoy > VENC){
          enGestion++;
          ctx.strokeStyle = acc(.72); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(xb, y, 2.4, 0, TAU); ctx.stroke();
        }
      });

      /* ── Vencimiento ── */
      const yA = yIni - paso*.7, yB = yIni + paso*(this.N-1) + paso*.7;
      ctx.save(); ctx.setLineDash([3,4]);
      ctx.strokeStyle = tinta(.34); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xv, yA); ctx.lineTo(xv, yB); ctx.stroke();
      ctx.restore();
      ctx.font = mono(7.5, 500); ctx.fillStyle = tinta(.46);
      ctx.fillText('VENCE D' + VENC, xv + 6, yB + 15);

      /* ── Hoy ── */
      const xh = PX(hoy);
      ctx.strokeStyle = acc(.50); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xh, yA); ctx.lineTo(xh, yB); ctx.stroke();

      /* ── Escala ── */
      ctx.font = mono(7, 400); ctx.fillStyle = tinta(.22);
      for(let d=10; d<=DIAS; d+=10){
        const t = 'D' + d, x = PX(d);
        ctx.fillText(t, x - ctx.measureText(t).width/2, yB + 15);
      }

      ctx.font = mono(8, 500); ctx.fillStyle = tinta(.44);
      ctx.fillText('DÍA ' + Math.round(hoy) + ' · EN PLAZO ' + enPlazo +
                   ' · RECUPERADOS ' + recuperados + ' · EN GESTIÓN ' + enGestion,
                   x0, yB + 34);
    }
  };

})();
