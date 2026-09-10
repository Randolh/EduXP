# 📘 Guía Definitiva para Crear Cursos y Lecciones en EduXP

Bienvenido a la guía de creación y autoría de contenido para **EduXP**. Esta guía está diseñada para que cualquier desarrollador o instructor pueda crear, estructurar y publicar un curso completo con lecciones interactivas en Markdown sin necesidad de tocar el código de la plataforma.

---

## 📑 Tabla de Contenidos
1. [Estructura General de Carpetas](#1-estructura-general-de-carpetas)
2. [Paso 1: Registrar el Curso en `courses.json`](#2-paso-1-registrar-el-curso-en-coursesjson)
3. [Paso 2: Crear el Manifiesto `course.json`](#3-paso-2-crear-el-manifiesto-coursejson)
4. [Paso 3: Redactar las Lecciones en Markdown (`.md`)](#4-paso-3-redactar-las-lecciones-en-markdown-md)
5. [Elementos Especiales y Enriquecimiento de Lecciones](#5-elementos-especiales-y-enriquecimiento-de-lecciones)
6. [Plantillas Listas para Copiar y Pegar](#6-plantillas-listas-para-copiar-y-pegar)
7. [Lista de Verificación (Checklist) antes de Publicar](#7-lista-de-verificación-checklist-antes-de-publicar)

---

## 1. Estructura General de Carpetas

Todo curso en EduXP vive de forma modular e independiente dentro de la carpeta `courses/`. La jerarquía estricta debe ser la siguiente:

```text
content/ (o la raíz de tu repositorio de cursos)
│
├── courses.json                     <-- Catálogo maestro de todos los cursos
│
└── courses/
    └── <slug-del-curso>/             <-- Carpeta con el identificador único del curso
        ├── course.json               <-- Manifiesto del curso (módulos y lecciones)
        └── lessons/                  <-- Carpeta con todos los archivos Markdown
            ├── 01-primer-tema.md
            ├── 02-segundo-tema.md
            ├── 03-tercer-tema.md
            └── ...
```

### Reglas de Nomenclatura
- **`<slug-del-curso>`**: Debe ser en minúsculas, palabras separadas por guiones cortos (`kebab-case`). Ejemplos: `react-esencial`, `python-backend`, `docker-devops`.
- **Archivos de lección**: Prefijar siempre con numeración de dos dígitos (`01-`, `02-`, etc.) para mantener un orden secuencial claro en el sistema de archivos.

---

## 2. Paso 1: Registrar el Curso en `courses.json`

El archivo `courses.json` es el índice maestro que alimenta la portada (`#/`) y el catálogo de búsqueda (`#/courses`).

Abre `courses.json` y agrega un nuevo objeto dentro del arreglo `"courses"`:

```json
{
  "id": "docker-esencial",
  "slug": "docker-esencial",
  "title": "Docker y Contenedores desde Cero",
  "description": "Aprende a empaquetar, distribuir y desplegar aplicaciones modernas con Docker, Dockerfile y Docker Compose de forma práctica.",
  "category": "backend",
  "level": "Principiante",
  "duration": "3.5 Horas",
  "icon": "fa-brands fa-docker",
  "badgeColor": "cyan",
  "totalLessons": 4,
  "tags": ["Docker", "Contenedores", "DevOps", "Backend", "Linux"]
}
```

### Referencia de Campos:
| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :---: | :--- |
| `id` / `slug` | String | **Sí** | Identificador único en kebab-case. Debe ser idéntico al nombre de la carpeta en `courses/<slug>`. |
| `title` | String | **Sí** | Título principal mostrado en las tarjetas del catálogo. |
| `description` | String | **Sí** | Resumen conciso (máximo 3 líneas) explicando el objetivo del curso. |
| `category` | String | **Sí** | Una de las siguientes categorías del filtro: `frontend`, `backend`, `api`, `tools`. |
| `level` | String | **Sí** | Nivel sugerido: `Principiante`, `Intermedio`, `Avanzado`, o `Todos los niveles`. |
| `duration` | String | **Sí** | Tiempo estimado total de estudio (ej. `4 Horas`, `6 Semanas`). |
| `icon` | String | **Sí** | Clase de Font Awesome 6. Ejemplos: `fa-brands fa-react`, `fa-brands fa-node-js`, `fa-brands fa-docker`, `fa-solid fa-database`, `fa-solid fa-server`. |
| `badgeColor` | String | No | Color temático para badges: `mint` (verde), `cyan` (azul claro), `purple` (morado), `orange` (naranja). |
| `totalLessons`| Number | **Sí** | Cantidad total de lecciones. Se usa para calcular la barra de progreso. |
| `tags` | Array | No | Palabras clave que los estudiantes pueden escribir en la barra de búsqueda. |

---

## 3. Paso 2: Crear el Manifiesto `course.json`

Crea el archivo `courses/<slug-del-curso>/course.json`. Este archivo define la estructura pedagógica, los módulos y las lecciones ordenadas:

```json
{
  "id": "docker-esencial",
  "slug": "docker-esencial",
  "title": "Docker y Contenedores desde Cero",
  "description": "Guía completa para dominar la virtualización ligera, crear imágenes optimizadas y orquestar múltiples servicios.",
  "category": "backend",
  "level": "Principiante",
  "duration": "3.5 Horas",
  "icon": "fa-brands fa-docker",
  "badgeColor": "cyan",
  "author": "Comunidad Abierta",
  "modules": [
    {
      "id": "mod-1",
      "title": "Conceptos Fundamentales",
      "lessons": [
        {
          "id": "01-que-es-un-contenedor",
          "title": "1. ¿Qué es un contenedor y en qué se diferencia de una VM?",
          "file": "lessons/01-que-es-un-contenedor.md",
          "duration": "12 min",
          "xp": 50
        },
        {
          "id": "02-comandos-esenciales-docker",
          "title": "2. Primeros comandos: docker run, ps e images",
          "file": "lessons/02-comandos-esenciales-docker.md",
          "duration": "15 min",
          "xp": 75
        }
      ]
    },
    {
      "id": "mod-2",
      "title": "Construcción de Imágenes",
      "lessons": [
        {
          "id": "03-creando-tu-primer-dockerfile",
          "title": "3. Anatomía de un Dockerfile profesional",
          "file": "lessons/03-creando-tu-primer-dockerfile.md",
          "duration": "20 min",
          "xp": 100
        }
      ]
    }
  ]
}
```

### Campos de cada Lección (`lessons`):
* `id`: Identificador único (alfanumérico y guiones). Este ID forma parte de la URL amigable: `#/course/<slug>/lesson/<id>`.
* `title`: Título legible de la lección para el temario y breadcrumbs.
* `file`: Ruta relativa desde la carpeta del curso hacia el archivo `.md`. Por convención: `lessons/<nombre-archivo>.md`.
* `duration`: Tiempo estimado de lectura/práctica (ej. `15 min`).
* `xp`: Puntos de experiencia que gana el estudiante al marcar la lección como completada (ej. `50`, `100`).

---

## 4. Paso 3: Redactar las Lecciones en Markdown (`.md`)

Cada lección debe ser un archivo `.md` enfocado, práctico y estructurado pedagógicamente.

### Estructura Pedagógica Recomendada para una Lección:

1. **Título Principal (`#`)**: Nombre de la lección.
2. **Introducción y Objetivos**: Qué aprenderá el estudiante y por qué es relevante.
3. **Desarrollo Teórico Conciso**: Explicaciones claras complementadas con listas y diagramas.
4. **Bloques de Código Explicados**: Código con lenguaje especificado para resaltado de sintaxis.
5. **Callouts de Énfasis**: Notas importantes o advertencias.
6. **Reto / Ejercicio Práctico**: Pequeña tarea para que el estudiante aplique lo aprendido en su máquina.
7. **Cierre y Próximos Pasos**: Breve anticipo del siguiente tema.

---

## 5. Elementos Especiales y Enriquecimiento de Lecciones

EduXP cuenta con soporte integrado para las siguientes características especiales en Markdown:

### A. Bloques de Código con Resaltado y Botón de Copiar
Escribe el código encerrado entre triples tildes graves (\`\`\`) indicando el lenguaje:

````markdown
```javascript
import express from 'express';

const app = express();
app.get('/api/saludo', (req, res) => {
  res.json({ mensaje: "¡Hola desde EduXP!" });
});
```
````

**Lenguajes con resaltado nativo**: `javascript`, `jsx`, `bash`, `html`, `css`, `json`, `markdown`.  
EduXP añade automáticamente:
- Encabezado con el nombre del lenguaje en mayúsculas (`JAVASCRIPT`).
- Botón **"Copiar"** interactivo que copia el código al portapapeles con confirmación visual.
- Numeración de líneas (*line-numbers*).

---

### B. Callouts / Alertas Visuales estilo GitHub
EduXP convierte automáticamente los bloques de cita especiales en paneles estilizados con iconos:

#### 1. Nota Informativa (`[!NOTE]` o `[!INFO]`):
```markdown
> [!NOTE]
> Las props en React son de solo lectura y nunca deben ser mutadas directamente por el componente hijo.
```
*Se renderiza como un panel con borde cyan e icono informativo.*

#### 2. Consejo Profesional (`[!TIP]`):
```markdown
> [!TIP]
> Utiliza `npm install --save-dev` para instalar herramientas que solo necesitas durante el desarrollo, como Nodemon o Prettier.
```
*Se renderiza como un panel verde menta con icono de bombilla.*

#### 3. Advertencia (`[!WARNING]` o `[!CAUTION]`):
```markdown
> [!WARNING]
> Nunca expongas tus claves secretas o tokens de base de datos en el frontend. Utiliza siempre variables de entorno en el backend.
```
*Se renderiza como un panel naranja/rojo con icono de advertencia.*

---

### C. Tablas Informativas
Usa sintaxis Markdown estándar para tablas comparativas:

```markdown
| Comando | Propósito | Ejemplo |
| :--- | :--- | :--- |
| `docker ps` | Listar contenedores activos | `docker ps -a` |
| `docker build` | Construir imagen desde Dockerfile | `docker build -t mi-app .` |
| `docker run` | Ejecutar un nuevo contenedor | `docker run -p 3000:3000 mi-app` |
```

---

### D. Imágenes y Diagramas (Locales y Externas)

EduXP maneja imágenes de dos formas con soporte automático y diseño responsivo adaptado a la estética oscura:

#### 1. Imágenes Externas (URLs absolutas)
Puedes enlazar imágenes alojadas en cualquier CDN o servicio web:
```markdown
![Diagrama del Event Loop](https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800)
```

#### 2. Imágenes Propias del Curso (Rutas Relativas en GitHub o Local)
Puedes almacenar imágenes dentro de la carpeta de tu propio curso (por ejemplo en `courses/<slug>/assets/` o `courses/<slug>/images/`):

```text
courses/
└── react-esencial/
    ├── course.json
    ├── assets/                    <-- Carpeta para diagramas y capturas
    │   └── virtual-dom.png
    └── lessons/
        └── 01-intro.md
```

En tu archivo `.md`, simplemente referénciala con ruta relativa:
```markdown
![Diagrama del Virtual DOM](./assets/virtual-dom.png)
```

> [!TIP]
> **Resolución Automática en GitHub Pages**: No necesitas cambiar las URLs de las imágenes. EduXP reescribe automáticamente `./assets/virtual-dom.png` hacia la fuente configurada (sea en local o mediante la CDN jsDelivr del repositorio público de GitHub).
> 
> Además, todas las imágenes cuentan con:
> - Diseño fluido y responsivo (`max-width: 100%`).
> - Bordes redondeados y sombras sutiles integradas a la paleta oscura.
> - Efecto de resplandor verde menta al pasar el cursor.

---

## 6. Plantillas Listas para Copiar y Pegar

### Plantilla de Lección (`template-leccion.md`)

```markdown
# Lección X: [Título de la Lección]

En esta lección aprenderás [objetivo principal de la sesión].

---

## 1. Concepto Fundamental

[Explicación teórica clara y directa en 2 o 3 párrafos].

> [!NOTE]
> [Puntualización teórica importante o definición clave].

---

## 2. Ejemplo de Código

A continuación se muestra una implementación típica:

```javascript
// Escribe aquí tu código de ejemplo
function ejemploPractico() {
  console.log("Aprender con EduXP es genial!");
}
```

> [!TIP]
> [Consejo profesional sobre cómo optimizar este código o evitar errores comunes].

---

## 3. Reto Práctico

Pon a prueba lo aprendido:
1. Abre tu terminal o editor de código favorito.
2. Crea un archivo llamado `reto.js`.
3. Implementa una función que cumpla los requisitos vistos en esta lección.

---

## Resumen

- [Punto clave 1 aprendido]
- [Punto clave 2 aprendido]

¡Buen trabajo! Haz clic en **"Marcar como lista"** arriba a la derecha y avanza a la siguiente lección.
```

---

## 7. Lista de Verificación (Checklist) antes de Publicar

Antes de subir tu curso o hacer push a tu repositorio de GitHub, verifica:

- [ ] El `id` y `slug` en `courses.json` coinciden exactamente con el nombre de la carpeta en `courses/`.
- [ ] El número `totalLessons` en `courses.json` coincide con la cantidad real de lecciones dentro de `course.json`.
- [ ] Todas las rutas relativas en `"file"` apuntan correctamente a los archivos `.md` existentes (ej. `lessons/01-nombre.md`).
- [ ] Todos los bloques de código tienen especificado su lenguaje (```` ```javascript ````, ```` ```bash ````, etc.).
- [ ] El curso ha sido probado en el servidor local de desarrollo (`python3 serve.py`).
- [ ] Si usas un repositorio externo en GitHub, el repositorio está configurado como **Público**.
