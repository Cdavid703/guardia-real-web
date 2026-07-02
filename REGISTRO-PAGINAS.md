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
| **Partituras / Repertorio** | `RepertorioPanel` | Ven: todos los miembros · Suben: **admin + director musical** | ✅ |

## Panel (dashboard)
| Página | Ruta | Quién accede | Estado |
|---|---|---|---|
| Gestión de usuarios (Resumen/Integrantes/Solicitudes/Cuentas) | `/dashboard/admin` | Admin | ✅ |
| Secciones (roster + cumpleaños + mi ficha) | `/dashboard/secciones` | Miembros | ✅ |
| Mi portal (integrante) | `/dashboard/integrante` | Integrante/admin | ✅ |
| Repertorio (director) | `/dashboard/director` | Admin/director | ✅ (base) |

---

## 🎼 Repertorio — canciones y datos

Colección Firestore: `repertoire`. PDFs en Storage: `repertoire/...`.
Reglas: **miembros leen · admin y directores escriben**.

### Datos de cada canción
`numeroMarcacion`, `titulo`, `compositor`, `arreglista`, `genero`, `tonalidad`,
`compas`, `tempo`, `duracion`, `ano`, `dificultad`, `notas`, `partituras[]` (por instrumento),
`visibleTo`, `createdAt`, `updatedAt`, `uploadedBy`.

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
