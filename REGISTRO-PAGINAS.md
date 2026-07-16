# 📖 Registro de páginas — Guardia Real de Antioquia

Documento vivo. Cada vez que creamos o cambiamos una página del portal la anotamos aquí:
qué es, su ruta, quién la ve y su estado. Marca de la banda: **escudo** (`/images/escudo.png`)
y **mascota (el gato)** (`/images/mascota.png`) — deben aparecer en cada página nueva.

---

## Sitio público
| Página | Ruta | Quién accede | Estado |
|---|---|---|---|
| Inicio | `/` | Todos | ✅ |
| Nosotros | `/nosotros` | Todos | ✅ |
| Servicios (Servicios/Contratantes/Contacto) | `/servicios` | Todos | ✅ |
| Eventos | `/eventos` | Todos | ✅ |
| Galería | `/galeria` | Todos | ✅ |
| Galería — Calarcá 2026 | `/galeria/calarca-2026` | Todos | ✅ |
| Noticias | `/noticias` | Todos | ✅ |
| Ingresos (formulario) | `/ingresos` | Todos | ✅ |
| Donar | `/donar` | Todos | ✅ |
| Login | `/login` | Todos (Google + Microsoft) | ✅ |

## Área de Integrantes (`/integrantes` — menú superior, solo personal de la banda)
| Pestaña | Componente | Quién accede | Estado |
|---|---|---|---|
| Mi ficha | `MiFichaIntegrante` | Integrante/dir/junta/cm/admin | ✅ |
| Uniformes | `UniformesPanel` | idem | ✅ |
| Noticias | `EquipoNoticiasPanel` | idem | ✅ |
| Ensayos | `EquipoEnsayosPanel` | idem | ✅ |
| Historia (archivo de viajes) | `HistoriaPanel` | idem | ✅ |
| Inicio (pagos, asistencia, agenda del integrante) | `MiResumen` | Integrante | ✅ |
| **Itinerario de presentaciones** | `ItinerarioPanel` (datos en `src/lib/itinerarios.ts`) | Todo el personal | ✅ |
| **Partituras / Repertorio** | `RepertorioPanel` | Ven: todos los miembros · Suben: **admin + director musical** | ✅ |
| Confirmación de chaqueta (dentro de Uniformes) | `ChaquetaConfirmacion` + `SignaturePad` | El integrante confirma y firma cuando el admin lo solicita | ✅ |

## Panel (dashboard)
| Página | Ruta | Quién accede | Estado |
|---|---|---|---|
| Gestión de usuarios (Resumen/Integrantes/Solicitudes/Cuentas) | `/dashboard/admin` | Admin | ✅ |
| Uniformes — control (Chaquetas / Kepis) | `/dashboard/admin/uniformes` | Admin | ✅ |
| Giras y viajes (inscritos + CSV) | `/dashboard/admin/giras` | Admin | ✅ |
| Autorización de menores (firma del acudiente) | Mi ficha → `AutorizacionMenor` | Integrante menor de edad | ✅ |
| Secciones (roster + cumpleaños + mi ficha) | `/dashboard/secciones` | Miembros | ✅ |
| Mi portal (integrante) | `/dashboard/integrante` | Integrante/admin | ✅ |
| Repertorio (director) | `/dashboard/director` | Admin/director | ✅ (base) |
| Asistencia a ensayos (QR + manual + kiosco) | `/dashboard/director/asistencia` | Admin/director | ✅ |
| Auto-registro de asistencia (QR del ensayo) | `/asistencia/[ensayoId]` | Integrante (su propia) | ✅ |

---

## 🎽 Control de uniformes (chaquetas y kepis)

- **Admin** en `/dashboard/admin/uniformes`: **tres pestañas** (`?tab=`):
  - **Resumen** (`ResumenUniformes`): tabla con ambas prendas por integrante de un vistazo
    + tallas, contadores y CSV.
  - **Chaquetas** y **Kepis** (`PrendaPanel`, mismo grid genérico): checkbox "tiene", botón
    **Solicitar** (marca solicitud + WhatsApp con link directo), estados (Sin registrar /
    Solicitada / Confirmada / **No la tiene** → **Volver a preguntar**), **selección múltiple
    para solicitar en lote** (modal con enlaces de WhatsApp), **inventario** por integrante
    (n.º de prenda, entrega y devolución con fecha), **Ver firma** y CSV.
- **Integrante** en `/integrantes` → pestaña **Uniformes**: por cada prenda solicitada, banner
  con **Sí** (indica **talla** + firma con el dedo, `SignaturePad`) o **No la tengo**.
- Datos: `integrantes.chaqueta` y `integrantes.kepis` = `{ tiene, estado, talla, numero,
  entregadaEn, devueltaEn, solicitadaEn/Por, confirmadaEn, firmaNombre, respondidaEn }`.
  La **imagen de la firma** va en `integrantesPrivado.{chaqueta|kepis}Firma` (solo admin/dueño).
  El **Color Guard** se excluye de ambas. Reglas de Firestore SIN cambios.
- **Extras**: **constancia en PDF** por integrante (admin en Ver firma; integrante en su
  tarjeta confirmada) vía `src/lib/constancia.ts` (jsPDF). **Reporte de tallas** agregado en
  Resumen. **Historial/bitácora** por prenda (`historial[]`) visible en el modal de inventario.
  **Badge** de solicitudes pendientes en el menú lateral. **Aviso por correo** al admin cuando
  alguien firma o responde que no (`/api/uniformes/notify`, Resend).

## 🎼 Repertorio — canciones y datos

Colección Firestore: `repertoire`. PDFs en Storage: `repertoire/...`.
Reglas: **miembros leen · admin y directores escriben**.

### Datos de cada canción
`numeroMarcacion`, `titulo`, `compositor`, `arreglista`, `genero`, `tonalidad`,
`compas`, `tempo`, `duracion`, `ano`, `dificultad`, `notas`, `partituras[]` (por instrumento),
`visibleTo`, `createdAt`, `updatedAt`, `uploadedBy`.

### Repertorio oficial — Temporada 2026 (orden de marcación)
0. Calentamiento (Dragon Ball) · 1. Pregón Costeño · 2. Yolanda (Querubín) · 3. La Faldita ·
4. Carita de Luna · 5. La Nene · 6. Noches de Fantasía · 7. Cumbia en Do (Do menor) · 8. Mambo No. 5
> Todos precargados con sus partituras (nombre de instrumento = nombre del archivo).
> **Semana Santa** va en una **categoría aparte** dentro de la misma pestaña
> (botón "✝️ Semana Santa"): Jerusalén, Procesión del Sardar, Señor Soy Pecador, Ten Piedad de Mí.
> Fuente de datos: `src/lib/repertorio-data.json` (generado desde los PDF). PDFs en `/public/partituras/`.
> Metadatos por tema en `META` de `src/lib/repertorio.ts` (extraídos del encabezado de las
> partituras): **arreglista, compositor conocido, género, tempo y notas** ya cargados.
> Arreglistas: Rodrigo Bolívar (RodroGass) en la mayoría; Justin May (Carita de Luna, La Nene);
> Faber Restrepo (Cumbia en Do). Falta confirmar con el director: **tonalidad, tempo (BPM),
> duración y dificultad** de la mayoría. No se subieron los "ejercicios técnicos".

### Canción #8 — Mambo #5
- **Compositor:** Dámaso Pérez Prado
- **Arreglo:** José Gómez
- **Género:** Mambo (latino)
- **Tonalidad:** Mi♭ mayor (3 bemoles, concierto)
- **Compás:** 2/2 (cut time)
- **Tempo:** ≈ 190 BPM · **Duración:** ≈ 2:30 min · **Dificultad:** Intermedio
- **Título mostrado:** Mambo No. 5 · **N.º de marcación:** 8
- **Partituras (14):** Flauta, Píccolo, Clarinete 1, Clarinete 2, Sax Alto, Sax Tenor,
  Sax Barítono, Trompeta 1, Trompeta 2, Trombón 1, Trombón 2, Melófono, Tuba, Tuba Si♭
- Servidas desde `/public/partituras/mambo-5/` (tema base en `src/lib/repertorio.ts`).
