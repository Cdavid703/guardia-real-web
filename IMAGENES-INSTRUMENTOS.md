# 🎨 Imágenes profesionales de instrumentos — Guía para generarlas y ubicarlas

Estas imágenes se muestran **según el instrumento del integrante que inicia sesión**:
en su **ficha** (página `/dashboard/secciones`, banner “Tu instrumento”) y como
**motivo en el carné** digital.

---

## 📁 Dónde van

1. Crea la carpeta (si no existe):

   ```
   public/images/instrumentos/
   ```

2. Guarda cada imagen **exactamente con el nombre indicado** (todo en minúscula, con
   guiones, extensión **.png**). El sistema las busca por ese nombre; si alguna no
   existe, simplemente no se muestra (no se rompe nada).

3. Listo. No hay que tocar código: al subir el archivo con el nombre correcto, aparece.

> Ruta final de cada archivo: `public/images/instrumentos/<nombre>.png`
> Ejemplo: la trompeta va en `public/images/instrumentos/trompeta.png`

---

## 🎛️ Especificaciones técnicas (para que el set se vea uniforme)

- **Formato:** PNG
- **Tamaño sugerido:** 1200 × 900 px (relación **4:3**)
- **Fondo:** azul marino profundo degradado a negro (colores de la banda), para que
  combine con las tarjetas. **No** fondo blanco.
- **Composición:** instrumento **centrado**, con aire alrededor (en la ficha se recorta
  un poco arriba/abajo, y en el carné se ve pequeño y translúcido).
- **Sin** texto, logos, marcas de agua, personas ni manos.
- **Consistencia:** usa el **mismo estilo, fondo e iluminación** en todas para que el
  conjunto luzca como una colección profesional.

### 🎨 Bloque de estilo (ya incluido en cada prompt de abajo)

> *Professional studio product photograph, centered composition, dramatic cinematic
> lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold
> rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic reflections,
> premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high
> resolution.*

---

## 🧾 Prompts por instrumento (copia y pega)

### Vientos metal

**1. Trompeta** → `public/images/instrumentos/trompeta.png`
> A gleaming brass Bb marching trumpet with three piston valves and a flared bell facing to the right. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic metallic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**2. Trombón** → `public/images/instrumentos/trombon.png`
> A polished brass tenor trombone with its slide partially extended and bell facing forward. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic metallic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**3. Melófono** → `public/images/instrumentos/melofono.png`
> A brass marching mellophone (marching French horn) with a large forward-facing bell and rotary/piston valves. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic metallic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**4. Tuba** → `public/images/instrumentos/tuba.png`
> A large brass marching tuba / sousaphone with wide coiled tubing and a big flared bell. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic metallic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

### Vientos madera

**5. Saxofón** → `public/images/instrumentos/saxofon.png`
> A golden brass alto saxophone with a curved body, detailed pearl keys and a upturned bell. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic metallic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**6. Flauta** → `public/images/instrumentos/flauta.png`
> A silver concert transverse flute laid horizontally, showing detailed keys and rods, subtle silver reflections. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**7. Clarinete** → `public/images/instrumentos/clarinete.png`
> A black grenadilla-wood Bb clarinet standing vertically with silver keys and a slight sheen. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

### Percusión

**8. Bombos** → `public/images/instrumentos/bombos.png`
> A marching bass drum with a white drumhead, chrome hardware and a navy-and-gold shell, shown at a slight three-quarter angle. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**9. Redoblante** → `public/images/instrumentos/redoblante.png`
> A marching snare drum with a crisp white head, chrome shell and tension rods, a pair of drumsticks resting on top. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**10. Platillos** → `public/images/instrumentos/platillo.png`
> A pair of hand marching crash cymbals in polished brass, caught mid-crash with a subtle motion, leather straps. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic metallic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**11. Multitenor** → `public/images/instrumentos/multitenor.png`
> A set of marching tenor drums (quads / tenors), four toms clustered together with chrome hardware and white heads. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**12. Percusión latina** → `public/images/instrumentos/percusion-latina.png`
> A latin percussion set: a pair of congas beside timbales with a cowbell, wood and chrome finishes. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

### Otros (por rol — se enfocan en el equipo, sin personas)

**13. Color Guard** → `public/images/instrumentos/color-guard.png`
> Color guard equipment: a flowing performance flag on a pole in navy-blue and gold fabric, together with a wooden spinning rifle and a sabre, arranged dynamically. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, elegant motion, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

**14. Drum Major** → `public/images/instrumentos/drum-major.png`
> A drum major's ceremonial mace/baton with gold accents next to a plumed shako hat (marching band), presented on a subtle stand. Professional studio product photograph, centered composition, dramatic cinematic lighting, deep navy-blue to black gradient background (#0B1E4A to #05102A), warm gold rim light (#F2C100) tracing the edges, ultra sharp, high detail, realistic reflections, premium and elegant, no text, no watermark, no people, no hands, 4:3 aspect ratio, high resolution.

---

## ✅ Lista de archivos (checklist)

| # | Sección | Archivo a crear |
|---|---|---|
| 1 | Trompeta | `public/images/instrumentos/trompeta.png` |
| 2 | Trombón | `public/images/instrumentos/trombon.png` |
| 3 | Melófono | `public/images/instrumentos/melofono.png` |
| 4 | Tuba | `public/images/instrumentos/tuba.png` |
| 5 | Saxofón | `public/images/instrumentos/saxofon.png` |
| 6 | Flauta | `public/images/instrumentos/flauta.png` |
| 7 | Clarinete | `public/images/instrumentos/clarinete.png` |
| 8 | Bombos | `public/images/instrumentos/bombos.png` |
| 9 | Redoblante | `public/images/instrumentos/redoblante.png` |
| 10 | Platillos | `public/images/instrumentos/platillo.png` |
| 11 | Multitenor | `public/images/instrumentos/multitenor.png` |
| 12 | Percusión latina | `public/images/instrumentos/percusion-latina.png` |
| 13 | Color Guard | `public/images/instrumentos/color-guard.png` |
| 14 | Drum Major | `public/images/instrumentos/drum-major.png` |

---

## 💡 Notas

- **No hace falta generar las 14 de una.** Ve subiendo las que tengas; cada integrante
  verá la suya en cuanto exista el archivo con el nombre correcto.
- Si quieres, estas mismas imágenes (o unas versión más “de acción/ambiente”) pueden
  usarse también como **portada de cada sección** en la cuadrícula de
  `/dashboard/secciones`, guardándolas aparte como
  `public/images/secciones/<slug>.jpg` (mismo `<slug>`, pero **.jpg**). Eso es opcional
  y ya está soportado por el sitio.
- Consejo: genera todas con el **mismo modelo/estilo y el mismo fondo** para que el set
  se vea coherente cuando distintos integrantes las vean.
