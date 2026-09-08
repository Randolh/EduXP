/**
 * EduXP - Vista del Visor de Lección (Lesson Viewer)
 * Implementada 100% con la API nativa de JavaScript DOM (sin innerHTML)
 */

import { api } from '../api.js';
import { store } from '../store.js';
import { renderMarkdown, enhanceCodeBlocks } from '../utils/markdown.js';
import { el, clearElement, icon, createLoader, parseHtmlFragment } from '../utils/dom.js';

export async function renderLesson(container, courseSlug, lessonId) {
  clearElement(container);
  container.appendChild(createLoader('Cargando lección...'));

  try {
    const course = await api.getCourse(courseSlug);

    // Aplanar todas las lecciones en orden para facilitar navegación
    const flattenedLessons = [];
    course.modules.forEach((mod, modIdx) => {
      mod.lessons.forEach(l => {
        flattenedLessons.push({
          ...l,
          moduleTitle: mod.title,
          moduleIndex: modIdx + 1
        });
      });
    });

    const currentIndex = flattenedLessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) {
      throw new Error(`La lección "${lessonId}" no existe en el curso ${course.title}.`);
    }

    const currentLesson = flattenedLessons[currentIndex];
    const prevLesson = currentIndex > 0 ? flattenedLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < flattenedLessons.length - 1 ? flattenedLessons[currentIndex + 1] : null;

    // Registrar como última lección visitada
    store.setLastVisited(courseSlug, lessonId);

    // Obtener y parsear el Markdown
    const markdownRaw = await api.getLessonMarkdown(courseSlug, currentLesson.file);
    const parsedHtml = renderMarkdown(markdownRaw);

    const isCompleted = store.isLessonCompleted(courseSlug, lessonId);
    const stats = store.getCourseStats(courseSlug, flattenedLessons.length);

    // 1. Elementos reactivos de estado en Sidebar
    const progressBarFill = el('div', {
      className: 'progress-fill',
      id: 'sidebar-progress-bar',
      style: { width: `${stats.percentage}%` }
    });

    const progressLabel = el('span', {
      id: 'sidebar-progress-label',
      textContent: `${stats.percentage}% completado`
    });

    const progressCount = el('span', {
      id: 'sidebar-progress-count',
      textContent: `${stats.completed}/${stats.total}`
    });

    // 2. Construir Sidebar con Módulos y Lecciones
    const sidebar = el('aside', { className: 'viewer-sidebar', id: 'viewer-sidebar' },
      el('div', { className: 'viewer-sidebar-header' },
        el('a', { href: `#/course/${courseSlug}`, className: 'back-to-course-link' },
          icon('fa-solid fa-arrow-left'),
          ' Volver al curso'
        ),
        el('h2', { className: 'viewer-course-title', textContent: course.title }),
        el('div', { className: 'sidebar-progress-wrap' },
          el('div', { className: 'progress-track' }, progressBarFill),
          el('div', { className: 'progress-text-row' }, progressLabel, progressCount)
        )
      ),

      el('div', { className: 'viewer-modules-tree' },
        course.modules.map((mod, modIdx) =>
          el('div', { className: 'sidebar-module-group' },
            el('div', {
              className: 'sidebar-module-title',
              textContent: `Módulo ${modIdx + 1}: ${mod.title}`
            }),
            mod.lessons.map(les => {
              const lesCompleted = store.isLessonCompleted(courseSlug, les.id);
              const isCurrent = les.id === lessonId;

              return el('a', {
                href: `#/course/${courseSlug}/lesson/${les.id}`,
                className: `sidebar-lesson-item ${isCurrent ? 'active' : ''}`,
                dataset: { lessonId: les.id }
              },
                el('div', { className: `sidebar-lesson-icon ${lesCompleted ? 'completed' : ''}` },
                  icon(`fa-solid ${lesCompleted ? 'fa-check' : 'fa-play'}`)
                ),
                el('span', { className: 'sidebar-lesson-title', textContent: les.title })
              );
            })
          )
        )
      )
    );

    // 3. Botón de Completar Lección
    const completeBtnIcon = icon(`fa-solid ${isCompleted ? 'fa-check-circle' : 'fa-circle'}`);
    const completeBtnText = el('span', {
      id: 'complete-btn-text',
      textContent: isCompleted ? 'Completada' : 'Marcar como lista'
    });

    const completeBtn = el('button', {
      className: `btn ${isCompleted ? 'btn-outline' : 'btn-primary'} btn-sm`,
      id: 'complete-toggle-btn'
    }, completeBtnIcon, completeBtnText);

    // 4. Contenedor de Artículo Markdown
    const articleContainer = el('article', { className: 'markdown-body', id: 'markdown-container' });
    articleContainer.appendChild(parseHtmlFragment(parsedHtml));

    // 5. Navegación inferior Prev / Next
    const prevNav = prevLesson
      ? el('a', { href: `#/course/${courseSlug}/lesson/${prevLesson.id}`, className: 'nav-direction-btn prev' },
          el('span', { className: 'nav-direction-label' }, icon('fa-solid fa-arrow-left'), ' Lección Anterior'),
          el('span', { className: 'nav-direction-title', textContent: prevLesson.title })
        )
      : el('div');

    const nextNav = nextLesson
      ? el('a', { href: `#/course/${courseSlug}/lesson/${nextLesson.id}`, className: 'nav-direction-btn next' },
          el('span', { className: 'nav-direction-label' }, 'Siguiente Lección ', icon('fa-solid fa-arrow-right')),
          el('span', { className: 'nav-direction-title', textContent: nextLesson.title })
        )
      : el('a', { href: `#/course/${courseSlug}`, className: 'nav-direction-btn next' },
          el('span', { className: 'nav-direction-label' }, 'Fin del curso ', icon('fa-solid fa-trophy', 'text-mint')),
          el('span', { className: 'nav-direction-title', textContent: '¡Ver resumen final!' })
        );

    // 6. Contenido Principal del Visor
    const mainContent = el('div', { className: 'viewer-main' },
      el('div', { className: 'viewer-top-bar' },
        el('div', { className: 'viewer-breadcrumbs' },
          el('a', { href: '#/courses', textContent: 'Cursos' }),
          icon('fa-solid fa-angle-right'),
          el('a', { href: `#/course/${courseSlug}`, textContent: course.title }),
          icon('fa-solid fa-angle-right'),
          el('span', { textContent: currentLesson.title })
        ),
        el('div', { className: 'viewer-actions' }, completeBtn)
      ),

      el('header', { className: 'viewer-header' },
        el('h1', { className: 'viewer-lesson-title', textContent: currentLesson.title }),
        el('div', { className: 'viewer-lesson-meta' },
          el('span', {}, icon('fa-regular fa-clock'), ` Tiempo estimado: ${currentLesson.duration || '10 min'}`),
          el('span', {}, icon('fa-solid fa-layer-group'), ` ${currentLesson.moduleTitle}`),
          currentLesson.xp ? el('span', { className: 'badge badge-mint' }, icon('fa-solid fa-bolt'), ` +${currentLesson.xp} XP`) : null
        )
      ),

      articleContainer,

      el('footer', { className: 'viewer-navigation-footer' }, prevNav, nextNav)
    );

    // 7. Botón móvil de sidebar
    const mobileSidebarToggle = el('button', {
      className: 'sidebar-mobile-btn',
      id: 'mobile-sidebar-toggle',
      title: 'Abrir temario'
    }, icon('fa-solid fa-bars'));

    mobileSidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });

    // 8. Evento del botón de Completar
    completeBtn.addEventListener('click', () => {
      const isNowCompleted = store.toggleLessonCompleted(courseSlug, lessonId);

      completeBtn.className = `btn ${isNowCompleted ? 'btn-outline' : 'btn-primary'} btn-sm`;
      completeBtnIcon.className = `fa-solid ${isNowCompleted ? 'fa-check-circle' : 'fa-circle'}`;
      completeBtnText.textContent = isNowCompleted ? 'Completada' : 'Marcar como lista';

      // Actualizar icono en el sidebar
      const sidebarItem = sidebar.querySelector(`.sidebar-lesson-item[data-lesson-id="${lessonId}"]`);
      if (sidebarItem) {
        const iconWrap = sidebarItem.querySelector('.sidebar-lesson-icon');
        clearElement(iconWrap);
        if (isNowCompleted) {
          iconWrap.className = 'sidebar-lesson-icon completed';
          iconWrap.appendChild(icon('fa-solid fa-check'));
        } else {
          iconWrap.className = 'sidebar-lesson-icon';
          iconWrap.appendChild(icon('fa-solid fa-play'));
        }
      }

      // Actualizar progreso reactivo
      const updatedStats = store.getCourseStats(courseSlug, flattenedLessons.length);
      progressBarFill.style.width = `${updatedStats.percentage}%`;
      progressLabel.textContent = `${updatedStats.percentage}% completado`;
      progressCount.textContent = `${updatedStats.completed}/${updatedStats.total}`;

      showToast(isNowCompleted ? '¡Lección completada! Progreso guardado.' : 'Lección desmarcada.', 'success');
    });

    // Ensamblar en contenedor principal
    clearElement(container);
    const viewerLayout = el('div', { className: 'viewer-layout' }, sidebar, mainContent);
    container.append(viewerLayout, mobileSidebarToggle);

    // Enriquecer bloques de código con cabecera y Prism
    enhanceCodeBlocks(articleContainer);

  } catch (err) {
    clearElement(container);
    container.appendChild(
      el('div', { className: 'container' },
        el('div', { className: 'settings-box' },
          el('h2', { className: 'text-danger' },
            icon('fa-solid fa-triangle-exclamation'),
            ' Error al cargar la lección'
          ),
          el('p', { textContent: err.message }),
          el('a', { href: `#/course/${courseSlug}`, className: 'btn btn-primary btn-sm' }, 'Regresar al temario del curso')
        )
      )
    );
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = el('div', { className: `toast toast-${type}` },
    icon(type === 'success' ? 'fa-solid fa-check' : 'fa-solid fa-info-circle', type === 'success' ? 'text-mint' : 'text-cyan'),
    el('span', { textContent: message })
  );

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
