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

---

## 🎯 Autoevaluación Interactiva

> [!QUIZ]
> ¿Por qué en React no se debe mutar el estado directamente usando tareas.push(nuevaTarea) en lugar de setTareas([...tareas, nuevaTarea])?
> - [ ] Porque JavaScript lanza un error fatal de sintaxis
> - [x] Porque React compara referencias en memoria para detectar cambios y re-renderizar la interfaz; si mutas la misma referencia, no se entera del cambio
> - [ ] Porque useState solo acepta valores numéricos
> - [ ] Porque push() borra los elementos anteriores de la lista
>
> **Explicación**: React utiliza comparación superficial (*shallow comparison*) de referencias para decidir si debe volver a renderizar. Al crear un nuevo arreglo con el operador spread (`[...]`), la referencia cambia y React dispara el re-renderizado de la UI de inmediato.

---

## 🛠️ Ejercicio Práctico: Botón de Alternancia (Toggle Switch)

**Objetivo**: Crear un componente interactivo `InterruptorLuz` que alterne entre "Encendido" y "Apagado" al hacer clic.

**Instrucciones**:
1. Declara una variable de estado booleana `encendido` inicializada en `false` con `useState`.
2. Al hacer clic en un botón, invierte el valor del estado (`!encendido`).
3. Muestra condicionalmente:
   - Texto: `"Luz encendida 💡"` si es `true`, o `"Luz apagada 🌑"` si es `false`.
   - Clase o estilo: Fondo claro si está encendido, oscuro si está apagado.

<details class="exercise-solution">
<summary>💡 Ver solución explicada paso a paso</summary>

<div class="solution-content">

```jsx
import { useState } from 'react';

export function InterruptorLuz() {
  const [encendido, setEncendido] = useState(false);

  const alternar = () => {
    setEncendido(prev => !prev);
  };

  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '8px',
      background: encendido ? '#1e293b' : '#0f172a',
      textAlign: 'center',
      border: `1px solid ${encendido ? '#00f5a0' : '#334155'}`
    }}>
      <h3>{encendido ? 'Luz encendida 💡' : 'Luz apagada 🌑'}</h3>
      <button 
        onClick={alternar}
        style={{
          padding: '0.5rem 1rem',
          background: encendido ? '#00f5a0' : '#334155',
          color: encendido ? '#0b1220' : '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {encendido ? 'Apagar' : 'Encender'}
      </button>
    </div>
  );
}
```

**Explicación**:
- Usar la forma funcional `setEncendido(prev => !prev)` es la forma recomendada cuando el siguiente estado depende directamente del valor anterior.
- El operador ternario `{encendido ? ... : ...}` permite alternar textos, iconos y estilos condicionalmente de forma muy legible.
</div>
</details>
