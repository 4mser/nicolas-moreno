/* PDF carta del CV, desde el mismo HTML.

     python3 -m http.server 8899     # desde nicolas-moreno/
     node cv/build/render.js en      # o `es`

   `?pdf=1` marca el documento como impreso (quita el margen entre hojas y
   desactiva el escalado de teléfono). `preferCSSPageSize` respeta el @page de
   816×1056 px: una .hoja, una página.

   Se usa puppeteer y no Chrome headless a mano: la corrida a mano tarda 1-2
   minutos en este Mac y el proceso no siempre retorna. */
const puppeteer = require('/Users/amser/Development/FIDELYA/node_modules/puppeteer');
const path = require('path');

const LANG = (process.argv[2] || 'en').toLowerCase();
const ARCH = LANG === 'es' ? 'cv-nicolas-moreno-es' : 'cv-nicolas-moreno';
const PUERTO = process.env.PUERTO || 8899;
const URL = `http://localhost:${PUERTO}/cv/${ARCH}.html?pdf=1`;
const OUT = path.resolve(__dirname, '..', `${ARCH}.pdf`);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('ERROR EN LA PÁGINA:', e.message));
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 1.5 });
    await page.goto(URL, { waitUntil: 'networkidle0' });
    // Sin las fuentes resueltas, Chrome compone con la de respaldo.
    await page.evaluateHandle('document.fonts.ready');
    await new Promise((r) => setTimeout(r, 400));

    /* Una .hoja mide 1056 px y su contenido no puede pasarse: el
       `overflow:hidden` lo recorta EN SILENCIO. Se mide antes de imprimir. */
    const malas = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.hoja').forEach((h, i) => {
        const c = h.querySelector('.cuerpo');
        if (c && c.scrollHeight > c.clientHeight + 1) out.push({ pagina: i + 1, sobra: c.scrollHeight - c.clientHeight });
        if (h.scrollHeight > h.clientHeight + 1) out.push({ pagina: i + 1, hoja: true, sobra: h.scrollHeight - h.clientHeight });
      });
      return out;
    });
    const n = await page.evaluate(() => document.querySelectorAll('.hoja').length);
    if (malas.length) console.error('⚠️  DESBORDES:', JSON.stringify(malas));
    else console.log(`Sin desbordes: las ${n} hojas caben.`);

    await page.pdf({ path: OUT, printBackground: true, preferCSSPageSize: true,
      /* PDF ETIQUETADO: le da al archivo una estructura de lectura real
         (encabezados, párrafos, listas) en vez de un montón de cajas de texto.
         Es lo que usan los lectores de pantalla y lo que mejor ordena a un
         parser de ATS. `outline` agrega además el índice de secciones. */
      tagged: true,
      outline: true,
                     displayHeaderFooter: false, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log('PDF:', OUT);
  } finally { await browser.close(); }
})();
