/**
 * EduXP - Vista de Biblioteca del Estudiante (Library View)
 * Organiza los cursos en 3 estados: En Progreso, Terminados y En Espera
 * Aplica el límite pedagógico de máximo 3 cursos activos simultáneos
 */

import { api } from '../api.js';
import { store } from '../store.js';
import { el, clearElement, icon, createLoader } from '../utils/dom.js';
import { createBadge, createProgressBar, showToast, openCourseLimitModal, openAuthModal } from '../components/index.js';

export async function renderLibrary(container) {
  clearElement(container);
  container.appendChild(createLoader('Cargando tu biblioteca de cursos...'));

  await store.waitForAuth();
  if (!store.isAuthenticated()) {
    window.location.hash = '#/courses';
    openAuthModal('login', 'Debes iniciar sesión para acceder a tu biblioteca personalizada.');
    return;
  }

  try {
    const allCourses = await api.getCourses();
    let currentTab = 'all'; // 'all' | 'in_progress' | 'completed' | 'on_hold'

    const grid = el('div', { className: 'library-grid', id: 'library-grid' });

    function computeCategorizedCourses() {
      // 1. Aplicar límite estricto de máximo 3 cursos en progreso
      store.enforceMaxActiveLimit(allCourses);

      const inProgress = [];
      const completed = [];
      const onHold = [];
      const notStarted = [];

      allCourses.forEach(course => {
        const total = course.totalLessons || 0;
        const status = store.getCourseStatus(course.slug, total);
        const stats = store.getCourseStats(course.slug, total);
        const enriched = { ...course, status, stats };

        if (status === 'completed') {
          completed.push(enriched);
        } else if (status === 'on_hold') {
          onHold.push(enriched);
        } else if (status === 'in_progress') {
          if (inProgress.length < 3) {
            inProgress.push(enriched);
          } else {
            // Salvaguarda: cualquier excedente se muestra en on_hold
            onHold.push({ ...enriched, status: 'on_hold' });
          }
        } else {
          notStarted.push(enriched);
        }
      });

      return { inProgress, completed, onHold, notStarted };
    }

    // Contenedor principal de la vista
    const libraryContainer = el('div', { className: 'container' });

    function renderView() {
      clearElement(libraryContainer);

      const { inProgress, completed, onHold } = computeCategorizedCourses();
      const activeCount = Math.min(inProgress.length, 3);
      const isFull = activeCount >= 3;

      // 1. Hero Header con Widget de Cupos Activos (3/3 Limit)
      const slotPills = [1, 2, 3].map(slotNum => {
        let pillClass = 'slot-indicator-pill';
        if (slotNum <= activeCount) {
          pillClass += isFull ? ' is-full-active' : ' is-active';
        }
        return el('div', { className: pillClass, title: `Cupo ${slotNum} de 3` });
      });

      const slotHintText = isFull
        ? '⚠️ Límite alcanzado: Cancela un curso (reiniciando su progreso) o complétalo al 100% para liberar cupo.'
        : `Tienes ${3 - activeCount} cupo(s) disponible(s) para nuevos cursos activos.`;

      const heroHeader = el('section', { className: 'library-header' },
        el('div', { className: 'library-hero-grid' },
          el('div', { className: 'library-title-wrap' },
            el('h1', {},
              icon('fa-solid fa-book-bookmark', 'text-mint'),
              ' Mi Biblioteca de Cursos'
            ),
            el('p', { className: 'library-desc' },
              'Gestiona tu aprendizaje con enfoque. Máximo 3 cursos simultáneos en progreso. Si tienes los 3 cupos llenos y deseas iniciar otro, deberás cancelar uno perdiendo su avance para liberar el espacio. Los cursos terminados no ocupan cupo ni se afectan.'
            )
          ),
          el('div', { className: 'library-slot-card' },
            el('div', { className: 'slot-card-header' },
              el('span', { className: 'slot-card-label', textContent: 'Cupos Activos' }),
              el('span', {
                className: `slot-card-count ${isFull ? 'is-full' : ''}`,
                textContent: `${activeCount} / 3`
              })
            ),
            el('div', { className: 'slot-indicators-row' }, slotPills),
            el('span', { className: 'slot-card-hint', textContent: slotHintText })
          )
        )
      );

      // 2. Barra de Pestañas de Filtro
      const totalEnrolled = inProgress.length + completed.length + onHold.length;

      const tabs = [
        { id: 'all', label: 'Todos', count: totalEnrolled, iconClass: 'fa-solid fa-layer-group' },
        { id: 'in_progress', label: 'En Progreso', count: inProgress.length, iconClass: 'fa-solid fa-fire text-mint' },
        { id: 'completed', label: 'Terminados', count: completed.length, iconClass: 'fa-solid fa-trophy text-cyan' },
        { id: 'on_hold', label: 'En Espera', count: onHold.length, iconClass: 'fa-solid fa-pause text-yellow' }
      ];

      const tabsBar = el('div', { className: 'library-tabs-bar' },
        tabs.map(tab => {
          const btn = el('button', {
            type: 'button',
            className: `library-tab-btn ${currentTab === tab.id ? 'is-active' : ''}`,
            onClick: () => {
              currentTab = tab.id;
              renderView();
            }
          },
            icon(tab.iconClass),
            document.createTextNode(` ${tab.label} `),
            el('span', { className: 'tab-badge-pill', textContent: tab.count })
          );
          return btn;
        })
      );

      // 3. Obtener cursos para la pestaña seleccionada
      let displayedCourses = [];
      if (currentTab === 'all') {
        displayedCourses = [...inProgress, ...completed, ...onHold];
      } else if (currentTab === 'in_progress') {
        displayedCourses = inProgress;
      } else if (currentTab === 'completed') {
        displayedCourses = completed;
      } else if (currentTab === 'on_hold') {
        displayedCourses = onHold;
      }

      // 4. Renderizar tarjetas o estado vacío
      clearElement(grid);

      if (displayedCourses.length === 0) {
        let emptyTitle = 'No tienes cursos en esta categoría';
        let emptyDesc = 'Explora el catálogo libre y comienza a desarrollar habilidades hoy.';
        let emptyIcon = 'fa-solid fa-box-open';

        if (currentTab === 'in_progress') {
          emptyTitle = 'No tienes cursos en progreso actualmente';
          emptyDesc = '¡Tienes 3 cupos disponibles! Elige un curso del catálogo y empieza a aprender.';
          emptyIcon = 'fa-solid fa-compass';
        } else if (currentTab === 'completed') {
          emptyTitle = 'Aún no has terminado ningún curso';
          emptyDesc = 'Completa todas las lecciones de un curso en progreso para recibir tu reconocimiento.';
          emptyIcon = 'fa-solid fa-award';
        } else if (currentTab === 'on_hold') {
          emptyTitle = 'No tienes cursos en espera';
          emptyDesc = 'Puedes poner en pausa cursos en cualquier momento para liberar cupos de aprendizaje.';
          emptyIcon = 'fa-solid fa-circle-pause';
        }

        grid.appendChild(
          el('div', { className: 'library-empty-box' },
            el('div', { className: 'empty-icon-wrap' }, icon(emptyIcon)),
            el('h3', { className: 'library-empty-title', textContent: emptyTitle }),
            el('p', { className: 'library-empty-desc', textContent: emptyDesc }),
            el('a', { href: '#/courses', className: 'btn btn-primary btn-sm' },
              icon('fa-solid fa-graduation-cap'),
              ' Explorar Catálogo de Cursos'
            )
          )
        );
      } else {
        displayedCourses.forEach(course => {
          grid.appendChild(createLibraryCard(course, allCourses, () => renderView()));
        });
      }

      libraryContainer.append(heroHeader, tabsBar, grid);
    }

    renderView();
    clearElement(container);
    container.appendChild(libraryContainer);

    // Escuchar eventos globales de sincronización y progreso
    const onLibraryStateChange = () => {
      if (document.body.contains(grid)) {
        renderView();
      } else {
        window.removeEventListener('eduxp:progress-updated', onLibraryStateChange);
        window.removeEventListener('eduxp:auth-changed', onLibraryStateChange);
        window.removeEventListener('eduxp:cloud-synced', onLibraryStateChange);
      }
    };

    window.addEventListener('eduxp:progress-updated', onLibraryStateChange);
    window.addEventListener('eduxp:auth-changed', onLibraryStateChange);
    window.addEventListener('eduxp:cloud-synced', onLibraryStateChange);

  } catch (err) {
    clearElement(container);
    container.appendChild(
      el('div', { className: 'container' },
        el('div', { className: 'settings-box' },
          el('h2', { className: 'text-danger' },
            icon('fa-solid fa-triangle-exclamation'),
            ' Error al cargar tu biblioteca'
          ),
          el('p', { textContent: err.message }),
          el('a', { href: '#/courses', className: 'btn btn-primary btn-sm' }, 'Regresar al catálogo')
        )
      )
    );
  }
}

/**
 * Crea una tarjeta interactiva para la biblioteca
 */
function createLibraryCard(course, allCourses, onRefresh) {
  const { status, stats } = course;
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isOnHold = status === 'on_hold';

  // Insignia de estado
  let statusBadge = null;
  if (isCompleted) {
    statusBadge = createBadge({ text: 'Terminado', theme: 'cyan', iconClass: 'fa-solid fa-circle-check' });
  } else if (isInProgress) {
    statusBadge = createBadge({ text: 'En Progreso', theme: 'mint', iconClass: 'fa-solid fa-bolt' });
  } else {
    statusBadge = createBadge({ text: 'En Espera', theme: 'yellow', iconClass: 'fa-solid fa-pause' });
  }

  // Barra de progreso
  const progressBar = createProgressBar({
    percentage: stats.percentage,
    completed: stats.completed,
    total: course.totalLessons || stats.total,
    showLabels: true
  });

  // Botones de acción según el estado
  let primaryActionBtn = null;
  let secondaryActionBtn = null;

  if (isCompleted) {
    primaryActionBtn = el('a', {
      href: `#/course/${course.slug}`,
      className: 'btn btn-outline btn-sm'
    },
      icon('fa-solid fa-rotate-left'),
      ' Repasar'
    );
  } else if (isInProgress) {
    primaryActionBtn = el('a', {
      href: `#/course/${course.slug}`,
      className: 'btn btn-primary btn-sm'
    },
      icon('fa-solid fa-play'),
      ' Continuar'
    );

    secondaryActionBtn = el('button', {
      type: 'button',
      className: 'btn btn-ghost btn-sm library-secondary-btn text-danger',
      title: 'Cancelar curso y perder progreso para liberar cupo',
      onClick: async () => {
        const confirmed = window.confirm(
          `¿Estás seguro de cancelar "${course.title}"?\n\n⚠️ Atención: Perderás todo el progreso acumulado (${stats.percentage}%) para liberar el cupo. (Los cursos terminados no se afectan).`
        );
        if (confirmed) {
          await store.cancelCourseAndResetProgress(course.slug, course.totalLessons || 0);
          showToast(`"${course.title}" cancelado. Cupo liberado y progreso reiniciado a 0%.`, 'warning');
          onRefresh();
        }
      }
    },
      icon('fa-solid fa-trash-can text-danger'),
      ' Cancelar'
    );
  } else if (isOnHold) {
    primaryActionBtn = el('button', {
      type: 'button',
      className: 'btn btn-secondary btn-sm',
      onClick: () => {
        const check = store.canStartOrResumeCourse(course.slug, allCourses);
        if (!check.allowed) {
          // Límite alcanzado: mostrar modal para elegir cuál cancelar perdiendo su avance
          const activeCourses = allCourses.filter(c => check.activeSlugs.includes(c.slug));
          openCourseLimitModal({
            courseToStart: course,
            activeCourses,
            onProceed: () => onRefresh()
          });
        } else {
          store.setCourseStatus(course.slug, 'in_progress');
          showToast(`"${course.title}" activado a En Progreso.`, 'success');
          onRefresh();
        }
      }
    },
      icon('fa-solid fa-play text-mint'),
      ' Activar'
    );

    secondaryActionBtn = el('a', {
      href: `#/course/${course.slug}`,
      className: 'btn btn-ghost btn-sm library-secondary-btn text-dim',
      title: 'Ver temario del curso'
    },
      icon('fa-solid fa-list-ol'),
      ' Temario'
    );
  }

  const header = el('div', { className: 'library-card-header' },
    el('div', { className: 'card-icon-bubble', style: { width: '38px', height: '38px', fontSize: '1.1rem' } },
      icon(course.icon || 'fa-solid fa-code')
    ),
    statusBadge
  );

  const body = el('div', { className: 'library-card-body' },
    el('h3', { className: 'library-course-title', textContent: course.title }),
    el('div', { className: 'library-card-meta' },
      el('span', {}, icon('fa-solid fa-tag text-dim'), ` ${course.category || 'Desarrollo'}`),
      el('span', {}, icon('fa-regular fa-clock text-dim'), ` ${course.duration || 'Flexible'}`)
    ),
    progressBar
  );

  const actions = el('div', { className: 'library-card-actions' },
    secondaryActionBtn || el('div'),
    primaryActionBtn
  );

  return el('article', { className: 'library-course-card' },
    header,
    body,
    actions
  );
}
