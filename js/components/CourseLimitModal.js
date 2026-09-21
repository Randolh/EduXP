/**
 * EduXP - Componente Modal de Gestión de Límite de Cursos Activos
 * Aplica el principio de máximo 3 cursos simultáneos en progreso.
 * Para activar un nuevo curso teniendo los 3 cupos llenos, se debe cancelar
 * uno de los cursos actuales perdiendo su progreso para liberar el espacio.
 * Los cursos terminados están protegidos y no son afectados.
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

  // Filtrar para asegurar que solo se muestren los OTROS cursos activos (nunca terminados y nunca el curso a iniciar)
  const inProgressOnly = activeCourses.filter(c => {
    if (c.slug === courseToStart.slug) return false;
    const status = store.getCourseStatus(c.slug, c.totalLessons || 0);
    return status === 'in_progress';
  });

  const closeBtn = el('button', {
    className: 'auth-modal-close-btn',
    title: 'Cerrar',
    type: 'button',
    onClick: () => closeModal()
  }, icon('fa-solid fa-xmark'));

  const modalIcon = el('div', {
    className: 'auth-modal-icon-bubble',
    style: {
      background: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'var(--accent-red, #ef4444)',
      color: 'var(--accent-red, #ef4444)',
      boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)'
    }
  }, icon('fa-solid fa-triangle-exclamation'));

  const modalTitle = el('h3', {
    className: 'auth-modal-title',
    textContent: 'Límite de Cursos en Progreso (3/3)'
  });

  const modalSubtitle = el('p', {
    className: 'auth-modal-subtitle',
    textContent: `Solo puedes tener 3 cursos activos al mismo tiempo. Para comenzar "${courseToStart.title}", debes cancelar uno de tus cursos en progreso.`
  });

  // Alerta destacada de advertencia de pérdida de progreso
  const warningNotice = el('div', { className: 'limit-warning-box' },
    icon('fa-solid fa-circle-exclamation', 'text-warning-icon'),
    el('div', { className: 'limit-warning-content' },
      el('strong', { textContent: 'Atención: Se perderá el avance del curso cancelado' }),
      el('p', {
        textContent: 'Para liberar el espacio y activar el nuevo curso, el curso seleccionado perderá todo su progreso y volverá a cero. (Los cursos terminados no se afectan).'
      })
    )
  );

  // Lista de cursos en progreso con opción de cancelar y perder progreso
  const activeCoursesList = el('div', { className: 'limit-courses-list' },
    inProgressOnly.map(course => {
      const stats = store.getCourseStats(course.slug, course.totalLessons || 0);
      const itemContainer = el('div', { className: 'limit-course-item' });

      function renderNormalState() {
        clearElement(itemContainer);

        const cancelBtn = el('button', {
          type: 'button',
          className: 'btn btn-danger-outline btn-sm limit-cancel-btn',
          title: `Cancelar ${course.title} y perder su progreso para iniciar ${courseToStart.title}`,
          onClick: () => renderConfirmState()
        },
          icon('fa-solid fa-trash-can'),
          ' Cancelar y perder progreso'
        );

        const miniBar = createProgressBar({
          percentage: stats.percentage,
          completed: stats.completed,
          total: course.totalLessons || stats.total,
          showLabels: true,
          size: 'sm'
        });

        const header = el('div', { className: 'limit-item-header' },
          el('h4', { className: 'limit-item-title', textContent: course.title }),
          cancelBtn
        );

        itemContainer.append(header, miniBar);
      }

      function renderConfirmState() {
        clearElement(itemContainer);

        const confirmMsg = el('p', {
          className: 'limit-confirm-text',
          textContent: `¿Confirmas que deseas cancelar "${course.title}"? Su progreso (${stats.percentage}%) se reiniciará a 0% para activar "${courseToStart.title}".`
        });

        const confirmBtn = el('button', {
          type: 'button',
          className: 'btn btn-danger btn-sm',
          onClick: async () => {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Reiniciando...';
            await store.cancelCourseAndResetProgress(course.slug, course.totalLessons || 0);
            store.setCourseStatus(courseToStart.slug, 'in_progress');
            showToast(`"${course.title}" cancelado. Tu cupo ha sido liberado para "${courseToStart.title}".`, 'warning');
            closeModal();
            if (typeof onProceed === 'function') {
              onProceed();
            } else {
              window.location.hash = `#/course/${courseToStart.slug}`;
            }
          }
        },
          icon('fa-solid fa-check'),
          ' Sí, perder progreso y comenzar nuevo'
        );

        const cancelAbortBtn = el('button', {
          type: 'button',
          className: 'btn btn-ghost btn-sm',
          onClick: () => renderNormalState()
        }, 'No, volver');

        const btnRow = el('div', { className: 'limit-confirm-actions' },
          cancelAbortBtn,
          confirmBtn
        );

        itemContainer.append(confirmMsg, btnRow);
      }

      renderNormalState();
      return itemContainer;
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
      warningNotice,
      el('div', { className: 'limit-section-label' },
        icon('fa-solid fa-fire text-mint'),
        ' Cursos activos actualmente (elige uno para cancelar):'
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

