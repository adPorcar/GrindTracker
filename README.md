# ☕ MoliendaCafé - PWA Minimalista para iOS

Aplicación Web Progresiva (PWA) minimalista y ligera diseñada para registrar, calibrar y gestionar moliendas de café de especialidad desde dispositivos móviles (especialmente optimizada para iOS Safari).

Cuenta con una arquitectura **backend-less** conectada a **Google Apps Script** y **Google Sheets**, con soporte para modo oscuro conmutable y persistente, instalación como App nativa en iPhone y modo demo inmediato.

---

## 📋 Índice
1. [Características](#-características)
2. [Puesta en Marcha Local](#-puesta-en-marcha-local)
3. [Instalación en iPhone / iOS Safari (PWA)](#-instalación-en-iphone--ios-safari-pwa)
4. [Configuración de Google Workspace (Drive, Sheets y Apps Script)](#-configuración-de-google-workspace)
   - [Paso 1: Carpeta en Google Drive](#paso-1-crear-la-carpeta-en-google-drive)
   - [Paso 2: Hoja Global de Autenticación](#paso-2-crear-la-hoja-de-auth)
   - [Paso 3: Desplegar el Script `Code.gs`](#paso-3-desplegar-el-script-codegs)
   - [Paso 4: Conectar la App (`src/config.js`)](#paso-4-conectar-la-app-en-srcconfigjs)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Modo Demo Local](#-modo-demo-local)

---

## ✨ Características

- **Diseño Móvil Minimalista**: Estética inspirada en café de especialidad (tonos crema, latte, espresso y terracota).
- **Modo Oscuro Persistente**: Alternancia entre modo claro cálido y modo oscuro profundo con sincronización de la barra de estado de iOS.
- **Optimización iOS**:
  - Safe Area Insets (respeta el notch y el indicador de inicio de iPhone).
  - Web App Manifest y Service Worker para carga ultra-rápida.
  - Icono vectorial de alta resolución en pantalla de inicio.
- **Módulo de Moliendas**:
  - Autocompletado y sugerencias de molinos (Comandante C40, Eureka Mignon, 1Zpresso, etc.).
  - Selector de método (Espresso, Mokka, Filtro, Aeropress, Prensa Francesa, Cold Brew).
  - Selector decimal con botones táctiles (+ / -).
  - Filtros dinámicos en tiempo real por Molino y País de origen.
  - Edición en ventana modal flotante tipo bottom-sheet.
- **Gestión de Perfil**: Visualización de datos y cambio de nombre de usuario/contraseña.

---

## 🚀 Puesta en Marcha Local

### Requisitos previos
- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

### Pasos
1. Abre tu terminal en la carpeta del proyecto:
   ```bash
   cd "c:\Users\Procc\Documents\MIS TRASTOS\moliendaCafe"
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo exponiéndolo a tu red local:
   ```bash
   npm run dev -- --host
   ```

   Verás una salida similar a esta:
   ```text
   VITE v6.1.0  ready in 280 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.XX:5173/
   ```

---

## 📱 Instalación en iPhone / iOS Safari (PWA)

Para disfrutar de la experiencia completa a pantalla completa (sin barras de navegación de Safari):

1. **Asegúrate de que tu iPhone y tu ordenador estén conectados a la misma red Wi-Fi**.
2. En tu ordenador, anota la dirección IP que muestra Vite en `Network` (ejemplo: `http://192.168.1.45:5173`).
3. Abre **Safari** en tu iPhone y escribe esa dirección completa en la barra de URL.
4. Pulsa el botón **Compartir** de Safari (icono cuadrado con una flecha hacia arriba en la parte inferior central).
5. En el menú de opciones, desplázate hacia abajo y selecciona **"Añadir a pantalla de inicio"** (o *"Add to Home Screen"*).
6. Confirma el nombre **MoliendaCafé** y pulsa **Añadir**.
7. ¡Listo! Se creará un icono en tu iPhone. Ábrela directamente desde allí para usarla como una aplicación nativa.

---

## ☁️ Configuración de Google Workspace

Si deseas conectar la aplicación a tu propia nube de Google Drive y Google Sheets en lugar de usar el Modo Demo:

### Paso 1: Crear la Carpeta en Google Drive
1. Ve a [Google Drive](https://drive.google.com).
2. Haz clic en **Nuevo > Nueva carpeta** y nómbrala por ejemplo: `Moliendas Café Usuarios`.
3. Entra en esa carpeta y observa la URL del navegador:
   ```text
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
   ```
4. Copia la cadena alfanumérica del final. Ese es tu **`DRIVE_FOLDER_ID`** (en este ejemplo: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`).

---

### Paso 2: Crear la Hoja de Auth
1. Dentro de Google Drive, haz clic en **Nuevo > Hoja de cálculo de Google**.
2. Titúlala `MoliendaCafe_Auth`.
3. (Opcional, el script lo inicializa automáticamente si está vacía): En la fila 1 puedes colocar las cabeceras:
   - Celda A1: `username`
   - Celda B1: `password`
   - Celda C1: `user_sheet_id`
   - Celda D1: `created_at`
4. Observa la URL de esta hoja de cálculo:
   ```text
   https://docs.google.com/spreadsheets/d/1XyZ987654321_AbCdEfGhIjKlMnOpQr/edit
   ```
5. Copia el ID situado entre `/d/` y `/edit`. Ese es tu **`AUTH_SHEET_ID`** (en este ejemplo: `1XyZ987654321_AbCdEfGhIjKlMnOpQr`).

---

### Paso 3: Desplegar el Script `Code.gs`
1. Ve a [Google Apps Script](https://script.google.com/home) y pulsa en **Nuevo proyecto**.
2. Nómbralo **API MoliendaCafé**.
3. En el editor de código, borra el contenido del archivo `Código.gs` y pega íntegramente el contenido del archivo [`Code.gs`](./Code.gs) incluido en este repositorio.
4. Haz clic en el icono de guardar (💾).
5. Haz clic en el botón azul superior **Implementar > Nueva implementación** (o *Deploy > New deployment*).
6. Haz clic en el engranaje ⚙️ junto a "Seleccionar tipo" y elige **Aplicación web**.
7. Configura los siguientes campos:
   - **Descripción**: `v1 Producción MoliendaCafé`
   - **Ejecutar como**: **Yo (tu cuenta de Google)**
   - **Quién tiene acceso**: **Cualquier persona** *(Importante: permite que tu app móvil se comunique con el script sin pedir OAuth complejo)*.
8. Haz clic en **Implementar**. Si te pide autorizar permisos, acéptalos (*Avanzado > Ir a API MoliendaCafé (no seguro)*).
9. Copia la **URL de la aplicación web** generada (terminará en `/exec`). Ese es tu **`SCRIPT_URL`**.

---

### Paso 4: Configurar Variables de Entorno (`.env` y Vercel)

En Vite, las variables accesibles desde el frontend deben llevar el prefijo `VITE_`.

#### Para Desarrollo Local:
Crea o edita el archivo `.env` en la raíz del proyecto (este archivo está en `.gitignore` para no exponer tus IDs en GitHub):

```env
VITE_SCRIPT_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
VITE_AUTH_SHEET_ID=TU_AUTH_SHEET_ID
VITE_DRIVE_FOLDER_ID=TU_DRIVE_FOLDER_ID
```

#### Para Despliegue en Vercel:
1. Sube tu proyecto a GitHub e impórtalo en [Vercel](https://vercel.com).
2. Durante la creación del proyecto (o en **Settings > Environment Variables**), añade estas 3 variables:
   - **`VITE_SCRIPT_URL`**: URL de tu Web App de Apps Script (`https://script.google.com/macros/s/.../exec`).
   - **`VITE_AUTH_SHEET_ID`**: ID de tu Google Sheet de autenticación.
   - **`VITE_DRIVE_FOLDER_ID`**: ID de la carpeta de Drive.
3. Haz el despliegue (*Deploy*). ¡Vercel inyectará estas variables automáticamente durante la compilación!

---

## 📂 Estructura del Proyecto

```text
moliendaCafe/
├── public/
│   ├── icon.svg             # Icono PWA y Apple Touch Icon
│   ├── manifest.json        # Configuración PWA para instalación
│   └── sw.js                # Service Worker para caché y soporte offline
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx    # Barra de pestañas inferior iOS
│   │   ├── GrindCard.jsx    # Tarjeta de molienda con badges y notas
│   │   ├── Modal.jsx        # Bottom-sheet modal para edición
│   │   └── Navbar.jsx       # Barra superior con selector de tema
│   ├── context/
│   │   ├── AuthContext.jsx  # Sesión, registro, login y logout
│   │   └── ThemeContext.jsx # Modo claro y modo oscuro persistente
│   ├── screens/
│   │   ├── AuthScreen.jsx   # Pantalla de Login / Registro
│   │   ├── HomeScreen.jsx   # Bienvenida y accesos directos
│   │   ├── NewGrindScreen.jsx # Formulario con autocompletado y stepper
│   │   ├── GrindsListScreen.jsx # Listado con filtros de molino y país
│   │   └── ProfileScreen.jsx# Gestión de usuario y credenciales
│   ├── services/
│   │   └── api.js           # Cliente HTTP con fallback a modo demo local
│   ├── App.jsx              # Enrutamiento de vistas y estado central
│   ├── config.js            # Variables globales (SCRIPT_URL, IDs)
│   ├── index.css            # Tailwind, safe-areas de iOS y estilos
│   └── main.jsx             # Punto de entrada de React
├── Code.gs                  # Backend completo para Google Apps Script
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🧪 Modo Demo Local

Si aún no has creado tu hoja en Google Sheets o quieres probar la interfaz rápidamente:
- La aplicación detecta automáticamente si `src/config.js` aún contiene los marcadores de posición.
- En la pantalla de inicio de sesión verás el botón rápido: **"Autocompletar usuario Demo (barista / 123)"**.
- Podrás registrar nuevas moliendas, filtrar por país o molino y editar datos de forma instantánea usando almacenamiento local sincronizado en tu navegador.
