# Lección 1: El Motor V8 y el Event Loop

Bienvenido a **Node.js Fundamentos**. En esta primera sesión desmitificaremos qué es exactamente Node.js y cómo logra procesar miles de conexiones concurrentes utilizando un solo hilo de ejecución (*single-threaded*).

---

## 1. ¿Qué es Node.js?

Node.js no es un lenguaje de programación ni un framework. Es un **entorno de ejecución (*runtime*) para JavaScript** construido sobre el motor open-source **V8 de Google Chrome**.

Antes de 2009, JavaScript solo podía ejecutarse dentro de los navegadores web. Ryan Dahl tomó el motor V8, lo integró con la biblioteca en C llamada **libuv**, y permitió ejecutar código JS directamente en el sistema operativo del servidor.

```bash
# Comprobar la versión instalada de Node en tu terminal
node -v
# Iniciar la consola interactiva (REPL)
node
```

---

## 2. El Modelo Asíncrono y No Bloqueante

A diferencia de servidores tradicionales basados en hilos como Apache o Tomcat (que crean un hilo por cada petición HTTP), Node.js utiliza un **bucle de eventos no bloqueante (*Event Loop*)**.

```javascript
import fs from 'node:fs';

console.log("1. Inicio del script");

// Lectura de archivo asíncrona (No bloquea el hilo principal)
fs.readFile('datos.txt', 'utf-8', (err, data) => {
  if (err) throw err;
  console.log("3. Contenido leído:", data);
});

console.log("2. Fin del script");

// Salida en terminal:
// 1. Inicio del script
// 2. Fin del script
// 3. Contenido leído: ...
```

> [!NOTE]
> Mientras el sistema operativo lee el archivo del disco en segundo plano mediante `libuv`, el hilo principal de Node continúa ejecutando el resto de tu código sin esperar.

---

## 3. Las Fases del Event Loop

El Event Loop rota de manera continua a través de varias fases clave:

1. **Timers**: Ejecuta callbacks programados por `setTimeout()` y `setInterval()`.
2. **Pending Callbacks**: Ejecuta callbacks de E/S diferidos.
3. **Poll**: Recupera nuevos eventos de red o lectura de archivos.
4. **Check**: Ejecuta callbacks registrados con `setImmediate()`.
5. **Close Callbacks**: Manejo de cierres de sockets (`socket.on('close')`).

> [!TIP]
> Dado que el hilo principal es único, evita operaciones sincrónicas pesadas que tomen segundos de cálculo de CPU (como criptografía sin workers o bucles de millones de iteraciones), ya que congelarás todas las demás peticiones entrantes.
