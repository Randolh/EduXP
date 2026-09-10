/**
 * EduXP - CourseCard Component
 * Tarjeta de curso construida con métodos nativos del DOM (cero innerHTML)
 * Soporta creación funcional y Web Component <course-card>
 */

import { store } from '../store.js';
import { el, icon } from '../utils/dom.js';
import { createBadge } from './Badge.js';
import { createProgressBar } from './ProgressBar.js';

/**
 * Genera una tarjeta de curso completa con progreso en tiempo real
 * @param {Object} course - Objeto con datos del curso
 * @returns {HTMLElement}
 */
export function createCourseCard(course) {
  const totalLessons = course.totalLessons || 0;
  const stats = store.getCourseStats(course.slug, totalLessons);
  const badgeTheme = course.badgeColor || 'mint';
  const iconClass = course.icon || 'fa-solid fa-code';

  // 1. Header Banner
  const headerBanner = el('div', { className: 'card-header-banner' },
    el('div', { className: 'card-icon-bubble' }, icon(iconClass)),
    createBadge({ text: course.level || 'Todos', theme: badgeTheme })
  );

  // 2. Barra de Progreso
  const progressBar = createProgressBar({
    percentage: stats.percentage,
    completed: stats.completed,
    total: stats.total || totalLessons,
    showLabels: true
  });
  progressBar.classList.add('card-progress-bar-wrap');

  // 3. Metadatos
  const metaRow = el('div', { className: 'card-meta-row' },
    el('div', { className: 'card-meta-item' },
      icon('fa-regular fa-clock'),
      document.createTextNode(` ${course.duration || '2-3 hrs'}`)
    ),
    el('div', { className: 'card-meta-item' },
      icon('fa-solid fa-list-check'),
      document.createTextNode(` ${totalLessons} temas`)
    )
  );

  // 4. Cuerpo de la Tarjeta
  const cardBody = el('div', { className: 'card-body' },
    el('h3', { className: 'card-title', textContent: course.title }),
    el('p', { className: 'card-desc', textContent: course.description }),
    progressBar,
    metaRow
  );

  // 5. Botón de Acción
  const actionBtnText = stats.completed > 0 ? 'Continuar Curso' : 'Comenzar Curso';
  const footerAction = el('div', { className: 'card-footer-action' },
    el('a', { href: `#/course/${course.slug}`, className: 'btn btn-primary btn-block btn-sm' },
      icon('fa-solid fa-play'),
      document.createTextNode(` ${actionBtnText}`)
    )
  );

  return el('article', { className: 'course-card' },
    headerBanner,
    cardBody,
    footerAction
  );
}

/**
 * Custom Element: <course-card slug="react-esencial"></course-card>
 */
export class CourseCardElement extends HTMLElement {
  set course(data) {
    this._course = data;
    this.render();
  }

  get course() {
    return this._course;
  }

  render() {
    if (!this._course) return;
    const card = createCourseCard(this._course);
    this.replaceChildren(card);
  }
}

if (!customElements.get('course-card')) {
  customElements.define('course-card', CourseCardElement);
}
