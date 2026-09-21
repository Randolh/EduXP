/**
 * EduXP - Componente Modal de Gestión de Límite de Cursos Activos
 * Aplica el principio de aprendizaje enfocado limitando a 3 cursos activos simultáneos
 */

import { el, icon, clearElement } from '../utils/dom.js';
import { store } from '../store.js';
import { createProgressBar } from './ProgressBar.js';
import { showToast } from './Toast.js';

let currentModal = null;

/**
 * Abre el modal de aviso de límite de cursos alcanzado
 * @param {Object} options
 * @param {Object} options.courseToStart - Curso que el estudiante desea empezar o reanudar
 * @param {Array} options.activeCourses - Lista de cursos actualmente en progreso
 * @param {Function} [options.onProceed] - Callback cuando se libera un cupo e inicia
 */
export function openCourseLimitModal({ courseToStart, activeCourses = [], onProceed = null }) {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }

  const closeBtn = el('button', {
    className: 'auth-modal-close-btn',
    title: 'Cerrar',
    type: 'button',
    onClick: () => closeModal()
  }, icon('fa-solid fa-xmark'));

  const modalIcon = el('div', {
    className: 'auth-modal-icon-bubble',
    style: {
      background: 'rgba(234, 179, 8, 0.15)',
      borderColor: '#eab308',
      color: '#eab308',
      boxShadow: '0 0 16px rgba(234, 179, 8, 0.25)'
    }
  }, icon('fa-solid fa-layer-group'));

  const modalTitle = el('h3', {
    className: 'auth-modal-title',
    textContent: 'Límite de Cursos en Progreso (3/3)'
  });

  const modalSubtitle = el('p', {
    className: 'auth-modal-subtitle',
    textContent: `Para maximizar tu retención y enfoque, EduXP permite hasta 3 cursos activos al mismo tiempo. Pausa uno de tus cursos actuales para iniciar "${courseToStart.title}".`
  });

  // Lista de los 3 cursos activos para pausar con 1 clic
  const activeCoursesList = el('div', { className: 'limit-courses-list' },
    activeCourses.map(course => {
      const stats = store.getCourseStats(course.slug, course.totalLessons || 0);

      const pauseBtn = el('button', {
        type: 'button',
        className: 'btn btn-secondary btn-sm limit-pause-btn',
        title: `Pausar ${course.title} y empezar ${courseToStart.title}`,
        onClick: () => {
          store.pauseCourseToHold(course.slug);
          store.setCourseStatus(courseToStart.slug, 'in_progress');
          showToast(`"${course.title}" se movió a En Espera. ¡Iniciando ${courseToStart.title}!`, 'success');
          closeModal();
          if (typeof onProceed === 'function') {
            onProceed();
          } else {
            window.location.hash = `#/course/${courseToStart.slug}`;
          }
        }
      },
        icon('fa-solid fa-pause text-yellow'),
        ' Pausar este curso'
      );

      const miniBar = createProgressBar({
        percentage: stats.percentage,
        completed: stats.completed,
        total: stats.total,
        showLabels: true,
        size: 'sm'
      });

      return el('div', { className: 'limit-course-item' },
        el('div', { className: 'limit-item-header' },
          el('h4', { className: 'limit-item-title', textContent: course.title }),
          pauseBtn
        ),
        miniBar
      );
    })
  );

  const libraryLinkBtn = el('a', {
    href: '#/library',
    className: 'btn btn-ghost btn-block btn-sm',
    style: { marginTop: '0.75rem', textAlign: 'center' },
    onClick: () => closeModal()
  },
    icon('fa-solid fa-book-bookmark'),
    ' Administrar Mi Biblioteca Completa'
  );

  const modalWindow = el('div', { className: 'auth-modal-window course-limit-modal-window' },
    closeBtn,
    el('div', { className: 'auth-modal-header', style: { paddingBottom: '1rem' } },
      modalIcon,
      modalTitle,
      modalSubtitle
    ),
    el('div', { className: 'auth-modal-body', style: { padding: '1.25rem' } },
      el('div', { className: 'limit-section-label' },
        icon('fa-solid fa-clock-rotate-left'),
        ' Tus cursos activos actuales:'
      ),
      activeCoursesList,
      libraryLinkBtn
    )
  );

  const overlay = el('div', { className: 'auth-modal-overlay' }, modalWindow);

  function closeModal() {
    overlay.remove();
    document.removeEventListener('keydown', handleKeyDown);
    currentModal = null;
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') closeModal();
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', handleKeyDown);
  document.body.appendChild(overlay);
  currentModal = overlay;
}
