# 1. Tipos Primitivos, Interfaces y Type Aliases

TypeScript es un superconjunto tipado de JavaScript que se compila a JavaScript limpio y estándar. Su principal ventaja es que detecta errores en tiempo de desarrollo (estático), antes de que el código llegue a producción.

## Tipos Primitivos

En TypeScript puedes declarar tipos explícitos o permitir que el compilador los infiera:

```typescript
// Tipado explícito
const nombre: string = 'Alex';
const edad: number = 28;
const esActivo: boolean = true;
const lenguajes: string[] = ['JavaScript', 'TypeScript', 'Python'];

// Tupla: estructura con longitud y tipos fijos por posición
const coordenada: [number, number] = [10.5, 20.3];
```

## Interfaces vs Type Aliases

Tanto las `interface` como los `type` permiten modelar la forma de los objetos. Una buena convención es usar `interface` para objetos de dominio y contratos orientados a objetos, y `type` para uniones y tipos utilitarios.

```typescript
interface Usuario {
  readonly id: string;
  nombre: string;
  email: string;
  edad?: number; // Propiedad opcional
}

type Rol = 'admin' | 'editor' | 'estudiante'; // Union Type

interface PerfilEstudiante extends Usuario {
  rol: Rol;
  cursosInscritos: string[];
}
```

> [!TIP]
> La propiedad `readonly` evita que un campo sea reasignado después de su inicialización, protegiendo la inmutabilidad de tus estructuras de datos.

## Quiz de Autoevaluación

> [!QUIZ]
> ¿Cuál es la ventaja principal de TypeScript frente a JavaScript estándar?
> - [x] Detecta inconsistencias y errores de tipos en tiempo de compilación antes de la ejecución.
> - [ ] Hace que el navegador ejecute el código el doble de rápido sin compilación.
> - [ ] Elimina la necesidad de utilizar variables y funciones en el código.
> - [ ] Requiere obligatoriamente un backend en Java o C#.

## Ejercicio Práctico

Define una interfaz llamada `Curso` con las siguientes propiedades:
- `id` (de solo lectura y tipo string)
- `titulo` (string)
- `duracionHoras` (número)
- `nivel` (unión estricta: `'Principiante' | 'Intermedio' | 'Avanzado'`)

<details class="exercise-solution">
<summary>Ver Solución Explicada</summary>

```typescript
type NivelCurso = 'Principiante' | 'Intermedio' | 'Avanzado';

interface Curso {
  readonly id: string;
  titulo: string;
  duracionHoras: number;
  nivel: NivelCurso;
}

const miCurso: Curso = {
  id: 'ts-101',
  titulo: 'TypeScript Esencial',
  duracionHoras: 3.5,
  nivel: 'Intermedio'
};
```

</details>
