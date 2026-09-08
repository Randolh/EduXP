# Especificación Técnica de Cursos (EduXP Spec v1.0)

Este documento define la arquitectura y el estándar que debe cumplir cualquier repositorio de cursos para ser compatible y consumido de forma automática por la plataforma **EduXP**.

---

## 1. Estructura General del Repositorio de Contenido

Un repositorio de contenido para EduXP debe organizarse de la siguiente manera:

```text
mi-repositorio-cursos/
├── courses.json                          <-- Registro maestro de todos los cursos
└── courses/
    ├── <slug-del-curso-1>/
    │   ├── course.json                   <-- Manifiesto del curso y temario
    │   └── lessons/
    │       ├── 01-introduccion.md        <-- Lecciones en Markdown
    │       ├── 02-segundo-tema.md
    │       └── 03-tercer-tema.md
    └── <slug-del-curso-2>/
        ├── course.json
        └── lessons/
            ├── 01-primer-tema.md
            └── 02-segundo-tema.md
```

> [!NOTE]
> Los nombres de carpetas (`slug`) deben ser en minúsculas y separados por guiones (kebab-case), sin espacios ni caracteres especiales.

---

## 2. Especificación del Catálogo Maestro (`courses.json`)

El archivo raíz `courses.json` contiene la lista de cursos que se mostrarán en la portada y el catálogo.

### Esquema JSON:

```json
{
  "version": "1.0.0",
  "updatedAt": "2026-09-08",
  "courses": [
    {
      "id": "react-esencial",
      "slug": "react-esencial",
      "title": "React Esencial: De Cero a Componentes",
      "description": "Descripción concisa de 2-3 líneas para la tarjeta.",
      "category": "frontend",
      "level": "Principiante",
      "duration": "4 Horas",
      "icon": "fa-brands fa-react",
      "badgeColor": "cyan",
      "totalLessons": 3,
      "tags": ["React", "JavaScript", "JSX"]
    }
  ]
}
```

### Descripción de campos de `courses.json`:

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id` / `slug` | String | Sí | Identificador único en kebab-case. Debe coincidir con el nombre de la carpeta dentro de `courses/`. |
| `title` | String | Sí | Título visible del curso. |
| `description`| String | Sí | Resumen del curso para tarjetas y vista previa. |
| `category` | String | Sí | Categoría (`frontend`, `backend`, `api`, `tools`, etc.). |
| `level` | String | Sí | Nivel de dificultad (`Principiante`, `Intermedio`, `Avanzado`). |
| `duration` | String | Sí | Tiempo estimado de estudio (ej. `3 Horas`, `5 Semanas`). |
| `icon` | String | Sí | Clase de icono de Font Awesome 6 (ej. `fa-brands fa-react`, `fa-brands fa-node-js`, `fa-solid fa-server`). |
| `badgeColor` | String | No | Color temático para badges (`mint`, `cyan`, `purple`, `orange`). |
| `totalLessons`| Number | Sí | Cantidad total de lecciones para el cálculo de porcentaje. |
| `tags` | Array | No | Etiquetas clave para el buscador en tiempo real. |

---

## 3. Especificación del Manifiesto del Curso (`course.json`)

Cada curso debe tener su propio `course.json` dentro de `courses/<slug>/course.json`.

### Esquema JSON:

```json
{
  "id": "react-esencial",
  "slug": "react-esencial",
  "title": "React Esencial: De Cero a Componentes",
  "description": "Descripción completa y detallada de los objetivos del curso.",
  "category": "frontend",
  "level": "Principiante",
  "duration": "4 Horas",
  "icon": "fa-brands fa-react",
  "badgeColor": "cyan",
  "author": "Nombre del Instructor o Comunidad",
  "modules": [
    {
      "id": "modulo-1",
      "title": "Fundamentos y Primeros Pasos",
      "lessons": [
        {
          "id": "01-bienvenida-react",
          "title": "1. ¿Qué es React y por qué usarlo?",
          "file": "lessons/01-bienvenida-react.md",
          "duration": "10 min",
          "xp": 50
        }
      ]
    }
  ]
}
```

### Campos de las Lecciones (`lessons`):

* `id`: Identificador único de la lección (usado en la URL hash `#/course/:slug/lesson/:id`).
* `title`: Título de la lección mostrado en el temario y en la barra superior.
* `file`: Ruta **relativa** al directorio del curso hacia el archivo Markdown (ej. `lessons/01-intro.md`).
* `duration`: Tiempo estimado de lectura/práctica (ej. `15 min`).
* `xp`: Puntos de experiencia otorgados al marcar la lección como completada.

---

## 4. Estándar de Contenido en Markdown (`.md`)

Las lecciones admiten sintaxis de **GitHub Flavored Markdown (GFM)** enriquecida con:

### Bloques de Código con Resaltado de Sintaxis
EduXP incluye resaltador Prism.js y añade automáticamente un botón de "Copiar código" en cada bloque:

````markdown
```javascript
function saludar(nombre) {
  console.log(`Hola, ${nombre}!`);
}
```
````

Lenguajes con soporte nativo completo: `javascript`, `jsx`, `html`, `css`, `bash`, `json`, `markdown`.

### Callouts y Alertas de Énfasis

Puedes insertar alertas visuales utilizando el estándar moderno de GitHub:

```markdown
> [!NOTE]
> Texto de una nota explicativa o aclaración importante.

> [!TIP]
> Consejos profesionales, trucos o buenas prácticas recomendadas.

> [!WARNING]
> Advertencias sobre errores comunes, breaking changes o problemas de seguridad.
```
