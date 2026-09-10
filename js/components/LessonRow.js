/**
 * EduXP - LessonRow Component
 * Fila de lección para el temario del curso (Syllabus)
 * Construida con métodos nativos del DOM (cero innerHTML)
 */

import { el, icon } from '../utils/dom.js';

/**
 * Crea una fila de lección para el temario
 * @param {Object} options
 * @param {Object} options.lesson - Objeto lección { id, title, duration }
 * @param {string} options.courseSlug - Slug del curso
 * @param {boolean} options.isCompleted - Estado de completado
 * @param {number} [options.lessonIndex] - Índice numérico opcional (ej. 1, 2)
 * @returns {HTMLElement}
 */
export function createLessonRow({ lesson, courseSlug, isCompleted = false, lessonIndex = null } = {}) {
  const lessonUrl = `#/course/${courseSlug}/lesson/${lesson.id}`;

  // 1. Icono de estado (play o check)
  const statusIcon = el('div', {
    className: `lesson-status-icon ${isCompleted ? 'completed' : ''}`,
    title: isCompleted ? 'Lección completada' : 'Pendiente'
  },
    icon(`fa-solid ${isCompleted ? 'fa-check' : 'fa-play'}`)
  );

  // 2. Enlace del título con texto truncable (ellipsis)
  const displayTitle = lessonIndex != null ? `${lessonIndex}. ${lesson.title}` : lesson.title;
  const titleLink = el('a', {
    href: lessonUrl,
    className: 'lesson-title-link',
    textContent: displayTitle,
    title: displayTitle
  });

  const mainInfo = el('div', { className: 'lesson-main-info' }, statusIcon, titleLink);

  // 3. Duración fija e icono de acción
  const durationBadge = el('span', { className: 'lesson-duration-badge' },
    icon('fa-regular fa-clock'),
    document.createTextNode(` ${lesson.duration || '10 min'}`)
  );

  const actionLink = el('a', {
    href: lessonUrl,
    className: 'btn btn-ghost btn-sm',
    title: 'Ir a la lección'
  },
    icon('fa-solid fa-chevron-right')
  );

  const itemMeta = el('div', { className: 'lesson-item-meta' }, durationBadge, actionLink);

  return el('li', { className: 'lesson-item-row' }, mainInfo, itemMeta);
}
