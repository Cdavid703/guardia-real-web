# Guía de configuración — Guardia Real Web

## Paso 1: Instalar Node.js

1. Ve a https://nodejs.org → descarga la versión **LTS** (la recomendada)
2. Instala normalmente (siguiente → siguiente → instalar)
3. Verifica abriendo una terminal nueva:
   ```
   node --version   # debe mostrar v20.x.x o superior
   npm --version    # debe mostrar 10.x.x o superior
   ```

---

## Paso 2: Instalar dependencias del proyecto

Abre una terminal en la carpeta del proyecto:
```bash
cd "C:\Users\cjarami6\Documents\BGRA\guardia-real-web"
npm install
```
Espera ~2 minutos mientras se descargan los paquetes.

---

## Paso 3: Crear el proyecto en Firebase

1. Ve a https://console.firebase.google.com
2. Clic en **"Crear un proyecto"**
3. Nombre: `guardia-real-antioquia` → Siguiente → Desactivar Google Analytics → Crear
4. Una vez creado:

### Activar Authentication
- Menú izquierdo → **Authentication** → Comenzar
- Pestaña **Sign-in method**
- Habilitar **Google** → email de soporte: pon tu Gmail → Guardar
- Habilitar **Microsoft** → (ver Paso 4 para obtener Client ID y Secret) → Guardar

### Activar Firestore
- Menú izquierdo → **Firestore Database** → Crear base de datos
- Modo **producción** → Ubicación: `us-central` → Listo

### Obtener credenciales del cliente
- Configuración (⚙️) → **Configuración del proyecto**
- Pestaña **General** → sección "Tus aplicaciones"
- Clic en **</>** (Web app) → Registrar app: nombre `web` → Registrar
- Copia el objeto `firebaseConfig` que aparece

---

## Paso 4: Configurar Microsoft OAuth

1. Ve a https://portal.azure.com → Busca "App registrations"
2. Clic **+ New registration**
   - Nombre: `Guardia Real Web`
   - Tipo de cuenta: `Accounts in any organizational directory and personal Microsoft accounts`
   - Redirect URI: `https://[TU-PROYECTO].firebaseapp.com/__/auth/handler`
   - Registrar
3. Copia el **Application (client) ID**
4. Menú izquierdo → **Certificates & secrets** → New client secret → Copia el **Value**
5. En Firebase Authentication → Microsoft → pega Client ID y Client Secret

---

## Paso 5: Crear el archivo .env.local

Copia el archivo de ejemplo y completa tus credenciales:
```bash
copy .env.local.example .env.local
```
Abre `.env.local` con el Bloc de notas y llena:
```
NEXT_PUBLIC_FIREBASE_API_KEY=        ← de firebaseConfig.apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=    ← de firebaseConfig.authDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=     ← de firebaseConfig.projectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET= ← de firebaseConfig.storageBucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID= ← de firebaseConfig.messagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=         ← de firebaseConfig.appId
```

---

## Paso 6: Configurar Firestore Security Rules

En Firebase Console → Firestore → Reglas, pega:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Solo el propio usuario o admin puede leer/editar su perfil
    match /users/{userId} {
      allow read: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }

    // Noticias: cualquiera puede leer las publicadas; solo admin puede escribir
    match /news/{docId} {
      allow read: if resource.data.published == true || (
        request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'director', 'junta']
      );
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Cotizaciones: cualquiera puede crear; solo admin puede leer/modificar
    match /quotes/{docId} {
      allow create: if true;
      allow read, update: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Eventos: autenticados los leen; admin y director los crean
    match /events/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'director'];
    }

    // Documentos institucionales: junta y admin
    match /documents/{docId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'junta'];
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'junta'];
    }

    // Galería: cualquiera puede leer; solo admin puede subir
    match /gallery/{docId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## Paso 7: (Opcional) Configurar Resend para emails

1. Ve a https://resend.com → crea cuenta gratuita
2. Dashboard → API Keys → Create API Key
3. Agrega en `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```
4. En Resend → Domains → añade tu dominio (o usa el dominio de prueba de Resend)

---

## Paso 8: Poner el escudo en la carpeta public

Copia el escudo principal al proyecto:
```bash
copy "..\Escudo Guardia Real de Antioquia-04_112023.png" "public\images\escudo.png"
```

---

## Paso 9: Ejecutar el proyecto en desarrollo

```bash
npm run dev
```
Abre http://localhost:3000

---

## Paso 10: Crear el primer usuario admin

1. Abre la app → ve a /login → inicia sesión con tu Google/Microsoft
2. En Firebase Console → Firestore → colección `users`
3. Busca tu documento (por tu UID) → edita → cambia `role` de `pending` a `admin`
4. Recarga la app → ya tendrás acceso al panel de administrador

---

## Estructura de archivos generados

```
guardia-real-web/
├── src/
│   ├── app/
│   │   ├── (public)/          → Páginas públicas (Inicio, Nosotros, etc.)
│   │   ├── (auth)/            → Login y página de espera
│   │   ├── dashboard/         → Portal privado con roles
│   │   └── api/contact/       → API para emails de cotización
│   ├── components/
│   │   ├── layout/            → Navbar, Footer
│   │   ├── sections/          → Secciones Hero, About, Services
│   │   └── dashboard/         → Sidebar, Topbar del portal
│   ├── contexts/AuthContext   → Estado global de autenticación
│   ├── lib/firebase.ts        → Funciones de Firebase
│   └── types/index.ts         → Tipos TypeScript
├── .env.local.example         → Plantilla de variables de entorno
├── tailwind.config.ts         → Colores y diseño de la marca
└── SETUP.md                   → Esta guía
```
