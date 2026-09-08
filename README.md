# ⚡ EduXP — Plataforma de Cursos Abiertos en Markdown

Plataforma educativa moderna, rápida y 100% libre para aprender desarrollo web (React, Node.js, Express y más). Construida con **HTML5, CSS3 y JavaScript Vanilla puro**, sin frameworks ni herramientas de compilación pesadas, diseñada para ejecutarse de forma nativa en **GitHub Pages** y consumir contenido desacoplado desde cualquier repositorio de GitHub.

![EduXP Preview](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20HTML5%20%7C%20CSS3-00f5a0?style=for-the-badge)
![GitHub Pages Compatible](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-38bdf8?style=for-the-badge)
![Zero Dependencies](https://img.shields.io/badge/Build-Zero%20Build-purple?style=for-the-badge)

---

## 🎨 Características Principales

* **Estética de Alta Gama**: Paleta oscura azul pizarra (`#0b1220`) con acentos en **verde menta neón** (`#00f5a0`) y cyan, glassmorphism sutil y tipografía moderna (*Plus Jakarta Sans* y *JetBrains Mono*).
* **Single Page Application (SPA) Vanilla**: Enrutador cliente basado en hash (`#/courses`, `#/course/:id`, etc.) con soporte para enlaces profundos, historial de navegación y parámetros dinámicos sin requerir servidor backend.
* **100% Desacoplado**: El contenido de los cursos se gestiona mediante archivos Markdown (`.md`) alojados en un repositorio independiente de GitHub o en local.
* **Visor de Lecciones Enriquecido**:
  * Renderizador de Markdown con soporte para **Callouts de GitHub** (`[!NOTE]`, `[!TIP]`, `[!WARNING]`).
  * Resaltado de sintaxis con **Prism.js** (JS, JSX, Bash, JSON, CSS, HTML).
  * Botón interactivo para **copiar bloques de código** con un clic.
  * Barra lateral colapsable con el temario y navegación secuencial (*Lección anterior / siguiente*).
* **Gestión de Progreso en LocalStorage**: Registra las lecciones completadas, porcentaje de avance y recuerda la última lección vista.
* **Buscador y Filtros en Tiempo Real**: Filtrado instantáneo por categoría (Frontend, Backend, APIs) y búsqueda reactiva por palabras clave.

---

## 📁 Estructura del Proyecto

```text
EduXP/
├── index.html                        # Punto de entrada HTML5
├── README.md                         # Documentación general
├── css/
│   ├── main.css                      # Sistema de diseño, tokens y estilos base
│   ├── components.css                # Botones, cards, hero, catálogo y formularios
│   └── viewer.css                    # Layout del visor, sidebar y markdown
├── js/
│   ├── app.js                        # Inicializador principal y eventos globales
│   ├── config.js                     # Gestión de fuentes (Local vs GitHub Remoto)
│   ├── router.js                     # Enrutador cliente SPA con hash
│   ├── store.js                      # Manejo de progreso y LocalStorage
│   ├── api.js                        # Cliente de fetch con caché
│   ├── views/
│   │   ├── homeView.js               # Portada con métricas y cursos recomendados
│   │   ├── catalogView.js            # Catálogo con buscador y filtros
│   │   ├── courseDetailView.js       # Temario y ficha técnica del curso
│   │   ├── lessonView.js             # Visor de lecciones y temario lateral
│   │   └── settingsView.js           # Configuración de repositorios GitHub
│   └── utils/
│       └── markdown.js               # Parser con Marked.js y Prism.js
├── content/                          # Repositorio base con cursos de ejemplo
│   ├── courses.json                  # Catálogo maestro de cursos
│   └── courses/
│       ├── react-esencial/           # Curso de React con lecciones .md
│       ├── nodejs-backend/           # Curso de Node.js con lecciones .md
│       └── express-api-rest/         # Curso de Express con lecciones .md
└── docs/
    ├── CURSO_SPEC.md                 # Especificación técnica para crear cursos
    └── GITHUB_PAGES_Y_REPO_SETUP.md  # Despliegue en GitHub Pages y conexión de repos
```

---

## 🚀 Inicio Rápido (Local)

Dado que es JavaScript Vanilla puro con módulos ES (`type="module"`), requiere servirse a través de un servidor HTTP local para evitar restricciones de seguridad del navegador (`CORS` con protocolo `file://`).

Puedes usar cualquiera de estos métodos en tu terminal:

### Con Python:
```bash
python3 -m http.server 8000
```
Luego abre en tu navegador: [http://localhost:8000](http://localhost:8000)

### Con Node.js (npx serve):
```bash
npx serve .
```

---

## 🌐 Despliegue en GitHub Pages

1. Sube este repositorio a tu cuenta de GitHub.
2. Ve a **Settings > Pages**.
3. En **Build and deployment**, selecciona la rama `main` y la carpeta `/ (root)`.
4. ¡Listo! El sitio estará disponible en minutos sin necesidad de pasos de compilación (*build pipelines*).

---

## 📚 Documentación Técnica Adicional

* 📖 [Especificación de Formato de Cursos (CURSO_SPEC.md)](docs/CURSO_SPEC.md): Guía de esquemas JSON y estructura de lecciones Markdown.
* 🚀 [Despliegue y Repositorio Separado (GITHUB_PAGES_Y_REPO_SETUP.md)](docs/GITHUB_PAGES_Y_REPO_SETUP.md): Cómo crear un repositorio independiente en GitHub para tus cursos y enlazarlo con jsDelivr.
