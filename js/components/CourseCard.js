/**
 * EduXP - CourseCard Component
 * Tarjeta de curso construida con métodos nativos del DOM (cero innerHTML)
 * Soporta creación funcional y Web Component <course-card>
 */

import { store } from '../store.js';
import { el, icon, clearElement } from '../utils/dom.js';
import { createBadge } from './Badge.js';
import { createProgressBar } from './ProgressBar.js';

/**
 * Genera una tarjeta de curso completa con progreso en tiempo real
 * @param {Object} course - Objeto con datos del curso
 * @returns {HTMLElement}
 */
export function createCourseCard(course) {
  const totalLessons = course.totalLessons || 0;
  const badgeTheme = course.badgeColor || 'mint';
  const iconClass = course.icon || 'fa-solid fa-code';

  // 1. Header Banner
  const headerBanner = el('div', { className: 'card-header-banner' },
    el('div', { className: 'card-icon-bubble' }, icon(iconClass)),
    createBadge({ text: course.level || 'Todos', theme: badgeTheme })
  );

  // 2. Contenedor Reactivo de Barra de Progreso
  const progressContainer = el('div', { className: 'card-progress-bar-wrap' });

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

  // 4. Requisitos Previos (Chips)
  let requirementsElement = null;
  if (course.requirements && Array.isArray(course.requirements) && course.requirements.length > 0) {
    const chips = course.requirements.slice(0, 2).map(req =>
      el('span', { className: 'requirement-chip', textContent: req })
    );
    if (course.requirements.length > 2) {
      chips.push(
        el('span', {
          className: 'requirement-chip',
          title: course.requirements.slice(2).join(', '),
          textContent: `+${course.requirements.length - 2}`
        })
      );
    }
    requirementsElement = el('div', { className: 'card-requirements' },
      el('span', { className: 'card-requirements-label' },
        icon('fa-solid fa-list-check'),
        document.createTextNode(' Requisitos: ')
      ),
      el('div', { className: 'card-requirements-tags' }, chips)
    );
  }

  // 5. Cuerpo de la Tarjeta
  const cardBody = el('div', { className: 'card-body' },
    el('h3', { className: 'card-title', textContent: course.title }),
    el('p', { className: 'card-desc', textContent: course.description }),
    requirementsElement,
    progressContainer,
    metaRow
  );

  // 6. Contenedor Reactivo de Botón de Acción
  const footerAction = el('div', { className: 'card-footer-action' });

  function renderDynamicState() {
    const stats = store.getCourseStats(course.slug, totalLessons);
    const courseStatus = store.getCourseStatus(course.slug, totalLessons);

    clearElement(progressContainer);
    progressContainer.appendChild(createProgressBar({
      percentage: stats.percentage,
      completed: stats.completed,
      total: stats.total || totalLessons,
      showLabels: true
    }));

    clearElement(footerAction);

    if (courseStatus === 'completed') {
      // Terminado: badge de éxito + ir al curso
      const doneEl = el('div', { className: 'card-status-row' },
        el('span', { className: 'badge badge-mint', style: { flex: '1' } },
          icon('fa-solid fa-circle-check'), ' Completado'
        ),
        el('a', { href: `#/course/${course.slug}`, className: 'btn btn-ghost btn-sm', title: 'Ver temario' },
          icon('fa-solid fa-rotate-right'), ' Repasar'
        )
      );
      footerAction.appendChild(doneEl);

    } else if (courseStatus === 'in_progress') {
      // En progreso: botón verde "Continuar"
      const actionBtn = el('a', { href: `#/course/${course.slug}`, className: 'btn btn-primary btn-block btn-sm' },
        icon('fa-solid fa-circle-play'),
        document.createTextNode(' Continuar Curso')
      );
      footerAction.appendChild(actionBtn);

    } else if (courseStatus === 'on_hold') {
      // En espera: botón secundario con ícono de pausa
      const row = el('div', { className: 'card-status-row' },
        el('span', { className: 'card-status-badge on-hold-badge' },
          icon('fa-solid fa-bookmark'), ' En Espera'
        ),
        el('a', { href: `#/course/${course.slug}`, className: 'btn btn-secondary btn-sm', title: 'Ver temario y activar' },
          icon('fa-solid fa-play'), ' Ver curso'
        )
      );
      footerAction.appendChild(row);

    } else {
      // No iniciado: botón verde "Comenzar"
      const actionBtn = el('a', { href: `#/course/${course.slug}`, className: 'btn btn-primary btn-block btn-sm' },
        icon('fa-solid fa-play'),
        document.createTextNode(' Comenzar Curso')
      );
      footerAction.appendChild(actionBtn);
    }
  }

  renderDynamicState();

  const card = el('article', { className: 'course-card' },
    headerBanner,
    cardBody,
    footerAction
  );

  // Escuchar eventos de progreso, login, logout y sincronización de Supabase
  const onStateChange = () => {
    if (document.body.contains(card)) {
      renderDynamicState();
    } else {
      window.removeEventListener('eduxp:progress-updated', onStateChange);
      window.removeEventListener('eduxp:auth-changed', onStateChange);
      window.removeEventListener('eduxp:cloud-synced', onStateChange);
    }
  };

  window.addEventListener('eduxp:progress-updated', onStateChange);
  window.addEventListener('eduxp:auth-changed', onStateChange);
  window.addEventListener('eduxp:cloud-synced', onStateChange);

  return card;
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
