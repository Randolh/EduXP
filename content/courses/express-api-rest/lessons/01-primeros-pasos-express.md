# Lección 1: Servidor HTTP básico y Respuestas JSON

Express es el framework minimalista y flexible más popular para Node.js. Provee un conjunto robusto de características para construir servidores web y APIs RESTful de alto rendimiento.

---

## 1. Instalación y Configuración Inicial

Para comenzar con Express, instalamos la dependencia en nuestro proyecto Node:

```bash
npm install express
```

Ahora creamos nuestro punto de entrada `server.js`:

```javascript
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para entender cuerpos de peticiones en formato JSON
app.use(express.json());

// Ruta de bienvenida (GET /)
app.get('/', (req, res) => {
  res.json({
    mensaje: "¡Bienvenido a la API REST de EduXP!",
    version: "1.0.0",
    status: "online"
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor activo y escuchando en http://localhost:${PORT}`);
});
```

---

## 2. Métodos HTTP y Semántica REST

Una API REST bien diseñada utiliza los verbos HTTP para definir la intención de cada operación:

| Método | Operación | Ejemplo de Endpoint |
| :--- | :--- | :--- |
| **GET** | Obtener recursos | `GET /api/cursos` |
| **POST** | Crear un nuevo recurso | `POST /api/cursos` |
| **PUT / PATCH** | Actualizar un recurso | `PATCH /api/cursos/react-101` |
| **DELETE** | Eliminar un recurso | `DELETE /api/cursos/react-101` |

```javascript
const cursos = [
  { id: 1, titulo: 'React Esencial', categoria: 'frontend' },
  { id: 2, titulo: 'Node.js Backend', categoria: 'backend' }
];

// Listar todos los cursos
app.get('/api/cursos', (req, res) => {
  res.status(200).json(cursos);
});

// Crear un nuevo curso
app.post('/api/cursos', (req, res) => {
  const nuevoCurso = req.body;
  cursos.push(nuevoCurso);
  res.status(201).json({ mensaje: "Curso creado exitosamente", data: nuevoCurso });
});
```

> [!NOTE]
> Es una buena práctica siempre acompañar las respuestas con el código de estado HTTP adecuado: `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, etc.
