/* Genera el PDF de la propuesta desde el mismo HTML.

   Requiere el sitio servido, porque las rutas son absolutas (/fonts, /propuesta):
     python3 -m http.server 8899                                  # desde nicolas-moreno/
     node propuesta/pdf.js elseed Propuesta-el-seed-Nicolas-Moreno.pdf

   `?pdf=1` pone al chasis en modo impreso: las láminas vuelven al flujo, cada
   simulación se resuelve una vez y se congela, y no se monta navegación.
   `preferCSSPageSize` respeta el @page de 1280×720 — una lámina, una página. */
const puppeteer = require('/Users/amser/Development/FIDELYA/node_modules/puppeteer');
const path = require('path');

// node propuesta/pdf.js <ruta> <archivo.pdf>
const RUTA = process.argv[2] || 'elseed';
const NOMBRE = process.argv[3] || 'propuesta.pdf';
const PUERTO = process.env.PUERTO || 8899;
const URL = `http://localhost:${PUERTO}/${RUTA}/?pdf=1`;
const OUT = path.resolve(__dirname, '..', RUTA, NOMBRE);

(async () => {
  const browser = await puppeteer.launch({headless:'new', args:['--no-sandbox']});
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => console.error('ERROR EN LA PÁGINA:', e.message));
    /* deviceScaleFactor 1,5 y no 2. El texto del documento es VECTORIAL —las
       fuentes van embebidas— así que la escala no lo toca: lo único que se
       rasteriza son los lienzos de las simulaciones. Medido sobre este
       documento: 0,96 MB a escala 1, 1,41 MB a 1,5 y 1,90 MB a 2. A 1,5 los
       filetes de un píxel siguen limpios al hacer zoom y el archivo pesa un
       26% menos que a 2, que es lo que se nota al adjuntarlo. */
    await page.setViewport({width:1280, height:720, deviceScaleFactor:1.5});
    await page.goto(URL, {waitUntil:'networkidle0'});
    await page.waitForFunction("document.documentElement.dataset.listo === '1'", {timeout:20000});
    // Las fuentes tienen que estar resueltas antes de imprimir: si no, Chrome
    // compone con la de respaldo y el documento sale con otra tipografía.
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(r => setTimeout(r, 400));
    await page.pdf({
      path: OUT,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {top:0, right:0, bottom:0, left:0}
    });
    console.log('PDF:', OUT);
  } finally {
    await browser.close();
  }
})();
