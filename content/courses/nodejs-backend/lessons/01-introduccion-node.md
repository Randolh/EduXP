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

---

## 🎯 Autoevaluación Interactiva

> [!QUIZ]
> ¿Cuál es el principal motivo por el que Node.js puede manejar miles de conexiones simultáneas con un único hilo de ejecución?
> - [ ] Crea un nuevo hilo de CPU por cada usuario conectado
> - [x] Utiliza operaciones de entrada/salida (I/O) no bloqueantes orquestadas por el Event Loop y libuv
> - [ ] Convierte el código de JavaScript directamente en lenguaje ensamblador
> - [ ] Deshabilita la recolección de basura (Garbage Collector)
>
> **Explicación**: Node.js delega las operaciones pesadas de red y disco a la librería libuv y al sistema operativo; cuando terminan, sus callbacks se despachan en el Event Loop sin congelar el hilo principal.

---

## 🛠️ Ejercicio Práctico: Verificando el Orden del Event Loop

**Objetivo**: Predecir y verificar empíricamente el orden de salida de la pila de microtareas y macrotareas.

**Instrucciones**:
1. Crea un archivo `orden.js`.
2. Escribe el siguiente bloque de código intentando predecir mentalmente el orden de los `console.log`:
   ```javascript
   console.log('1: Inicio sincrónico');
   setTimeout(() => console.log('2: Timeout en fase Timers'), 0);
   Promise.resolve().then(() => console.log('3: Promesa en Microtask Queue'));
   console.log('4: Fin sincrónico');
   ```
3. Ejecuta `node orden.js` en tu terminal y compara tu predicción.

<details class="exercise-solution">
<summary>💡 Ver solución explicada paso a paso</summary>

<div class="solution-content">

**Salida en consola**:
```text
1: Inicio sincrónico
4: Fin sincrónico
3: Promesa en Microtask Queue
2: Timeout en fase Timers
```

**Explicación**:
1. `1` y `4` se imprimen inmediatamente porque son código sincrónico en la pila de ejecución (*Call Stack*).
2. `3` es una microtarea (*Microtask*). Las promesas resueltas tienen prioridad y se vacían inmediatamente después de finalizar el código sincrónico actual, antes de que el Event Loop pase a la siguiente fase de macrotareas.
3. `2` entra en la cola de macrotareas de la fase *Timers*, por lo que se ejecuta al final.
</div>
</details>
