# ☕ Grind Tracker - Progressive Web App (PWA)

**Grind Tracker** es una aplicación móvil web progresiva (PWA) de alto rendimiento, diseñada para registrar, calibrar y gestionar recetas de moliendas de café de especialidad y molinos personales desde dispositivos móviles (optimizada para iOS Safari y Android).

Cuenta con una arquitectura serverless desacoplada conectada a **Google Apps Script**, **Google Sheets** y **Google Drive**, con soporte multi-idioma dinámico (Español / Inglés), autenticación reforzada mediante **Session Tokens criptográficos (UUID)**, modo oscuro persistente y modo demo inmediato sin dependencias externas.

---

## 📋 Índice
1. [Novedades y Características](#-novedades-y-características)
2. [Arquitectura de Seguridad y Privacidad](#-arquitectura-de-seguridad-y-privacidad)
3. [Puesta en Marcha en Local](#-puesta-en-marcha-en-local)
4. [Instalación en iPhone / iOS Safari (PWA)](#-instalación-en-iphone--ios-safari-pwa)
5. [Configuración de Google Workspace (Apps Script, Sheets y Drive)](#-configuración-de-google-workspace)
6. [Módulos de la Aplicación](#-módulos-de-la-aplicación)
   - [Mis Molinos (Configuración Clicks & Dial)](#1-módulo-mis-molinos)
   - [Moliendas y Slider Adaptativo](#2-módulo-de-moliendas)
   - [Lógica Condicional para Espresso](#3-parámetros-espresso-ratio-inout)
7. [Modo Demo Local](#-modo-demo-local)

---

## ✨ Novedades y Características

- **Renombrado a Grind Tracker**: Nueva identidad visual minimalista inspirada en tonos latte, crema, terracota suave y dark mode profundo.
- **Soporte Multi-idioma Dinámico (i18n)**: Conmutador flotante en el Header para alternar instantáneamente entre **Español (ES)** e **Inglés (EN)** sin recargar la página.
- **Seguridad Reforzada con Session Tokens**:
  - Las sesiones generan tokens UUID criptográficos con caducidad.
  - El cliente nunca almacena ni gestiona credenciales de Google Drive.
  - Sanitización estricta contra inyecciones de fórmulas (`=`, `+`, `-`, `@`) en Google Sheets.
- **Nuevo Módulo "Mis Molinos"**:
  - Registro de molinos personales con calibración por **Clicks** (ej. Comandante C40, Timemore) o por **Dial / Pasos** (ej. Fellow Ode, Eureka Mignon).
  - Almacenamiento dedicado en la pestaña `molinos` de la hoja de cálculo del usuario.
- **Formulario de Molienda con Slider Progresivo Adaptativo**:
  - La barra progresiva adapta automáticamente sus límites (`min`, `max`, `step`) al molino seleccionado.
  - Entrada manual flotante (`float`, ej. `14.5` clicks o paso `2.25`) sincronizada bidireccionalmente con el slider.
  - Campos avanzados de café de especialidad: Tostadero, Variedad (Arábica, Robusta, Libérica, Excelsa), Proceso (Natural, Lavado, Honey, Anaeróbico, etc.), País de origen, Descriptores de sabor y Temperatura del agua en °C.
  - **Lógica Condicional para Espresso**: Campos automáticos obligatorios para **Café IN** (g) y **Café OUT** (g) con cálculo de ratio de extracción en tiempo real (`1:2.0`).
- **Filtrado Avanzado en "Mis Moliendas"**: 4 filtros superiores dinámicos por **Molino**, **País**, **Método** y **Proceso**, con modal flotante para edición completa.

---

## 🔒 Arquitectura de Seguridad y Privacidad

La aplicación sigue el principio de **cero privilegios en el cliente (Zero-Trust Frontend)**:

```
[ Cliente PWA / Safari ]
         │
         │  POST { action, username, sessionToken, ... }
         ▼
[ Google Apps Script Web App (Code.gs) ]  <── Contexto Seguro Serverless
         │
         ├── 1. Sanitiza inputs (evita =formula injection y XSS)
         ├── 2. Valida UUID Session Token & Expiración contra Auth Sheet
         ├── 3. Verifica propiedad de la hoja (user_sheet_id pertenece al usuario)
         ▼
[ Google Drive Carpeta Privada (DRIVE_FOLDER_ID) ]
         └── [ Hoja de Cálculo del Usuario (GrindTracker_username) ]
                   ├── pestaña 'moliendas'
                   └── pestaña 'molinos'
```

1. **Aislamiento Total de Google Drive**: El frontend no requiere claves de API de Google ni tokens OAuth de Drive. Todo el acceso a los archivos se ejecuta exclusivamente desde el backend seguro de Google Apps Script.
2. **Session Tokens UUID**: Tras un login exitoso, `Code.gs` genera un UUID criptográfico mediante `Utilities.getUuid()`, lo almacena en la hoja `Auth` con fecha de caducidad (30 días) y lo devuelve al cliente. Cada petición protegida posterior debe incluir dicho token.
3. **Validación de Propiedad de Hojas**: El backend comprueba activamente que el `userSheetId` solicitado corresponda al `username` autenticado en la fila de Auth, impidiendo accesos cruzados.
4. **Sanitización de Fórmulas de Hoja de Cálculo**: Se neutralizan prefijos como `=`, `+`, `-`, `@` anteponiendo apóstrofe de texto literal para evitar ataques de inyección de fórmulas CSV/Sheets.

---

## 🚀 Puesta en Marcha en Local

### Requisitos previos
- [Node.js](https://nodejs.org/) (versión 18 o superior).

### Pasos
1. Abre tu terminal en la carpeta del proyecto:
   ```bash
   cd "c:\Users\Procc\Documents\MIS TRASTOS\moliendaCafe"
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo exponiéndolo a la red local (para conectar tu móvil):
   ```bash
   npm run dev -- --host
   ```

4. Vite mostrará las URLs de acceso:
   ```text
   VITE v6.1.0  ready in 280 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.XX:5173/
   ```

---

## 📱 Instalación en iPhone / iOS Safari (PWA)

Para usar Grind Tracker como una App nativa a pantalla completa:

1. Conecta tu iPhone y tu ordenador a la **misma red Wi-Fi**.
2. En Safari en tu iPhone, accede a la URL que indica Vite en `Network` (ej. `http://192.168.1.45:5173`).
3. Toca el botón **Compartir** en la barra inferior de Safari (icono de cuadrado con flecha hacia arriba).
4. Desplázate hacia abajo y selecciona **"Añadir a la pantalla de inicio"** (*Add to Home Screen*).
5. Confirma el nombre **Grind Tracker** y pulsa **Añadir**.
6. Se creará el icono en tu pantalla de inicio con soporte de Safe Area, offline caching y arranque independiente sin marcos de navegación.

---

## ☁️ Configuración de Google Workspace

Para conectar tu propia base de datos en Google Sheets y Google Drive:

### Paso 1: Crear la Carpeta Privada en Google Drive
1. Ve a [Google Drive](https://drive.google.com).
2. Crea una nueva carpeta, por ejemplo: `GrindTracker_Vault`.
3. Entra en la carpeta y revisa la URL en tu navegador:
   ```text
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
   ```
4. Copia el identificador final (`1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`). Este es tu **`DRIVE_FOLDER_ID`**.

### Paso 2: Crear la Hoja Global de Autenticación
1. En Google Drive, crea una nueva **Hoja de cálculo de Google** llamada `GrindTracker_Auth`.
2. Las cabeceras se auto-inicializan al primer uso, o puedes crearlas manualmente en la fila 1:
   - `username` | `password` | `user_sheet_id` | `session_token` | `session_expiry` | `created_at`
3. Copia el ID de la hoja desde la URL (entre `/d/` y `/edit`):
   ```text
   https://docs.google.com/spreadsheets/d/1XyZ987654321_AbCdEfGhIjKlMnOpQr/edit
   ```
   Este es tu **`AUTH_SHEET_ID`**.

### Paso 3: Desplegar el Backend `Code.gs`
1. Ve a [Google Apps Script](https://script.google.com/home) y pulsa **Nuevo proyecto**.
2. Nómbralo **Grind Tracker API**.
3. Borra el código predeterminado y copia íntegramente el contenido del archivo [`Code.gs`](./Code.gs) de este repositorio.
4. Guarda el proyecto (Ctrl+S / 💾).
5. Haz clic en **Implementar > Nueva implementación** (o *Deploy > New deployment*).
6. En el engranaje ⚙️, selecciona **Aplicación web**.
7. Configura exactamente:
   - **Descripción**: `v2 Grind Tracker Production`
   - **Ejecutar como**: **Yo (tu cuenta de Google)**
   - **Quién tiene acceso**: **Cualquier persona** *(necesario para permitir llamadas desde el cliente móvil PWA)*.
8. Pulsa **Implementar**, autoriza los permisos requeridos y copia la **URL de la aplicación web** terminada en `/exec`. Este es tu **`SCRIPT_URL`**.

### Paso 4: Configurar Variables de Entorno (`.env`)
En la raíz del proyecto, crea o edita tu archivo `.env`:

```env
VITE_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
VITE_AUTH_SHEET_ID=1XyZ987654321_AbCdEfGhIjKlMnOpQr
VITE_DRIVE_FOLDER_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

---

## ☕ Módulos de la Aplicación

### 1. Módulo "Mis Molinos"
Permite configurar el parque de molinos del barista:
- **Nombre**: Comandante C40 MK4, Fellow Ode Gen 2, Timemore C2, Eureka Specialita, etc.
- **Tipo Clicks**: Se indica el número máximo de clicks (ej. 40). El paso es de 0.5 o 1 click.
- **Tipo Dial**: Se indican los números principales de la ruleta (ej. 11 números) y los pasos entre cada número (ej. 3 o 4 pasos entre el 1 y el 2). La app calcula las divisiones exactas.

### 2. Módulo de Moliendas
- **Dropdown dinámico de molinos**: Carga exclusivamente los molinos dados de alta por el usuario.
- **Slider Progresivo Adaptativo**: Si eliges un molino por Clicks, el slider se mueve entre 0 y el total de clicks. Si eliges un molino por Dial, se mueve entre 1 y el total de números con pasos fraccionarios precisos.
- **Campos de Especialidad**:
  - Nombre del grano y Tostadero.
  - Método: Espresso, Mokka, Filtro, Aeropress, Prensa Francesa, Cold Brew.
  - Variedad: Arábica, Robusta, Libérica, Excelsa.
  - Proceso: Natural, Lavado, Honey, Anaeróbico, Maceración Carbónica, Koji.
  - País de origen con chips de selección rápida.
  - Perfil de sabor con sugerencias táctiles (Floral, Frutal, Cítrico, Chocolate, etc.).
  - Temperatura del agua (°C).

### 3. Parámetros Espresso (Ratio IN/OUT)
Si se selecciona el método **Espresso**, se despliegan automáticamente los campos obligatorios:
- **Café IN**: Gramos de café molido en portafiltro (ej. `18.0g`).
- **Café OUT**: Gramos de espresso líquido extraído (ej. `36.0g`).
- La aplicación calcula y muestra al instante el ratio de extracción (ej. `Ratio 1:2.0`).

---

## 🧪 Modo Demo Local

Si aún no has desplegado tu Google Apps Script o quieres probar la interfaz sin configurar credenciales:
1. Inicia la app (`npm run dev -- --host`).
2. En la pantalla de inicio de sesión, pulsa en **"Autocompletar usuario Demo (barista / 123)"**.
3. La aplicación utilizará un backend simulado completo en `localStorage` con molinos preconfigurados (Comandante C40 y Fellow Ode Gen 2), recetas de ejemplo y simulación de Session Tokens UUID.
