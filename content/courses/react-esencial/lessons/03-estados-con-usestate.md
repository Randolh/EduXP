# Lección 3: Estado Reactivo con useState y Eventos

El verdadero poder de las interfaces interactivas comienza cuando los componentes pueden recordar cosas y reaccionar a las acciones del usuario. En esta lección aprenderás a utilizar el hook fundamental: `useState`.

---

## 1. ¿Por qué una simple variable no basta?

Imagina que intentas actualizar un contador de la siguiente manera:

```jsx
function ContadorErroneo() {
  let contador = 0;

  function incrementar() {
    contador = contador + 1;
    console.log("Nuevo valor:", contador);
  }

  // PROBLEMA: Aunque 'contador' cambie en memoria, React no sabe
  // que debe volver a renderizar la vista.
  return <button onClick={incrementar}>Clics: {contador}</button>;
}
```

Para que un cambio en los datos provoque un re-renderizado automático de la interfaz, el valor debe ser administrado a través del **Estado de React**.

---

## 2. Anatomía del Hook `useState`

`useState` es una función especial que te permite enganchar estado local dentro de un componente funcional:

```jsx
import { useState } from 'react';

function Contador() {
  // Declaración del hook: [valorActual, funcionParaActualizarlo]
  const [contador, setContador] = useState(0);

  const incrementar = () => {
    setContador(prev => prev + 1);
  };

  const reiniciar = () => {
    setContador(0);
  };

  return (
    <div className="contador-box">
      <h2>Contador: {contador}</h2>
      <button onClick={incrementar}>+1 Sumar</button>
      <button onClick={reiniciar}>Reiniciar</button>
    </div>
  );
}
```

> [!NOTE]
> La regla de oro de los Hooks: Solo puedes llamar a `useState` en el nivel superior de tu componente. Nunca dentro de bucles `for`, condicionales `if` o funciones anidadas.

---

## 3. Ejemplo Práctico: Lista de Tareas Interactiva

Veamos cómo gestionar un estado un poco más complejo como un arreglo de tareas:

```jsx
import { useState } from 'react';

function ListaTareas() {
  const [tareas, setTareas] = useState(['Aprender JSX', 'Dominar Props']);
  const [texto, setTexto] = useState('');

  const agregarTarea = (e) => {
    e.preventDefault();
    if (!texto.trim()) return;

    // Inmutabilidad: creamos un nuevo arreglo con el nuevo elemento
    setTareas([...tareas, texto]);
    setTexto('');
  };

  return (
    <div>
      <form onSubmit={agregarTarea}>
        <input 
          type="text" 
          value={texto} 
          onChange={(e) => setTexto(e.target.value)} 
          placeholder="Escribe una tarea..."
        />
        <button type="submit">Agregar</button>
      </form>

      <ul>
        {tareas.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

> [!TIP]
> Recuerda siempre respetar la **inmutabilidad**: nunca modifiques directamente arreglos u objetos del estado (`tareas.push(...)` está prohibido; utiliza `[...tareas, nuevoItem]`).
