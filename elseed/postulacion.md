# Postulación — el seed (proptech, Gran Concepción)

Documento web y PDF: `nicolas-moreno.vercel.app/elseed`

---

## 0 · Campo de presupuesto

Un solo campo para el proyecto publicado, y ese proyecto son los cuatro hitos.

```
Horas ............... 165
Valor total ......... 4125000     (Workana lo calcula con los $25.000/h del perfil)
```

Comisión $373.722 · **recibes $3.751.278**, menos la retención de la boleta.

El documento cotiza en **pesos**, no en UF: así calza al peso con lo que ve en
Workana y no hay equivalencia que envejezca.

| Hito | CLP |
|---|---:|
| H1 · Esquema, Auth y RLS | 620.000 |
| H2 · Next.js y portal del propietario | 1.240.000 |
| H3 · Workflows en n8n | 825.000 |
| H4 · Integraciones | 1.440.000 |
| **Total** | **4.125.000** |

## 0b · Adjunto y plazo

**Referencias / adjuntos:** subir
`elseed/Propuesta-el-seed-Nicolas-Moreno.pdf`. Adjuntarlo es mejor que sólo
enlazarlo: elimina cualquier duda sobre enlaces externos y el cliente lo abre
sin salir de la plataforma.

**¿Cuánto tiempo necesitas?** → `10 semanas`

## 0c · Tareas de la propuesta

**Incluido** — Archivo fuente · Integración con pasarela de pago ·
API Integration · Diseño adaptativo · Revisión extra

**Extra** — Subir el contenido · SEO structure · Chat

**En blanco** — Hosting · Dominio · SSL · Kit para redes sociales ·
WhatsApp and Social Networks links · Speed optimized

---

## 1 · Detalles de la propuesta

El campo pide una **presentación**, no un documento: texto corrido, sin
títulos numerados. Pero el aviso del cliente pide cuatro cosas concretas
(GitHub, dos proyectos, valor por hito, disponibilidad) y este es el único
campo libre, así que van todas — compactas y dentro del hilo del texto.

> Copiar desde acá.

Hola, soy Nicolás Moreno, desarrollador full-stack. Trabajo a diario con Next.js
y Supabase, que es línea por línea el stack que piden.

Vengo de construir GoAuto (goauto.cl), una plataforma de gestión para automotoras en
Next.js 16 y Supabase: 391 políticas de RLS sobre 75 tablas, 241 migraciones
versionadas, 79 Edge Functions, pagos con webhooks idempotentes y conciliación
diaria por cron, y notificaciones por WhatsApp configurables por cliente. Es el
mismo problema que el suyo con otro activo: cambien un vehículo por un inmueble
y quedan activos, mandantes, publicaciones, contratos y plata que entra a fecha.
El segundo es FIDELYA (fidelya.cl), producto propio del que soy fundador:
plataforma multi-cliente en Next.js con tres portales distintos y base aislada
por cliente, con más de 3.500 usuarios registrados.

Mi GitHub es github.com/4mser — el trabajo de cliente vive en repositorios
privados.

Sobre el valor por hito: el H1 —esquema, Auth y RLS— son $620.000 en las semanas
1 y 2, y es el único hito irreversible de los cuatro; se acepta con una matriz
de pruebas de acceso corrida delante de ustedes en su propio Supabase. El H2, la
estructura en Next.js y el portal del propietario, son $1.240.000 en las semanas
3 a 5, y es el primer entregable que ustedes pueden mostrarle a un cliente. El
H3, los workflows de alta, mandato y arriendo, son $825.000 en las semanas 6 y
7, con los flujos exportados y versionados en su repositorio y no sólo vivos en
la instancia. El H4, WhatsApp, firma electrónica y pasarela, son $1.440.000 en
las semanas 8 a 10, con la idempotencia y la conciliación adentro y no cotizadas
aparte. Cada hito se factura contra aceptación, sin anticipo: si un hito no se
acepta, no se paga.

Mi disponibilidad son 20 horas semanales comprometidas, diez semanas en total, y
puedo empezar dentro de la semana siguiente a su confirmación. Estoy en
Santiago, así que no hay diferencia horaria con el Gran Concepción. Todo queda
desde el primer día en su repositorio, su Supabase y sus cuentas.

Adjunto la propuesta completa: alcance por hito, calendario, supuestos, lo que
no incluye, y las seis preguntas que conviene cerrar antes del primer commit
—por ejemplo, si el arriendo se pacta en pesos, en UF o con reajuste por IPC,
porque eso define si el monto es un número o una fórmula con historia, y no se
cambia después sin migrar todos los contratos.

Quedo atento a sus comentarios.

> Hasta acá.

---

## 2 · Habilidades (máximo 5)

Marcar, en este orden de prioridad:

1. **Next.js** — la piden explícita y está en las etiquetas del aviso
2. **React.js** — ídem
3. **PostgreSQL** — ídem; es además donde vive el hito 1
4. **Supabase** — si aparece en el buscador de habilidades. Si no existe,
   usar **Integración de API**
5. **Automatización de procesos** — cubre n8n y los webhooks

Si el buscador ofrece **Supabase** *y* **API/Integraciones**, sacar
`Automatización` antes que cualquiera de las tres primeras: las etiquetas del
aviso son Next.js, React.js y PostgreSQL, y esas tres no se tocan.

## 3 · Proyectos del portafolio (máximo 3)

1. **GoAuto** — Next.js + Supabase, multi-cliente. El más relevante con
   diferencia: es el mismo stack y la misma forma de problema.
2. **FIDELYA** — portales con login y dashboards sobre modelo multi-cliente.
3. **Plataforma CSA** — SaaS en producción: carga masiva desde planilla,
   procesamiento y salida en documento.

**Ojo:** si estos no están cargados como proyectos en el perfil de Workana,
hay que crearlos antes de postular — el formulario sólo deja elegir entre los
que ya existen.

---

## 4 · Antes de enviar

- [x] **Valores confirmados con Nico:** 100 UF (15/30/20/35), 165 horas,
      $24.754/hora. El H1 va bajo tarifa a propósito, como entrada. Si vuelve
      a cambiar hay que tocarlo en `elseed/index.html` (lámina 24) y acá, y
      regenerar el PDF.
- [ ] **Ordenar el perfil de GitHub.** Hoy dice nombre «Amser Nicolás» y
      biografía «{-}», sin repositorios destacados. El aviso pide el enlace
      como primer punto: van a entrar. Nombre real, una línea de biografía y
      tres repos fijados cambian la primera impresión, y es media hora.
- [ ] **Revisar el enlace al documento.** Va presentado como muestra de
      trabajo, no como canal de contacto, y el documento no lleva correo ni
      teléfono a propósito. Aun así, cada plataforma interpreta los enlaces
      externos a su manera: si prefieres no arriesgar, el mensaje se sostiene
      solo sin el último bloque.
- [ ] **Verificar que el PDF abre bien** en Preview.app, no sólo en el
      navegador: `elseed/Propuesta-el-seed-Nicolas-Moreno.pdf`.
