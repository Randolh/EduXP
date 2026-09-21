# Guía de Despliegue en GitHub Pages y Separación de Repositorios

Esta guía te explica cómo tener tu arquitectura 100% desacoplada:
1. **Repositorio 1 (EduXP Web App)**: La Single Page Application alojada en **GitHub Pages**.
2. **Repositorio 2 (EduXP Content)**: El repositorio con las lecciones en Markdown y archivos `.json`.

---

## Parte 1: Despliegue de la SPA en GitHub Pages

Dado que **EduXP** está construida con **JavaScript Vanilla puro, HTML5 y CSS3 sin empaquetadores ni Node.js en producción**, su despliegue es inmediato.

### Paso 1: Subir el código de la SPA a GitHub
1. Inicializa Git en la carpeta del proyecto (si aún no lo has hecho):
   ```bash
   git init
   git add .
   git commit -m "feat: base de la plataforma EduXP"
   ```
2. Crea un repositorio en GitHub (ejemplo: `eduxp-web`) y enlázalo:
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/eduxp-web.git
   git push -u origin main
   ```

### Paso 2: Activar GitHub Pages
1. En GitHub, ve a la pestaña **Settings** de tu repositorio.
2. En la barra lateral izquierda, haz clic en **Pages**.
3. En **Build and deployment**:
   * **Source**: Selecciona `Deploy from a branch`.
   * **Branch**: Selecciona `main` y carpeta `/ (root)`.
   * Haz clic en **Save**.
4. En 1-2 minutos, tu sitio estará activo en:
   `https://TU-USUARIO.github.io/eduxp-web/`

> [!TIP]
> **¿Por qué EduXP funciona a la perfección en GitHub Pages?**
> A diferencia de las SPAs tradicionales que usan `pushState` (HTML5 History API) y dan error 404 al recargar rutas profundas en servidores estáticos como GitHub Pages, EduXP utiliza un enrutador basado en Hash (`#/course/react-esencial`). Puedes recargar o compartir cualquier URL sin configurar trucos de `404.html`.

---

## Parte 2: Crear el Repositorio Separado de Cursos

Para mantener el contenido independiente y permitir que cualquier persona colabore escribiendo Markdown sin tocar el código web:

### Paso 1: Crear un nuevo repositorio público en GitHub
Crea un nuevo repositorio en GitHub llamado, por ejemplo, `eduxp-courses`.

### Paso 2: Copiar la estructura de contenido
Puedes copiar la carpeta `content/` de este proyecto como base para tu nuevo repositorio:
```text
eduxp-courses/
├── courses.json
└── courses/
    ├── react-esencial/
    │   ├── course.json
    │   └── lessons/...
    ├── nodejs-backend/
    │   ├── course.json
    │   └── lessons/...
    └── express-api-rest/
        ├── course.json
        └── lessons/...
```

Sube los archivos a la rama `main` del nuevo repositorio:
```bash
git init
git add .
git commit -m "docs: cursos iniciales en markdown"
git remote add origin https://github.com/TU-USUARIO/eduxp-courses.git
git push -u origin main
```

---

## Parte 3: Conectar la SPA con el Repositorio de Contenido

Tienes dos formas de conectar la aplicación con tu repositorio de cursos:

### Opción A: Desde la interfaz de usuario (Sin tocar código)
1. Abre tu sitio web de EduXP.
2. Haz clic en la opción **Fuentes & Repo** en la barra de navegación superior (o visita `#/settings`).
3. Selecciona la tarjeta **"Repositorio Remoto en GitHub"**.
4. Ingresa:
   * **Usuario u Organización**: `TU-USUARIO`
   * **Nombre del Repositorio**: `eduxp-courses`
   * **Rama**: `main`
   * Marca la casilla: *Usar CDN jsDelivr*.
5. Haz clic en **"Probar Conexión"** para verificar que `courses.json` se lea correctamente.
6. Haz clic en **"Guardar Configuración"**. ¡Listo! A partir de ese momento, la web cargará en vivo todo lo que subas a ese repositorio.

### Opción B: Dejar tu repositorio fijado por defecto en config.json
Si quieres cambiar el repositorio o la configuración global de la aplicación, edita el archivo [`config.json`](file:///home/randolh/Documents/EduXP/config.json) en la raíz del proyecto:

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

También puedes editar las propiedades predeterminadas directamente en [`js/config.js`](file:///home/randolh/Documents/EduXP/js/config.js).

---

## ¿Por qué usar jsDelivr CDN en lugar de raw.githubusercontent.com?

1. **Sin límites de tasa (Rate Limiting)**: La API de GitHub Raw limita peticiones masivas por IP y puede bloquear temporalmente a usuarios si recargan muchas veces. jsDelivr es una red de distribución de contenidos global gratuita con caché ultrarrápida.
2. **Cabeceras CORS Abiertas**: Garantiza que tu navegador pueda descargar el Markdown y los JSON sin errores de seguridad `Cross-Origin Request Blocked`.
3. **Mapeo Instantáneo**: La URL se traduce automáticamente:
   `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/courses.json`
