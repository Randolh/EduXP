# Lección 2: Sistema de Módulos (ESM vs CJS) y NPM

Para construir aplicaciones de backend ordenadas y mantenibles, es fundamental estructurar el código en módulos independientes. En esta lección compararemos **CommonJS** y **ES Modules (ESM)**, y aprenderemos a gestionar dependencias con **npm**.

---

## 1. CommonJS (CJS) vs ECMAScript Modules (ESM)

Históricamente, Node.js utilizaba CommonJS con `require()` y `module.exports`. Sin embargo, el estándar moderno de JavaScript (ESM) utiliza `import` y `export`.

### Comparativa lado a lado:

#### Estilo CommonJS (Clásico):
```javascript
// matematicas.cjs
function sumar(a, b) {
  return a + b;
}
module.exports = { sumar };

// app.cjs
const { sumar } = require('./matematicas.cjs');
console.log(sumar(5, 3));
```

#### Estilo ES Modules (Moderno y Recomendado):
```javascript
// matematicas.mjs o con "type": "module" en package.json
export function sumar(a, b) {
  return a + b;
}

// app.mjs
import { sumar } from './matematicas.mjs';
console.log(sumar(5, 3));
```

> [!NOTE]
> Para habilitar la sintaxis moderna `import / export` en todo tu proyecto de Node.js, simplemente agrega `"type": "module"` en tu archivo `package.json`.

---

## 2. Inicialización de Proyectos con NPM

NPM (*Node Package Manager*) es el gestor de dependencias más grande del mundo del desarrollo de software.

```bash
# Crear un nuevo archivo package.json interactivo
npm init -y

# Instalar una dependencia de producción
npm install dotenv

# Instalar una dependencia solo para desarrollo
npm install --save-dev nodemon
```

---

## 3. Scripts Personalizados en `package.json`

Puedes definir comandos de ejecución rápida en la sección `"scripts"`:

```json
{
  "name": "mi-backend-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "node --test"
  },
  "dependencies": {
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

> [!TIP]
> Nunca subas la carpeta `node_modules` a tu repositorio de GitHub. Asegúrate de incluirla en tu archivo `.gitignore`.
