/**
 * EduXP - SidebarLessonItem Component
 * Ítem de lección para la barra lateral (Sidebar) del visor de lecciones
 * Construido con la API nativa del DOM (cero innerHTML)
 */

import { el, icon } from '../utils/dom.js';

/**
 * Crea un ítem interactivo para la barra lateral del visor
 * @param {Object} options
 * @param {Object} options.lesson - Datos de la lección
 * @param {string} options.courseSlug - Slug del curso
 * @param {boolean} [options.isActive=false] - Si es la lección actualmente abierta
 * @param {boolean} [options.isCompleted=false] - Si la lección está marcada como completada
 * @param {number} [options.lessonIndex] - Índice numérico de la lección
 * @returns {HTMLElement}
 */
export function createSidebarLessonItem({
  lesson,
  courseSlug,
  isActive = false,
  isCompleted = false,
  lessonIndex = null
} = {}) {
  const itemIcon = el('div', {
    className: `sidebar-lesson-icon ${isCompleted ? 'completed' : ''}`
  },
    icon(`fa-solid ${isCompleted ? 'fa-check' : 'fa-play'}`)
  );

  const displayTitle = lessonIndex != null ? `${lessonIndex}. ${lesson.title}` : lesson.title;
  const titleSpan = el('span', {
    className: 'sidebar-lesson-title',
    textContent: displayTitle,
    title: displayTitle
  });

  const timeSpan = el('span', {
    className: 'sidebar-lesson-time',
    textContent: lesson.duration || ''
  });

  return el('a', {
    href: `#/course/${courseSlug}/lesson/${lesson.id}`,
    className: `sidebar-lesson-item ${isActive ? 'active' : ''}`
  },
    itemIcon,
    titleSpan,
    timeSpan
  );
}
