# EduXP — Plataforma de Cursos Abiertos en Markdown

Plataforma educativa moderna y libre para aprender desarrollo de software (React, Node.js, Express, TypeScript y más). Construida con HTML5, CSS3 y JavaScript Vanilla puro, sin frameworks ni herramientas de compilación pesadas, diseñada para ejecutarse de forma nativa en GitHub Pages y consumir contenido desacoplado desde un repositorio de GitHub.

![Stack Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20HTML5%20%7C%20CSS3-00f5a0?style=for-the-badge)
![GitHub Pages Ready](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-38bdf8?style=for-the-badge)
![Zero Dependencies](https://img.shields.io/badge/Build-Zero%20Build-purple?style=for-the-badge)
![Supabase Auth Cloud Sync](https://img.shields.io/badge/Sync-Supabase%20Cloud-green?style=for-the-badge)

---

## Características Principales

* Estética de Alta Gama: Paleta oscura azul pizarra (`#0b1220`) con acentos en verde menta neón (`#00f5a0`) y cyan, efectos glassmorphic y tipografía moderna (*Plus Jakarta Sans* y *JetBrains Mono*).
* Single Page Application (SPA) Vanilla: Enrutador cliente basado en hash (`#/courses`, `#/course/:slug`, `#/library`, etc.) con soporte para enlaces profundos y parámetros dinámicos sin requerir servidor backend.
* Configuración Centralizada (`config.json`): Configuración global desacoplada en la raíz del proyecto para definir repositorios de contenido en GitHub (`Randolh/Content_EduXP`), ramas, CDNs (jsDelivr) y parámetros clave.
* Sincronización en la Nube con Supabase: Registro e inicio de sesión seguro para sincronizar el progreso de aprendizaje (lecciones completadas, XP acumulado) en la nube o guardarlo localmente en el navegador.
* 100% Desacoplado: El contenido de los cursos se gestiona de forma remota mediante archivos Markdown (`.md`) e índices JSON alojados en un repositorio público independiente.
* Visor de Lecciones Enriquecido:
  * Renderizador de Markdown con soporte para Callouts de GitHub (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!CAUTION]`).
  * Resaltado de sintaxis con Prism.js (JavaScript, JSX, Bash, JSON, CSS, HTML, TypeScript).
  * Botón interactivo para copiar bloques de código con un clic.
  * Barra lateral interactiva con temario navegable y barra de progreso de lecciones.
* Buscador y Filtros en Tiempo Real: Filtrado instantáneo por categoría (Frontend, Backend, APIs) y búsqueda reactiva por palabras clave.

---

## Estructura del Proyecto

```text
EduXP/
├── index.html                        # Punto de entrada principal HTML5
├── config.json                       # Configuración global del proyecto y repositorio de contenido
├── README.md                         # Documentación general del repositorio
├── .gitignore                        # Archivos e historial excluidos de Git
├── css/
│   ├── main.css                      # Archivo principal de importación de estilos
│   ├── core/                         # Variables CSS, reset y layout base
│   ├── components/                   # Botones, tarjetas, modales, toasts, quizzes y badges
│   └── views/                        # Estilos específicos de las vistas (hero, visor, catálogo)
├── js/
│   ├── app.js                        # Inicializador principal de la app y controladores globales
│   ├── config.js                     # Carga y gestión de config.json
│   ├── router.js                     # Enrutador SPA basado en Hash
│   ├── store.js                      # Estado global de progreso y almacenamiento local
│   ├── api.js                        # Cliente HTTP con caché para contenidos en Markdown/JSON
│   ├── services/
│   │   └── supabase.js               # Autenticación de usuarios y sincronización con Supabase Cloud
│   ├── views/
│   │   ├── homeView.js               # Portada con métricas y cursos destacados
│   │   ├── catalogView.js            # Catálogo general con buscador y filtros
│   │   ├── courseDetailView.js       # Temario detallado y resumen del curso
│   │   ├── lessonView.js             # Visor interactivo de lecciones en Markdown
│   │   └── libraryView.js            # Biblioteca personal con cursos inscritos y progreso
│   ├── components/                   # Componentes nativos DOM (AuthModal, CourseCard, Toast, etc.)
│   └── utils/
│       ├── dom.js                    # Helper de creación nativa de elementos DOM
│       └── markdown.js               # Parser con Marked.js y Prism.js
└── docs/
    ├── CURSO_SPEC.md                 # Especificación técnica para la estructura de cursos
    ├── GUIA_CREACION_CURSOS.md       # Guía práctica para creadores de cursos
    └── GITHUB_PAGES_Y_REPO_SETUP.md  # Configuración de repositorios de contenido y GH Pages
```

Nota: La carpeta local `content/` y los scripts de servidor local de pruebas (`serve.py`) están excluidos en el archivo `.gitignore` ya que el contenido se sirve directamente desde el repositorio remoto de contenidos.

---

## Configuración (`config.json`)

Toda la configuración principal de la plataforma se administra desde el archivo `config.json` en la raíz del proyecto:

```json
{
  "appName": "EduXP",
  "sourceType": "github",
  "github": {
    "owner": "Randolh",
    "repo": "Content_EduXP",
    "branch": "main",
    "useCdn": true
  },
  "localBasePath": "./content"
}
```

* `sourceType`: Define si el contenido se carga desde un repositorio remoto de GitHub (`"github"`) o desde una carpeta local (`"local"`).
* `github`: Especifica el propietario (`owner`), nombre del repositorio (`repo`), rama (`branch`) y si utiliza CDN jsDelivr (`useCdn`) para máximo rendimiento.

---

## Inicio Rápido (Servidor Local)

Dado que utiliza módulos nativos de JavaScript (`type="module"`), requiere ejecutarse a través de un servidor HTTP local para evitar restricciones de seguridad CORS del navegador.

Puedes usar cualquiera de los siguientes métodos en tu terminal:

### Con Python:
```bash
python3 -m http.server 8000
```
Luego abre en tu navegador: http://localhost:8000

### Con Node.js (npx serve):
```bash
npx serve .
```

---

## Despliegue en GitHub Pages

1. Sube este repositorio a tu cuenta de GitHub.
2. Ve a Settings > Pages en tu repositorio.
3. En Build and deployment, selecciona la rama `main` y la carpeta `/ (root)`.
4. El sitio estará publicado en minutos sin requerir pasos de compilación.

---

## Documentación Adicional

* Guía para la Creación de Cursos (`docs/GUIA_CREACION_CURSOS.md`): Instrucciones paso a paso para estructurar nuevos cursos y lecciones.
* Especificación del Formato de Cursos (`docs/CURSO_SPEC.md`): Esquemas formales de `courses.json` y `course.json`.
* Despliegue y Repositorio de Contenidos (`docs/GITHUB_PAGES_Y_REPO_SETUP.md`): Detalles sobre la arquitectura desacoplada de repositorios.
