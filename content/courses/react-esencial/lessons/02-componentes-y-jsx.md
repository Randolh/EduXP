# Lección 2: Sintaxis JSX y Creación de Componentes

En esta lección descubriremos qué es **JSX** (*JavaScript XML*), por qué parece HTML pero no lo es, y cómo construir componentes funcionales limpios con propiedades (*props*).

---

## 1. ¿Qué es JSX?

JSX es una extensión sintáctica para JavaScript creada para describir visualmente cómo debe lucir la interfaz de un componente. Aunque se parece a HTML tradicional, tiene todo el poder de JavaScript integrado:

```jsx
// Un elemento básico en JSX
const element = <h1 className="saludo">¡Hola, desarrollador!</h1>;
```

Bajo el capó, los transpiladores como Babel o Vite convierten el código JSX anterior en llamadas estándar a JavaScript:

```javascript
// Lo que ejecuta el motor de JavaScript
const element = React.createElement('h1', { className: 'saludo' }, '¡Hola, desarrollador!');
```

---

## 2. Reglas de Oro al Escribir JSX

Al escribir JSX existen tres reglas esenciales que debes recordar siempre:

1. **Retornar un único elemento raíz**: Envuelve múltiples etiquetas en un contenedor o en un Fragment (`<> ... </>`).
2. **Cerrar todas las etiquetas**: Incluso elementos autocontenidos como `<img />`, `<br />` e `<input />`.
3. **Usar camelCase para los atributos**: Por ejemplo, `className` en lugar de `class`, y `htmlFor` en lugar de `for`.

```jsx
function PerfilUsuario() {
  const nombre = "Carlos Mendoza";
  const rol = "Frontend Architect";

  return (
    <article className="tarjeta-perfil">
      <img src="https://picsum.photos/100" alt="Avatar" />
      <h3>{nombre}</h3>
      <p className="rol-texto">{rol.toUpperCase()}</p>
    </article>
  );
}
```

> [!NOTE]
> Cualquier expresión válida de JavaScript puede insertarse dentro de JSX utilizando llaves `{}`.

---

## 3. Pasar Datos con Props

Las **Props** (propiedades) son el mecanismo mediante el cual un componente padre envía información a sus componentes hijos:

```jsx
// Componente Hijo
function TarjetaCurso({ titulo, nivel, horas }) {
  return (
    <div className="card">
      <h4>{titulo}</h4>
      <span>Nivel: {nivel}</span>
      <p>Duración: {horas} horas</p>
    </div>
  );
}

// Componente Padre
function App() {
  return (
    <main>
      <h2>Mis Cursos Inscritos</h2>
      <TarjetaCurso titulo="React Esencial" nivel="Principiante" horas={4} />
      <TarjetaCurso titulo="Node.js Avanzado" nivel="Avanzado" horas={8} />
    </main>
  );
}
```

> [!TIP]
> Las props son **de solo lectura (inmutables)**. Un componente nunca debe alterar sus propias props recibidas. Para valores que cambian en el tiempo, usamos **Estado**.
