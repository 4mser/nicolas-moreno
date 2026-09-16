# Formato de propuesta

Un solo HTML que es **tres cosas a la vez**: una presentación navegable en
pantalla ancha, una página que se baja en el teléfono, y un PDF de una lámina
por página. No hay tres archivos ni tres maquetas — hay uno, y tres modos.

Nació de la propuesta para GO Delivery (B&N Solutions) y se generalizó acá.

```
propuesta/               ← el formato. No se toca por cliente.
  estilo.css               chasis + vocabulario de láminas + los tres modos
  chasis.js                escala, navegación, ciclo de vida de los lienzos
  sims-base.js             motor de simulaciones + atractores + onda
  pdf.js                   render a PDF
  GUIA.md                  esto

<cliente>/               ← una carpeta por propuesta
  index.html               las láminas
  sims.js                  las simulaciones DE ESE problema
```

---

## Hacer una propuesta nueva

1. `mkdir <cliente>` y copiar `elseed/index.html` como punto de partida.
2. En el `<head>`, dejar los tres enlaces tal cual:

   ```html
   <link rel="stylesheet" href="/fonts/propuesta.css">
   <link rel="stylesheet" href="/propuesta/estilo.css">
   ```
   y al final del `<body>`, en este orden:
   ```html
   <script src="/propuesta/sims-base.js"></script>
   <script src="/<cliente>/sims.js"></script>
   <script src="/propuesta/chasis.js"></script>
   ```
   El orden importa: el motor crea `window.__SIS`, el archivo del cliente le
   agrega sus sistemas, y el chasis los ata a los lienzos.
3. Escribir las láminas.
4. Escribir una o dos simulaciones del problema del cliente (ver abajo).
5. `python3 -m http.server 8899` desde `nicolas-moreno/`, y
   `node propuesta/pdf.js <cliente> Propuesta-<cliente>.pdf`.

---

## La estructura que funciona

La de una propuesta de consultora, en este orden:

| # | Lámina | Para qué |
|---|--------|----------|
| 1 | Portada `.slide.full` | La simulación del problema, a sangre |
| 2 | Confidencialidad | A quién se le entrega y con qué límites |
| 3 | Por qué yo/nosotros | La credencial más fuerte, temprano |
| 4 | Carta con rail de datos | Formalidad + ficha de contacto |
| 5 | Índice | Cinco o seis secciones, no más |
| — | Divisor `.slide.full` | Número grande + simulación de fondo |
| — | Contenido con `.nav` | La barra dice en qué sección estás |
| n | Cierre `.slide.full` | Firma y datos |

Los divisores llevan `data-off=".40"` en el canvas: corre el dibujo a la
derecha para que el titular tenga la izquierda limpia.

## Vocabulario de láminas

`.cuerpo` (caja de contenido) · `.kicker` (rótulo mono) · `h1 h2 h3 p .lede` ·
`.cols` `.cols-3` · `.card` con `.k` · `.cifras`/`.cifra` · `table` con
`tr.no` (tachadas) y `tr.suma` · `.nota` (filete de acento) · `.idx`/`.it` ·
`.carta` con `.hoja` y `.rail` · `.hito` · `.gantt`/`.gfila`/`.gbar` ·
`.esq` (esquinas) · `.velo` (apaga la simulación bajo el texto).

Los enlaces usan `a.card` + `<span class="salir">` con las dos flechas: se
quedan en el PDF a propósito, porque ahí son clicables y la flecha es lo único
que lo anuncia.

## Recolorear

Todo sale de `:root` en `estilo.css`. Cambiando cinco variables cambia el
documento entero, simulaciones incluidas:

```css
--ink-rgb    tinta, de la que se derivan todos los grises
--bg-rgb     papel
--acc        acento para texto
--acc-rgb    acento con transparencia
--acc-hover  acento oscurecido, para el botón lleno
--sim-rgb    acento de los lienzos; según la paleta puede pedir un punto más
             de viveza que el de texto, o ser el mismo
--marco      el gris sobre el que flota la lámina en pantalla
```

Nada de color debe quedar cableado **fuera** de `:root` — si no, recolorear
deja de ser cambiar siete líneas y pasa a ser cazar valores por toda la hoja.
Se comprueba así, y tiene que dar cero:

```sh
sed '/^:root{/,/^}/d' propuesta/estilo.css | grep -c 'rgb([0-9]'
```

---

## Escribir una simulación

Es lo que separa esto de una plantilla. **La simulación tiene que modelar el
problema del cliente**, no ser un adorno: la cartera de arriendos que rota, el
grafo de aislamiento por fila, el mes de cobranza con su mora. El lector
reconoce su operación en el dibujo antes de leer una palabra.

Un sistema es un objeto con:

```js
SIS.loQueSea = {
  interactivo: true,                 // el cursor lo anuncia
  init(W, H) { … },                  // `this.pagina` ya viene puesto
  frame(dt, ctx, W, H, m) { … },     // m = {x, y, dentro, movido}
  reiniciar() { … }                  // opcional, al hacer clic
};
```

Herramientas en `window.__SIMKIT`: `acc(a)` `tinta(a)` `papel(a)` `TAU`
`semilla(n)` `mono(px,peso)` `hacia(v,obj,k,dt)` `atractor(cfg)` `camara()`.

### Reglas que no son opcionales

- **Semilla fija en `init`.** Nunca `Math.random()` ahí. Si el mismo documento
  se ve distinto en dos computadores, deja de ser un documento.
- **Nada aditivo.** Sobre papel se acumula tinta, no luz: aclarar es borrar.
- **Dibujar dentro de una caja.** Definir `this.caja = {x,y,w,h}` en fracción
  del lienzo y situar todo respecto a ella. Reencuadrar pasa a ser mover
  cuatro números en vez de perseguir trazos sueltos.
- **Estado previo antes del primer cuadro.** Adelantar el sistema en `init`
  (`for(let k=0;k<600;k++) this.avanzar(.1)`). Si arranca vacío, la lámina
  aparece muerta y lo interesante ocurre cuando ya nadie mira.
- **Amortiguar con `hacia()`**, que descuenta el `dt`. Sin eso, un monitor de
  120 Hz interpola al doble de velocidad que uno de 60.
- **Ritmo fijo en los sistemas con paso discreto.** Acumular el resto y topar
  el número de pasos por cuadro; si no, al volver de una pestaña en segundo
  plano un `dt` enorme dispara cientos de pasos de golpe.

---

## Trampas ya pagadas

Todas costaron una sesión de depuración. Están comentadas en el código, acá
van juntas.

**No sumar dos desplazamientos.** El chasis ya recorta el lienzo con
`data-off` para dejarle la izquierda al titular de un divisor. Si además el
sistema se corre por dentro —porque se escribió pensando en la portada, donde
el lienzo va a sangre— los dos desplazamientos se suman y el dibujo termina
estrujado contra el borde derecho con un vacío en medio de la lámina. **Un
sistema llena por defecto el lienzo que le den**; la excepción se declara en el
HTML con `data-caja="x y w h"`, que el chasis le pasa por `this.datos`.

**El estado en reposo tiene que ser el que más dice.** Una simulación que barre
un ciclo —un mes, una jornada— pasa la mayor parte del rato a medias, y el
instante que queda congelado en el PDF es uno de esos. Que repose en el ciclo
COMPLETO y que el puntero rebobine. Lo mismo con las superficies que se
amortiguan: si se apagan entre impulso e impulso, lo que se imprime es una
retícula de puntos quietos.

**Un eje lineal no siempre es la lectura correcta.** El primer intento de la
cobranza fue un calendario de treinta días con dos carriles: como dos tercios
de los pagos caen dentro de los cinco días de plazo, el carril de arriba quedó
como un grumo contra el margen y el 80 % de su largo vacío. Ordenando los
contratos por demora, las mismas cifras dibujan la distribución entera y llenan
el encuadre. Y las curvas de Bézier entre carriles, a este tamaño y a este
alfa, no se leen como trayectoria: se leen como un garabato encima de la
lámina.

**Las láminas que esperan se transparentan.** Con `visibility:hidden` el DOM
dice que están ocultas y Chrome las pinta igual, débiles, como papel de calco.
No es el `backdrop-filter` de la barra: es la **transición**, que mantiene
vivas las capas mientras corre. `content-visibility` tampoco alcanza si se
transiciona con `allow-discrete`. Por eso las inactivas van en `display:none` y
la que entra se **anima**, sin fundido cruzado.

**El PDF salía en modo teléfono.** Al imprimir, Chrome evalúa las consultas de
medio contra la caja de página, y 1280×720 cae del lado angosto: el bloque de
modo página se activaba y el PDF salía a una columna, sin barra de sección ni
pie. El bloque tiene que ser `@media screen and (max-width:900px)`.

**Los lienzos van SIN canal alfa en el PDF.** Un lienzo transparente se embebe
como imagen *más* una máscara de opacidad del mismo tamaño, y el visor tiene
que descomprimir las dos y componerlas en cada página. Con nueve sistemas eso
son dieciocho imágenes de dos megapíxeles y el documento se arrastra al pasar
de lámina. Los lienzos no necesitan transparencia —van sobre el papel y el velo
se pinta encima por CSS—, así que en modo PDF el chasis pide el contexto con
`{alpha:false}` y redefine `clearRect` para que borre a papel y no a negro.
Medido: 18 imágenes y 1,26 MB antes; 9 imágenes, cero máscaras y 0,81 MB
después. Se comprueba así, y tiene que dar cero:

```sh
python3 -c "import re,sys; d=open(sys.argv[1],'rb').read(); \
  print(len(re.findall(rb'/SMask\s+\d+\s+0\s+R', d)))" <archivo>.pdf
```

**La escala de render sólo afecta a los lienzos.** El texto es vectorial —las
fuentes van embebidas— así que subir `deviceScaleFactor` no lo mejora, sólo
engorda las imágenes. En este documento: 0,96 MB a escala 1, 1,41 a 1,5 y 1,90
a 2. `pdf.js` usa **1,5**.

**Los lienzos se congelan con la fuente que haya.** En modo PDF hay que
esperar `document.fonts.ready` **antes** de dibujar. Un lienzo es un mapa de
bits: si se pinta antes de que carguen las fuentes, los rótulos quedan en la
mono de respaldo del sistema y en el PDF ya no hay arreglo. En pantalla no se
nota porque ahí se repinta cada cuadro.

**Nada de fuentes variables.** Chrome instancia la variable por peso al
imprimir, no puede embeberla como CID y la convierte a **Type 3** — un stream
de contenido por glifo. El PDF se vuelve ilegible para el visor. Por eso
`fonts/propuesta.css` sirve estáticas, una por peso. Verificar siempre:

```sh
pdffonts <archivo>.pdf     # ninguna línea debe decir Type 3
```

**Verificar el PDF con el motor de macOS, no con poppler.** `pdftoppm`
renderiza suave y esconde estos fallos:

```sh
pdfseparate -f 1 -l 1 doc.pdf p-%d.pdf && sips -s format png -Z 1600 p-1.pdf --out p-1.png
```

**Nada de `box-shadow` en lo que va al PDF.** Quartz las dibuja como bloques
grises sólidos sobre el contenido.

**Al capturar con puppeteer, no usar `clip`.** Altera el render: la página sale
desvaída y con fantasmas que no existen en el navegador. Media hora perdida
persiguiendo un fallo de CSS que era del capturador.

**Las guías del calendario van con `offsetLeft`, no con `getBoundingClientRect`.**
La lámina va escalada: el rect devuelve píxeles de pantalla y el `left` que se
escribe se interpreta en píxeles del documento. Mezclarlos descuadra las guías.

**El puntero se escucha en la lámina, no en el canvas.** Escuchando en el
canvas falla en cuanto algo lo tapa —el velo de los divisores lo cubre entero—
y falla también fuera de sus bordes.

---

## Comprobar antes de mandar

```sh
python3 -m http.server 8899                      # desde nicolas-moreno/
node propuesta/pdf.js <cliente> Propuesta.pdf
pdffonts <cliente>/Propuesta.pdf                 # sin Type 3
```

- Contar las páginas del PDF: tiene que dar el número de `.slide`.
- Abrir el PDF en Preview.app, no sólo en el visor del navegador.
- Mirar el documento en un teléfono real: es otro modo, no el mismo encogido.
- Leer los números uno por uno. Cada cifra del documento tiene que venir de
  algo que se pueda volver a contar delante del cliente.
