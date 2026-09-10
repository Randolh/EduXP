# Lección 1: ¿Qué es React y por qué usarlo?

¡Bienvenido al curso de **React Esencial**! En esta lección inicial comprenderás las bases conceptuales que convirtieron a React en la biblioteca de interfaz de usuario más demandada de la industria tecnológica.

---

## 1. El Problema del DOM Tradicional

En el desarrollo web clásico con JavaScript Vanilla, cuando los datos de una aplicación cambian, normalmente actualizamos el DOM de manera imperativa:

```javascript
// Manipulación directa e imperativa del DOM
const title = document.getElementById('contador-texto');
const btn = document.getElementById('incrementar-btn');

let count = 0;
btn.addEventListener('click', () => {
  count++;
  title.innerText = `Clics actuales: ${count}`;
});
```

A medida que una aplicación crece y tiene docenas de componentes interactuando entre sí (notificaciones, chats, carritos de compras, perfiles de usuario), rastrear qué parte del DOM debe actualizarse se vuelve una tarea propensa a errores y difícil de mantener.

> [!NOTE]
> React propone un modelo **declarativo**: Tú defines cómo debe verse la interfaz para un estado dado, y React se encarga de sincronizar el navegador de la forma más eficiente posible.

---

## 2. El Virtual DOM (DOM Virtual)

React mantiene una copia ligera en memoria de la estructura del DOM llamada **Virtual DOM**:

1. **Renderizado Inicial**: React genera una representación virtual de la UI.
2. **Cambio de Estado**: Cuando los datos de tu aplicación cambian, React calcula un nuevo Virtual DOM.
3. **Reconciliación (Diffing)**: Compara el árbol nuevo con el anterior para detectar únicamente las diferencias exactas.
4. **Actualización Selectiva**: Modifica en el navegador real solo los nodos específicos que cambiaron.

![Diagrama del Virtual DOM](./assets/virtual-dom.svg)

---

## 3. Principales Ventajas de React

* **Arquitectura Basada en Componentes**: Divide interfaces complejas en piezas reutilizables y aisladas (botones, modales, tarjetas).
* **Flujo de Datos Unidireccional**: Los datos viajan de padres a hijos a través de propiedades (*props*), haciendo el flujo predecible.
* **Gran Ecosistema**: Next.js, Remix, React Native para móviles y miles de librerías en npm.

> [!TIP]
> No pienses en React como un framework rígido, sino como una biblioteca centrada exclusivamente en la capa de vista y presentación.

En la siguiente lección, aprenderemos qué es **JSX** y cómo escribir tu primer componente funcional.
