# 2. Genéricos y Tipos Utilitarios Modernos

Los **Genéricos** son una de las herramientas más potentes de TypeScript. Permiten escribir código reutilizable y flexible que funciona con diversos tipos de datos mientras mantiene una seguridad de tipos estricta y completa.

## ¿Qué es un Genérico?

En lugar de usar `any` (que desactiva las comprobaciones de tipos), los genéricos capturan el tipo que se pasa como argumento:

```typescript
function primerElemento<T>(arreglo: T[]): T | undefined {
  return arreglo[0];
}

const numero = primerElemento([10, 20, 30]); // inferido como number
const texto = primerElemento(['React', 'Node', 'Express']); // inferido como string
```

## Tipos Utilitarios Nativos

TypeScript incluye utilidades incorporadas para transformar tipos existentes:

- `Partial<T>`: Convierte todas las propiedades en opcionales.
- `Required<T>`: Hace que todas las propiedades sean requeridas.
- `Pick<T, K>`: Selecciona un subconjunto de propiedades.
- `Omit<T, K>`: Excluye propiedades específicas.

```typescript
interface Leccion {
  id: string;
  titulo: string;
  duracion: string;
  completada: boolean;
}

// Para actualizar solo campos modificados:
type ActualizacionLeccion = Partial<Leccion>;

// Para crear una lección sin el id (lo genera la BD):
type NuevaLeccion = Omit<Leccion, 'id'>;
```

## Quiz de Autoevaluación

> [!QUIZ]
> ¿Qué tipo utilitario de TypeScript utilizarías para crear una versión de una interfaz donde todos los campos sean opcionales?
> - [x] Partial<T>
> - [ ] Omit<T, K>
> - [ ] Pick<T, K>
> - [ ] Record<K, T>
