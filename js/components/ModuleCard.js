/**
 * EduXP - ModuleCard Component
 * Tarjeta de módulo con lista de lecciones para el Syllabus
 * Construida con métodos nativos del DOM (cero innerHTML)
 */

import { store } from '../store.js';
import { el } from '../utils/dom.js';
import { createLessonRow } from './LessonRow.js';

/**
 * Crea una tarjeta de módulo completa
 * @param {Object} options
 * @param {string} options.courseSlug - Slug del curso
 * @param {Object} options.module - Datos del módulo { id, title, lessons }
 * @param {number} options.moduleIndex - Índice del módulo (0-based)
 * @returns {HTMLElement}
 */
export function createModuleCard({ courseSlug, module, moduleIndex = 0 }) {
  const modHeader = el('div', { className: 'module-header' },
    el('div', { className: 'module-title' },
      el('span', {
        style: { color: 'var(--mint-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' },
        textContent: `MOD ${moduleIndex + 1}`
      }),
      el('span', { textContent: module.title })
    ),
    el('span', { className: 'module-counter', textContent: `${module.lessons.length} lecciones` })
  );

  const lessonRows = module.lessons.map((lesson, idx) => {
    const isCompleted = store.isLessonCompleted(courseSlug, lesson.id);
    return createLessonRow({
      lesson,
      courseSlug,
      isCompleted,
      lessonIndex: idx + 1
    });
  });

  const lessonsList = el('ul', { className: 'lessons-list' }, ...lessonRows);

  return el('div', { className: 'module-card' }, modHeader, lessonsList);
}
