# -*- coding: utf-8 -*-
"""Arma el CV de presentación de Nicolás Moreno, en los dos idiomas.

    python3 construir.py            → escribe ../cv-nicolas-moreno.html y ...-es.html

El contenido vive como datos y no incrustado en el HTML porque son DOS
idiomas: escribir dos plantillas garantiza que en algún momento una quede
desactualizada respecto de la otra (ya pasó con la versión anterior).

⚠️ Toda cifra de acá es verificable. Las de plataforma se contaron sobre el
repositorio (`find … -name '*.controller.ts'`, etc.) el 1 sep 2026; las de
negocio son las que ya estaban documentadas. No se inventa ninguna.
"""
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.dirname(AQUI)
SPRITE = open(os.path.join(AQUI, 'iconos.svg')).read()

# Los logos de marca vienen de Simple Icons y van RELLENOS; el de base de
# datos viene de Lucide, que es una librería de interfaz y dibuja con TRAZO.
# Mezclar los dos modos en un mismo <svg> deja el glifo de trazo como una
# mancha sólida.
TRAZO = {'database'}

def ic(n):
    if n in TRAZO:
        return (f'<svg viewBox="0 0 24 24" fill="none" stroke="var(--c-{n})" stroke-width="2" '
                f'stroke-linecap="round" stroke-linejoin="round"><use href="#i-{n}"/></svg>')
    return f'<svg viewBox="0 0 24 24" fill="var(--c-{n})"><use href="#i-{n}"/></svg>' 

PALABRAS = {
  'en': {'motores':'custom engines','sistemas':'design systems','facturacion':'electronic invoicing',
         'gnn':'graph neural nets','vision':'computer vision',
         'agentes':'custom subagents','prompting':'agentic workflows'},
  'es': {'motores':'motores propios','sistemas':'sistemas de diseño','facturacion':'facturación electrónica',
         'gnn':'redes de grafos','vision':'visión por computador',
         'agentes':'subagentes propios','prompting':'flujos agénticos'},
}

def tec(items):
    """items: [(icono|None, nombre)]"""
    out = []
    for icono, nom in items:
        if icono:
            out.append(f'<span class="t">{ic(icono)}<span>{nom}</span></span>')
        else:
            out.append(f'<span class="t sin"><span>{nom}</span></span>')
    return '<div class="tec">' + ''.join(out) + '</div>'

def grupo(et, items, L):
    items = [(i, n.format(**PALABRAS[L])) for i, n in items]
    return f'<div class="grupo"><div class="et">{et}</div>{tec(items)}</div>'

# ─────────────────────────── datos comunes ───────────────────────────
CONTACTO = [
    ('Mail', 'nicolaspatriciomorenoavila@gmail.com'),
    ('Tel', '+56 9 3728 7950'),
    ('Web', 'nicolas-moreno.vercel.app'),
    ('Git', 'github.com/4mser'),
]

STACK = [
  ('lenguajes', [('typescript','TypeScript'), ('javascript','JavaScript'), ('python','Python'), ('database','SQL')]),
  ('backend', [('nestjs','NestJS'), ('nodedotjs','Node.js'), ('socketdotio','WebSockets'),
               ('mongodb','MongoDB'), ('postgresql','PostgreSQL'), ('redis','Redis'), (None,'REST')]),
  ('frontend', [('nextdotjs','Next.js'), ('react','React'), ('tailwindcss','Tailwind'),
                (None,'Zustand'), (None,'PWA')]),
  ('movil', [('expo','Expo'), ('react','React Native'), ('apple','App Store'),
             ('googleplay','Google Play'), (None,'EAS Build / OTA')]),
  ('3d', [('webgl','WebGL / GLSL'), ('threedotjs','Three.js'), (None,'Canvas 2D'),
          ('greensock','GSAP'), (None,'{motores}')]),
  ('ia', [('pytorch','PyTorch'), ('huggingface','Hugging Face'), ('opencv','OpenCV'),
          ('scikitlearn','scikit-learn'), ('numpy','NumPy'), ('pandas','pandas'),
          ('openai','LLM agents'), ('googlegemini','Gemini'), (None,'Groq'),
          (None,'{gnn}'), (None,'{vision}')]),
  ('herramientas', [('claudecode','Claude Code'), ('cursor','Cursor'),
                    (None,'{agentes}'), (None,'{prompting}')]),
  ('infra', [('flydotio','Fly.io'), ('vercel','Vercel'), ('amazonwebservices','AWS S3'),
             ('cloudflare','Cloudflare'), ('railway','Railway'), ('docker','Docker'),
             ('github','GitHub Actions'), (None,'CI/CD'), ('raspberrypi','Raspberry Pi')]),
  ('producto', [('figma','Figma'), (None,'{sistemas}'), ('mercadopago','Mercado Pago'),
                (None,'{facturacion}'), (None,'multi-tenant')]),
]

# El separador de miles cambia con el idioma: 1,103 en inglés, 1.103 en español.
# Cuatro capacidades, no cifras: dicen de qué es capaz en vez de cuánto lleva
# hecho, y no repiten los números que el perfil ya trae.
CIFRAS = {
  'en': ['Architecture', 'Backend &amp; infrastructure', 'Applied AI', 'Product &amp; design'],
  'es': ['Arquitectura', 'Backend e infraestructura', 'IA aplicada', 'Producto y diseño'],
}

T = {}
# ═══════════════════════════════ INGLÉS ═══════════════════════════════
T['en'] = dict(
  lang='en', archivo='cv-nicolas-moreno.html',
  rol='Founding Engineer · Full-Stack · AI/ML · Interactive 3D',
  lugar='Santiago, Chile — remote or on-site',
  secResumen='Professional summary', secCifras='Areas of expertise',
  secExp='Professional experience', secObras='Selected projects', secObras2='Selected projects (cont.)', secStack='Technical skills',
  secComo='How I work', secEdu='Education', secIdiomas='Languages & honors',
  pie2='Selected projects', pie3='Skills & background',
  resumen='Self-taught software engineer with a background in physics engineering. I build products end to end —architecture, backend, web and native applications, applied machine learning and design— and today I lead engineering at <b>FIDELYA</b>, which I built from scratch and which runs with <b>paying clients</b>. Before that I led engineering at <b>GoAuto</b>, with teams across Chile, LATAM and the United States. Having worked on every layer of the product is what lets me make architectural decisions on technical grounds.',
  cifrasPie='',
  exp=[
    dict(cargo='Cofounder, <em>CEO &amp; CTO</em>', emp='FIDELYA',
         meta='Jan 2025 – Present · Santiago, Chile · multi-tenant SaaS',
         puntos=[
           'Designed and built a <b>multi-tenant platform with one isolated database per venue</b> — NestJS, MongoDB, Next.js and real-time WebSockets — today <b>105 modules, 123 controllers, 179 data models and 1,103 endpoints</b> in production.',
           'Built it <b>solo from zero</b>: backend, panel, native apps, infrastructure, design system and brand. Now I lead a team of six and own the architecture.',
           'Shipped the <b>white-label mobile app</b>: one codebase that produces a separate iOS and Android app per venue, published to the App Store and Google Play with over-the-air updates.',
           'Built <b>AURA</b>, the retention engine: it predicts which members are drifting away from real consumption behaviour and acts on it, fed by graph/tensor models and Graph Neural Networks from the in-house research lab (formerly Entropía Technologies).',
           'Built the parts nobody wants to build: loyalty engine, electronic invoicing, POS and cash register, printing bridge, inventory with recipes, bookings, and a permission system with seven roles.',
           'Own the release path: I review and merge the team’s branches into production, keep the architecture coherent as more people touch it, and onboard each new developer into it.',
         ]),
    dict(cargo='Cofounder &amp; <em>CTO</em>', emp='B&amp;N Solutions',
         meta='Jul 2026 – Present · Santiago, Chile · technology studio',
         puntos=[
           'Custom software, AI automation and high-end interactive web for clients — including <b>a real-time Navier-Stokes fluid simulation written in plain WebGL</b>, with no 3D library, running at 60 fps on a phone.',
           'Own the whole delivery: discovery, architecture, build, and the documents and decks that sell it.',
         ]),
    dict(cargo='<em>Tech Lead</em> &amp; Full-Stack Engineer', emp='GoAuto (Dropout Capital)',
         meta='Oct 2025 – Jul 2026 · Remote · LATAM + US team',
         puntos=[
           'Owned architecture and delivery of an AI-powered dealership-management platform running <b>51 dealerships across Chile</b>.',
           'Led a team of five-plus engineers across LATAM and the US, setting architecture and product direction.',
         ]),
    dict(cargo='Full-Stack &amp; <em>Machine Learning</em> Engineer', emp='Physical AI Lab (Chile)',
         meta='Mar 2024 – Sep 2024 · Remote · robotics, AI &amp; simulation (physicalailab.cl)',
         puntos=[
           'Built a <b>convolutional neural network</b> that detects faults on power-transmission lines for SAESA, a Chilean energy utility, from field imagery.',
           'Shipped production full-stack features alongside the model.',
         ]),
    dict(cargo='Freelance Full-Stack Developer', emp='Independent',
         meta='2022 – 2024 · Remote',
         puntos=['Landing pages, web automations and small custom systems, end to end — from the conversation with the client to the deploy.']),
  ],
  obras=[
    ('Platform & product', [
      ('FIDELYA — Customer Intelligence OS',
       'Multi-tenant platform for venues: loyalty, menu, table ordering, bookings, invoicing, campaigns and analytics. One isolated database per venue, so a client can be handed their data and leave.',
       'NestJS · MongoDB · Next.js'),
      ('Loyalty engine',
       'The core of the business: points per spend, per visit or hybrid, tier ladders, rule-based rewards and badges earned from real behaviour. Configured per venue without touching code.',
       'NestJS · MongoDB · cron'),
      ('Table ordering with a shared cart',
       'Scan the QR printed on your table and order from your phone. If several of you are sitting there, you share one live cart, each adds their own, and the bill is split when you close it.',
       'WebSockets · React Native'),
      ('Floor app for the staff',
       'The other end of every scan: tables by zone and state, tickets to the kitchen, touch point of sale, split bills and payment, on the waiter’s phone.',
       'React Native · sockets'),
      ('White-label native apps',
       'One React Native codebase that builds a separate app per venue — its own name, icon, palette and features. Published to both stores with over-the-air updates.',
       'Expo · EAS'),
      ('Club Happy People',
       'The app of a dinner-theatre venue in Santiago, live on the App Store: points, menu, table ordering, show listing and an in-house party game. From the first commit to the store, alone.',
       'App Store · Expo'),
      ('Electronic invoicing engine',
       'Chilean tax documents end to end: signing, issuing, tracking and the accounting behind it — built inside the platform, not bolted on.',
       'Node · crypto · SII'),
      ('Point of sale, cash register & inventory',
       'Register with open and close, cash counts, inventory with recipes that discount stock per dish, and a printing bridge to USB thermal printers.',
       'Node · WebUSB'),
    ]),
    ('Artificial intelligence & computer vision', [
      ('AURA — retention engine',
       'Predicts which members are drifting away from real consumption behaviour and fires the action without anyone pressing a button. Fed by graph and tensor models from the in-house research lab.',
       'GNNs · tensor models · Python'),
      ('AMBAR — post-sale agent',
       'An agent that takes over the conversation after the purchase: follow-up, resolution and recovery, with the customer’s context and history in hand.',
       'LLMs · agents'),
      ('Paper receipts to points — in progress',
       'A neural network that reads a photographed paper receipt and credits the right points, so a venue can join the loyalty programme without integrating its point of sale.',
       'vision · OCR · PyTorch'),
      ('Power-line fault detection',
       'A convolutional network that flags anomalies on transmission lines from field imagery, for a Chilean energy utility (SAESA).',
       'PyTorch · CNN'),
      ('Drone point clouds for line inspection',
       'Processing of drone-captured point clouds to inspect power lines in the field: segmentation of the conductors, distance to vegetation and encroachment detection. For SAESA with Akame Ingeniería.',
       'Python · LiDAR'),
      ('Computer vision on a quadruped robot',
       'Segmentation and anomaly analysis of building windows from what a Spot robot captures, with the control and analytics platform around it: routes, findings and reports.',
       'segmentación · Spot'),
    ]),
    ('Simulation, graphics & play', [
      ('WebGL fluid simulation',
       'A Navier-Stokes solver written in plain WebGL — advection, vorticity and a Jacobi pressure solve — with no 3D library. Runs at 60 fps on a phone and reacts to scroll and touch.',
       'WebGL · GLSL'),
      ('3D matter sculpted by scroll',
       'A metaball field with analytic normals, its height taken from the square root of the field rather than the raw Gaussian. Each capability of a company is a different simulation that morphs into the previous one as you scroll.',
       'WebGL · shaders'),
      ('Game engine with memory',
       'A party-game engine that deals from a 357-card deck without repeating, remembers what came out on previous nights, and shifts its own tone as the night goes on.',
       'TypeScript · React Native'),
      ('Simulation lab',
       'Close to forty interactive pieces — Navier-Stokes, Chladni, Gray-Scott, boids, double slit, Collatz, curvature — written from scratch, as study and as proof.',
       'Canvas · WebGL'),
      ('Interactive documents',
       'Client decks and technical documents that are real web pages: scroll-driven simulations and a letter-format PDF generated from the same source.',
       'GSAP · Canvas · Puppeteer'),
    ]),
    ('Data, hardware & integrations', [
      ('Ticketing integration',
       'The venue’s show listing inside the app: cast deduced from the event title, live availability, and purchase without leaving. Their public API leaked bank details — everything is proxied and stripped.',
       'REST · caching'),
      ('Hardware & IoT',
       'A wearable on a Raspberry Pi 5, and lighting control over the local network by speaking a vendor protocol directly — no cloud, no app in the middle.',
       'Raspberry Pi · Python · LAN'),
      ('Catalogue importer',
       'Takes the menu a venue already has online and loads it as a working demo in minutes — categories, prices and photos — so they can be shown their own app before the first meeting.',
       'Node · scraping'),
      ('Campaigns & per-venue email',
       'Segmented campaigns that go out with each venue’s own sender and domain, not the provider’s: transactional and campaign email separated per tenant.',
       'Resend · segmentation'),
      ('Bookings & spaces',
       'Table, service and space reservations, with availability per professional, time windows and date blackouts.',
       'NestJS · calendar'),
      ('Cross-venue passport',
       'The brand’s own app: a map of venues, points that travel between them and a global search, on the same multi-tenant base.',
       'React Native · maps'),
      ('Social asset generator',
       'Brand carousels generated from a panoramic canvas cut into slides, with each venue’s identity applied.',
       'Canvas · Node'),
    ]),
  ],
  como=[
    ('Depth first, so I can lead','I have taken products from an empty folder to the App Store on my own — schema, API, panel, app, infrastructure, design and copy. That is exactly what lets me split the work, review it and be accountable for someone else’s code.'),
    ('Physics before frameworks','Three years of physics engineering. It shows up where it matters: simulations, models, and knowing when a problem is maths and not more code.'),
    ('Design is not decoration','I build the design system and the interface myself. A product that nobody understands is a product that nobody uses.'),
  ],
  edu=[('Physics Engineering — Universidad Andrés Bello','2019 – 2022 · three years, incomplete · data science and mathematical modelling'),
       ('Technical High School — Telecommunications','2014 – 2017 · programming, networking, electronics and fibre optics')],
  idiomas=[('Spanish','Native'),('English','Professional working proficiency')],
  honores='Founder Institute Chile 2026 — selected.',
  nota='A single-column version without icons, for automated applicant filters, is available on request.',
  remate='<b>What I am looking for:</b> a technically demanding team where I can get properly involved in the problems — from the architectural decisions through to what actually runs in production. I value autonomy, technical judgement, and working with people who raise the level of the team.',
)

# ═══════════════════════════════ ESPAÑOL ═══════════════════════════════
T['es'] = dict(
  lang='es', archivo='cv-nicolas-moreno-es.html',
  rol='Founding Engineer · Full-Stack · IA/ML · 3D interactivo',
  lugar='Santiago, Chile — remoto o presencial',
  secResumen='Perfil profesional', secCifras='Áreas de especialización',
  secExp='Experiencia profesional', secObras='Proyectos destacados', secObras2='Proyectos destacados (cont.)', secStack='Habilidades técnicas',
  secComo='Cómo trabajo', secEdu='Educación', secIdiomas='Idiomas y reconocimientos',
  pie2='Proyectos destacados', pie3='Habilidades y formación',
  resumen='Ingeniero de software autodidacta, con formación en Ingeniería Física. Construyo productos de punta a punta —arquitectura, backend, aplicaciones web y nativas, machine learning aplicado y diseño— y hoy lidero la ingeniería de <b>FIDELYA</b>, que desarrollé desde cero y que opera con <b>clientes de pago</b>. Antes lideré la de <b>GoAuto</b>, con equipos en Chile, LATAM y Estados Unidos. Haber trabajado en cada capa del producto es lo que me permite decidir arquitectura con criterio técnico.',
  cifrasPie='',
  exp=[
    dict(cargo='Cofundador, <em>CEO y CTO</em>', emp='FIDELYA',
         meta='Ene 2025 – Presente · Santiago, Chile · SaaS multi-tenant',
         puntos=[
           'Diseñé y construí una <b>plataforma multi-tenant con una base de datos aislada por local</b> —NestJS, MongoDB, Next.js y WebSockets en tiempo real—: hoy <b>105 módulos, 123 controladores, 179 modelos de datos y 1.103 endpoints</b> en producción.',
           'La construí <b>solo y desde cero</b>: backend, panel, apps nativas, infraestructura, sistema de diseño y marca. Hoy lidero un equipo de seis y sigo a cargo de la arquitectura.',
           'Levanté la <b>app móvil white-label</b>: una sola base de código que produce una app distinta por local, publicada en App Store y Google Play, con actualizaciones sin pasar por la tienda.',
           'Construí <b>AURA</b>, el motor de retención: predice qué socios se están yendo a partir del consumo real y actúa sobre eso, alimentado por modelos de grafos y tensores y redes neuronales de grafos del laboratorio interno (antes Entropía Technologies).',
           'Y las partes que nadie quiere construir: motor de lealtad, facturación electrónica, punto de venta y caja, puente de impresión, inventario con recetas, agendamiento y un sistema de permisos con siete roles.',
           'A cargo del camino a producción: reviso e integro las ramas del equipo, mantengo la arquitectura coherente a medida que la tocan más manos, y hago la inducción de cada persona nueva.',
         ]),
    dict(cargo='Cofundador y <em>CTO</em>', emp='B&amp;N Solutions',
         meta='Jul 2026 – Presente · Santiago, Chile · estudio de tecnología',
         puntos=[
           'Software a medida, automatización con IA y web interactiva de alto nivel para clientes — incluida <b>una simulación de fluidos Navier-Stokes escrita en WebGL puro</b>, sin ninguna librería 3D, corriendo a 60 cuadros por segundo en un teléfono.',
           'Me hago cargo de todo el ciclo: levantamiento, arquitectura, construcción, y los documentos y presentaciones que lo venden.',
         ]),
    dict(cargo='<em>Tech Lead</em> e ingeniero full-stack', emp='GoAuto (Dropout Capital)',
         meta='Oct 2025 – Jul 2026 · Remoto · equipo LATAM + EE. UU.',
         puntos=[
           'A cargo de la arquitectura y la entrega de una plataforma de gestión automotriz con IA que opera <b>51 automotoras en Chile</b>.',
           'Lideré un equipo de más de cinco ingenieros entre LATAM y Estados Unidos, definiendo arquitectura y dirección de producto.',
         ]),
    dict(cargo='Ingeniero full-stack y de <em>machine learning</em>', emp='Physical AI Lab (Chile)',
         meta='Mar 2024 – Sep 2024 · Remoto · robótica, IA y simulación (physicalailab.cl)',
         puntos=[
           'Construí una <b>red neuronal convolucional</b> que detecta fallas en el tendido de transmisión eléctrica de SAESA a partir de imágenes de terreno.',
           'Entregué además funcionalidades full-stack en producción junto al modelo.',
         ]),
    dict(cargo='Desarrollador full-stack freelance', emp='Independiente',
         meta='2022 – 2024 · Remoto',
         puntos=['Landings, automatizaciones web y sistemas a medida, de punta a punta: de la conversación con el cliente al despliegue.']),
  ],
  obras=[
    ('Plataforma y producto', [
      ('FIDELYA — Customer Intelligence OS',
       'Plataforma multi-tenant para locales: lealtad, carta, pedido en mesa, agendamiento, facturación, campañas y analítica. Una base de datos aislada por local, así el cliente puede llevarse sus datos e irse.',
       'NestJS · MongoDB · Next.js'),
      ('Motor de fidelización',
       'El núcleo del negocio: puntos por gasto, por visita o híbrido, escalera de niveles, recompensas con reglas y medallas que se ganan con el comportamiento real. Se configura por local sin tocar código.',
       'NestJS · MongoDB · cron'),
      ('Pedido en mesa con carrito compartido',
       'Escaneas el QR impreso en tu mesa y pides desde tu teléfono. Si están varios, comparten un carrito en vivo, cada uno agrega lo suyo y la cuenta se divide al cerrar.',
       'WebSockets · React Native'),
      ('App de sala para el equipo',
       'El otro extremo de cada escaneo: mesas por zona y estado, comandas a cocina, punto de venta táctil, división de cuenta y cobro, en el teléfono del garzón.',
       'React Native · sockets'),
      ('Apps nativas white-label',
       'Una sola base en React Native que compila una app por local — con su nombre, ícono, paleta y funciones. Publicadas en las dos tiendas, con actualización sin pasar por ellas.',
       'Expo · EAS'),
      ('Club Happy People',
       'La app de un teatro restaurant de Santiago, publicada en la App Store: puntos, carta, pedido en mesa, cartelera de shows y juego de previa. Del primer commit a la tienda, solo.',
       'App Store · Expo'),
      ('Motor de facturación electrónica',
       'Documentos tributarios chilenos de punta a punta: firma, emisión, seguimiento y la contabilidad detrás — dentro de la plataforma, no pegado por fuera.',
       'Node · criptografía · SII'),
      ('Punto de venta, caja e inventario',
       'Caja con apertura, cierre y arqueo, inventario con recetas que descuentan insumos por plato, y un puente de impresión hacia térmicas USB.',
       'Node · WebUSB'),
    ]),
    ('Inteligencia artificial y visión por computador', [
      ('AURA — motor de retención',
       'Predice qué socios se están yendo a partir del consumo real y dispara la acción sin que nadie apriete un botón. Se alimenta de modelos de grafos y tensores del laboratorio interno.',
       'GNN · tensores · Python'),
      ('AMBAR — agente de post-venta',
       'Un agente que toma la conversación después de la compra: seguimiento, resolución y recuperación, con el contexto del cliente y su historial a mano.',
       'LLM · agentes'),
      ('Boletas a puntos — en construcción',
       'Red neuronal que lee la boleta de papel fotografiada por el cliente y le acredita los puntos que corresponden, para que un local entre al programa sin integrar su punto de venta.',
       'visión · OCR · PyTorch'),
      ('Detección de fallas en líneas eléctricas',
       'Red convolucional que marca anomalías en el tendido de transmisión a partir de imágenes de terreno, para una eléctrica chilena (SAESA).',
       'PyTorch · CNN'),
      ('Nubes de puntos con dron para inspección',
       'Procesamiento de nubes de puntos capturadas con dron para inspeccionar líneas eléctricas en terreno: segmentación del tendido, distancia a la vegetación y detección de invasiones. Para SAESA con Akame Ingeniería.',
       'Python · LiDAR'),
      ('Visión por computador sobre robot cuadrúpedo',
       'Segmentación y análisis de anomalías en ventanas a partir de lo que captura un robot Spot, con la plataforma de control y analítica alrededor: recorridos, hallazgos y reportes.',
       'segmentación · Spot'),
    ]),
    ('Simulación, gráficos y juego', [
      ('Simulación de fluidos en WebGL',
       'Un solver de Navier-Stokes escrito en WebGL puro —advección, vorticidad y presión por Jacobi—, sin librerías 3D. Corre a 60 cuadros en un teléfono y reacciona al scroll y al tacto.',
       'WebGL · GLSL'),
      ('Materia 3D esculpida por el scroll',
       'Un campo de metaballs con normales analíticas, con la altura tomada de la raíz del campo y no de la gaussiana cruda. Cada capacidad de una empresa es una simulación distinta que muta sobre la anterior mientras se baja.',
       'WebGL · shaders'),
      ('Motor de juego con memoria',
       'Un motor de previa que reparte de un mazo de 357 cartas sin repetir, recuerda lo que salió en noches anteriores y cambia su propio tono a medida que avanza la noche.',
       'TypeScript · React Native'),
      ('Laboratorio de simulaciones',
       'Cerca de cuarenta piezas interactivas —Navier-Stokes, Chladni, Gray-Scott, boids, doble rendija, Collatz, curvatura— escritas de cero, como estudio y como demostración.',
       'Canvas · WebGL'),
      ('Documentos interactivos',
       'Presentaciones y documentos técnicos que son páginas web de verdad: simulaciones amarradas al scroll y un PDF en formato carta generado desde la misma fuente.',
       'GSAP · Canvas · Puppeteer'),
    ]),
    ('Datos, hardware e integraciones', [
      ('Integración con ticketera',
       'La cartelera del local dentro de la app: elenco deducido del título del evento, disponibilidad real y compra sin salir. Su API pública filtraba datos bancarios: todo pasa por un proxy que los borra.',
       'REST · caché'),
      ('Hardware e IoT',
       'Un wearable sobre Raspberry Pi 5, y control de iluminación por la red local hablando el protocolo del fabricante directamente — sin nube ni app de por medio.',
       'Raspberry Pi · Python · LAN'),
      ('Importador de catálogos',
       'Toma la carta que un local ya tiene publicada y la deja cargada como demo en minutos —categorías, precios y fotos—, para poder mostrarle su propia app antes de la primera reunión.',
       'Node · scraping'),
      ('Campañas y correo por local',
       'Campañas segmentadas que salen con el remitente y el dominio de cada local, no del proveedor: correo transaccional y de campaña separados por inquilino.',
       'Resend · segmentación'),
      ('Agendamiento y espacios',
       'Reservas de mesa, de servicio y de espacios, con disponibilidad por profesional, ventanas horarias y bloqueos por fecha.',
       'NestJS · calendario'),
      ('Pasaporte entre locales',
       'La app de la marca: mapa de locales, puntos que cruzan de uno a otro y un buscador global, sobre la misma base multi-tenant.',
       'React Native · mapas'),
      ('Generador de piezas para redes',
       'Carruseles de marca generados desde un lienzo panorámico que se corta en láminas, con la identidad de cada local aplicada.',
       'Canvas · Node'),
    ]),
  ],
  como=[
    ('Profundidad para poder liderar','He llevado productos de una carpeta vacía a la App Store por mi cuenta: modelo de datos, API, panel, app, infraestructura, diseño y textos. Eso es justamente lo que me permite repartir el trabajo, revisarlo y hacerme cargo del código de otro.'),
    ('Física antes que frameworks','Tres años de ingeniería física. Aparece donde importa: simulaciones, modelos, y saber cuándo un problema es de matemática y no de escribir más código.'),
    ('El diseño no es decoración','El sistema de diseño y la interfaz los hago yo. Un producto que nadie entiende es un producto que nadie usa.'),
  ],
  edu=[('Ingeniería Física — Universidad Andrés Bello','2019 – 2022 · tres años, incompleta · ciencia de datos y modelamiento matemático'),
       ('Enseñanza media técnica — Telecomunicaciones','2014 – 2017 · programación, redes, electrónica y fibra óptica')],
  idiomas=[('Español','Nativo'),('Inglés','Competencia profesional')],
  honores='Founder Institute Chile 2026 — seleccionado.',
  nota='Hay una versión de una columna y sin iconos, para filtros automáticos de postulación, a pedido.',
  remate='<b>Lo que busco:</b> un equipo técnicamente exigente, donde pueda involucrarme de verdad en los problemas: desde las decisiones de arquitectura hasta lo que termina funcionando en producción. Valoro la autonomía, el criterio técnico y trabajar con gente que eleve el nivel del equipo.',
)

ET_STACK = {
 'en': {'lenguajes':'Languages','backend':'Backend & data','frontend':'Frontend',
        'movil':'Mobile','3d':'Interactive & 3D','ia':'AI / ML','herramientas':'AI tooling',
        'infra':'Infrastructure','producto':'Product & design'},
 'es': {'lenguajes':'Lenguajes','backend':'Backend y datos','frontend':'Frontend',
        'movil':'Móvil','3d':'Interactivo y 3D','ia':'IA / ML','herramientas':'Herramientas de IA',
        'infra':'Infraestructura','producto':'Producto y diseño'},
}
ET_CIFRAS = {
 'en': ['From the data model to deployment, with the judgement to decide what to build and what to leave alone.',
        'APIs, databases, real time, and the infrastructure that keeps them standing in production.',
        'Computer vision, graph models and agents, put to work on real data.',
        'Design system, interface and copy: what makes someone understand and actually use what was built.'],
 'es': ['Del modelo de datos al despliegue, con criterio para decidir qué construir y qué no tocar.',
        'APIs, bases de datos, tiempo real y la infraestructura que las sostiene en producción.',
        'Visión por computador, modelos de grafos y agentes, puestos a trabajar sobre datos reales.',
        'Sistema de diseño, interfaz y copy: lo que hace que alguien entienda y use lo construido.'],
}

SCRIPT = """<script>
/* Modo impreso: se marca ANTES de medir nada. De `html[data-pdf]` cuelgan las
   reglas que quitan el margen entre hojas — sin esto, los 24 px de separación
   de las tres hojas suman una página en blanco al final del PDF. */
if (new URLSearchParams(location.search).has('pdf')) document.documentElement.dataset.pdf = '1';
/* Teléfono: la hoja no se reflowea, se encoge entera. El origen va en
   `top left`: dentro de un cuerpo de 390 px el `margin:0 auto` de una hoja de
   816 se resuelve en cero, así que escalar desde el centro corre el borde. */
(function(){
  var pila = document.getElementById('pila');
  function ajustar(){
    if (document.documentElement.hasAttribute('data-pdf')) return;
    pila.style.height = ''; pila.style.transform = '';
    var disp = document.documentElement.clientWidth;
    if (disp >= 880) return;
    var k = disp / 816, alto = pila.getBoundingClientRect().height;
    pila.style.transform = 'translateX(' + ((disp - 816 * k) / 2) + 'px) scale(' + k + ')';
    pila.style.height = (alto * k) + 'px';
  }
  addEventListener('resize', ajustar); addEventListener('load', ajustar); ajustar();
})();
</script>"""

def construir(d):
    L = d['lang']
    cont = ''.join(f'<span><span class="et">{k}</span><b>{v}</b></span>' for k, v in CONTACTO)
    cif = ''.join(f'<div><b>{n}</b><span>{ET_CIFRAS[L][i]}</span></div>' for i, n in enumerate(CIFRAS[L]))
    exp = ''.join(
        f'''<div class="exp"><div class="cargo">{e['cargo']} — {e['emp']}</div>
        <div class="meta">{e['meta']}</div><ul>''' +
        ''.join(f'<li>{p}</li>' for p in e['puntos']) + '</ul></div>'
        for e in d['exp'])
    def obras_de(grupos):
        """Lista editorial: un filete por obra, título · qué es · con qué."""
        return ''.join(
            f'<div class="gobra"><div class="et">{g}</div>' + ''.join(
                f'<div class="fila"><h3>{t}</h3><p>{txt}</p><div class="tt">{tt}</div></div>'
                for t, txt, tt in filas) + '</div>'
            for g, filas in grupos)
    stack = ''.join(grupo(ET_STACK[L][k], v, L) for k, v in STACK)
    como = ''.join(f'<div class="card gris"><span class="k">{i+1:02d}</span><h4>{t}</h4><p>{p}</p></div>'
                   for i, (t, p) in enumerate(d['como']))
    edu = ''.join(f'<div class="exp" style="margin-top:9px"><div class="cargo" style="font-size:11.5px">{t}</div><div class="meta">{s}</div></div>'
                  for t, s in d['edu'])
    idi = ''.join(f'<dt>{a}</dt><dd><b>{b}</b></dd>' for a, b in d['idiomas'])

    top2 = lambda p: f'''<div class="top2"><span class="n">Nicolás Moreno</span>
        <span class="r">{d['rol']}</span><span class="p">{p}</span></div>'''
    pie = lambda s, n: f'''<div class="pie"><span><b>{s}</b></span><span>{d['lugar']}</span><span>{n}</span></div>'''

    h1 = f'''  <section class="hoja">
    <div class="top">
      <div>
        <div class="nombre">Nicolás<br>Moreno Ávila</div>
        <div class="rol">{d['rol']}</div>
      </div>
      <div class="contacto">{cont}</div>
    </div>
    <div class="cuerpo" style="padding-top:16px">
      <h2 class="sec">{d['secResumen']}</h2>
      <p class="lead">{d['resumen']}</p>

      <h2 class="sec">{d['secCifras']}</h2>
      <div class="cifras caps">{cif}</div>

      <h2 class="sec">{d['secExp']}</h2>
      {exp}
    </div>
    {pie(d['secExp'], '1 / 4')}
  </section>'''

    h2 = f'''  <section class="hoja">
    {top2('2 / 4')}
    <div class="cuerpo">
      <h2 class="sec" style="margin-top:0">{d['secObras']}</h2>
      <div class="obras">{obras_de(d['obras'][:2])}</div>
    </div>
    {pie(d['pie2'], '2 / 4')}
  </section>'''

    h3 = f'''  <section class="hoja">
    {top2('3 / 4')}
    <div class="cuerpo">
      <h2 class="sec" style="margin-top:0">{d['secObras2']}</h2>
      <div class="obras">{obras_de(d['obras'][2:])}</div>
    </div>
    {pie(d['pie2'], '3 / 4')}
  </section>'''

    h4 = f'''  <section class="hoja">
    {top2('4 / 4')}
    <div class="cuerpo">
      <h2 class="sec" style="margin-top:0">{d['secStack']}</h2>
      {stack}

      <h2 class="sec">{d['secComo']}</h2>
      <div class="cols-3">{como}</div>

      <h2 class="sec">{d['secEdu']}</h2>
      {edu}

      <h2 class="sec">{d['secIdiomas']}</h2>
      <dl class="linea">{idi}</dl>
      <p class="chico" style="margin-top:7px">{d['honores']}</p>

      <div class="cita abajo" style="margin-top:auto">{d['remate']}</div>
    </div>
    {pie(d['pie3'], '4 / 4')}
  </section>'''

    return f'''<!doctype html>
<html lang="{L}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nicolás Patricio Moreno Ávila — CV</title>
<link rel="icon" href="/favicon.svg">
<link rel="stylesheet" href="/cv/build/fuentes.css">
<link rel="stylesheet" href="/cv/build/estilo.css">
</head>
<body>
{SPRITE}
<div id="pila">
{h1}
{h2}
{h3}
{h4}
</div>
{SCRIPT}
</body>
</html>
'''

for L in ('en', 'es'):
    d = T[L]
    open(os.path.join(DEST, d['archivo']), 'w').write(construir(d))
    print(d['archivo'], 'ok')
