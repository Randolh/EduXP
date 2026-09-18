# Lección 2: Parámetros de Ruta y el Patrón Middleware

El núcleo fundamental de Express se basa en una cadena de funciones llamadas **Middlewares**. En esta lección aprenderás a interceptar peticiones, extraer parámetros de la URL y autenticar accesos.

---

## 1. Parámetros de Ruta Dinámicos (`req.params`)

Para capturar segmentos dinámicos de una URL (como el identificador único de un curso o un usuario), utilizamos dos puntos `:nombreParametro`:

```javascript
app.get('/api/cursos/:slug', (req, res) => {
  const { slug } = req.params;
  
  const cursoEncontrado = cursos.find(c => c.slug === slug);

  if (!cursoEncontrado) {
    return res.status(404).json({ error: "Curso no encontrado" });
  }

  res.json(cursoEncontrado);
});
```

---

## 2. ¿Qué es un Middleware?

Un **Middleware** es una función que tiene acceso al objeto de petición (`req`), al objeto de respuesta (`res`) y a la siguiente función en el ciclo de solicitud-respuesta (`next`).

```mermaid
graph LR
  Peticion[Petición del Cliente] --> M1[Middleware 1: Logger]
  M1 --> M2[Middleware 2: Autenticación]
  M2 --> Controlador[Ruta / Controlador Final]
  Controlador --> Respuesta[Respuesta JSON]
```

### Ejemplo: Logger de peticiones personalizadas

```javascript
// Middleware personalizado
const loggerMiddleware = (req, res, next) => {
  const fecha = new Date().toISOString();
  console.log(`[${fecha}] ${req.method} ${req.url}`);
  
  // ¡Crucial! Llamar a next() para pasar el control al siguiente middleware
  next();
};

// Aplicar globalmente a todas las rutas
app.use(loggerMiddleware);
```

---

## 3. Middlewares de Autenticación y Protección

Podemos aplicar middlewares solo a rutas específicas que requieran seguridad:

```javascript
function verificarApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== 'secreto-eduxp-123') {
    return res.status(401).json({ error: "No autorizado: API Key inválida o ausente" });
  }

  next();
}

// Ruta protegida
app.delete('/api/cursos/:id', verificarApiKey, (req, res) => {
  res.json({ mensaje: `Curso ${req.params.id} eliminado con éxito` });
});
```

> [!TIP]
> Los middlewares se ejecutan en estricto orden secuencial. Si olvidas invocar la función `next()`, la petición del cliente quedará suspendida en espera indefinida.

---

## 🎯 Autoevaluación Interactiva

> [!QUIZ]
> ¿Qué sucede si un middleware en Express no envía una respuesta (como res.json) ni invoca la función next()?
> - [ ] Express lanza automáticamente un error 500
> - [ ] La petición pasa inmediatamente a la siguiente ruta
> - [x] La petición queda colgada indefinidamente esperando hasta que ocurra un timeout
> - [ ] Node.js se cierra de forma inesperada
>
> **Explicación**: El ciclo de vida de Express depende de que un middleware o bien finalice el ciclo enviando una respuesta (`res.send`, `res.json`), o bien llame a `next()` para ceder el control al siguiente eslabón de la cadena. Si no hace ninguna de las dos, la petición nunca termina.

---

## 🛠️ Ejercicio Práctico: Middleware de Validación de Campos

**Objetivo**: Crear un middleware reutilizable `validarCursoBody` que verifique que el cuerpo de la petición contenga `titulo` y `categoria`.

**Instrucciones**:
1. Escribe la función middleware `validarCursoBody(req, res, next)`.
2. Si `!req.body.titulo` o `!req.body.categoria`, responde inmediatamente con código `400 Bad Request` y un mensaje de error claro en JSON.
3. Si los campos están presentes y no están vacíos, llama a `next()` para permitir que la ruta continúe.
4. Conecta el middleware a la ruta `app.post('/api/cursos', validarCursoBody, ...)`.

<details class="exercise-solution">
<summary>💡 Ver solución explicada paso a paso</summary>

<div class="solution-content">

```javascript
function validarCursoBody(req, res, next) {
  const { titulo, categoria } = req.body;

  if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
    return res.status(400).json({ error: "El campo 'titulo' es obligatorio y debe ser texto." });
  }

  if (!categoria || typeof categoria !== 'string' || categoria.trim() === '') {
    return res.status(400).json({ error: "El campo 'categoria' es obligatorio y debe ser texto." });
  }

  // Todo correcto: pasar al controlador
  next();
}

// Aplicar en la ruta POST
app.post('/api/cursos', validarCursoBody, (req, res) => {
  const nuevo = { id: Date.now(), ...req.body };
  res.status(201).json({ mensaje: "Curso válido creado", data: nuevo });
});
```

**Explicación**:
- Validar las entradas antes de llegar a la lógica de negocio previene datos corruptos y errores no controlados.
- Al hacer `return res.status(400)...` evitamos que se ejecute código posterior en caso de datos inválidos.
</div>
</details>
