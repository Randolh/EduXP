/**
 * EduXP - Vista del Visor de Lección (Lesson Viewer)
 * Implementada 100% con la API nativa de JavaScript DOM (sin innerHTML)
 * Utiliza componentes modulares SidebarLessonItem, ProgressBar, Breadcrumbs y Toast
 */

import { api } from '../api.js';
import { store } from '../store.js';
import { renderMarkdown, enhanceCodeBlocks, enhanceQuizzes } from '../utils/markdown.js';
import { el, clearElement, icon, createLoader, parseHtmlFragment } from '../utils/dom.js';
import {
  createSidebarLessonItem,
  createProgressBar,
  updateProgressBar,
  createBreadcrumbs,
  showToast,
  openAuthModal
} from '../components/index.js';

export async function renderLesson(container, courseSlug, lessonId) {
  clearElement(container);
  container.appendChild(createLoader('Cargando lección...'));

  try {
    await store.waitForAuth();
    if (!store.isAuthenticated()) {
      window.location.hash = `#/course/${courseSlug}`;
      openAuthModal('login', 'Debes iniciar sesión para acceder a las lecciones y registrar tu progreso.');
      return;
    }

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
    const parsedHtml = renderMarkdown(markdownRaw, courseSlug);

    const isCompleted = store.isLessonCompleted(courseSlug, lessonId);
    const stats = store.getCourseStats(courseSlug, flattenedLessons.length);

    // 1. Barra de progreso modular en Sidebar
    const sidebarProgressBar = createProgressBar({
      percentage: stats.percentage,
      completed: stats.completed,
      total: stats.total,
      showLabels: true,
      fillId: 'sidebar-progress-bar',
      labelId: 'sidebar-progress-label',
      countId: 'sidebar-progress-count'
    });
    sidebarProgressBar.classList.add('sidebar-progress-wrap');

    // 2. Construir Sidebar con Módulos y Lecciones usando SidebarLessonItem
    const modulesTree = el('div', { className: 'viewer-modules-tree' },
      course.modules.map((mod, modIdx) =>
        el('div', { className: 'sidebar-module-group' },
          el('div', {
            className: 'sidebar-module-title',
            textContent: `Módulo ${modIdx + 1}: ${mod.title}`
          }),
          mod.lessons.map(les => {
            const lesCompleted = store.isLessonCompleted(courseSlug, les.id);
            const isCurrent = les.id === lessonId;

            const item = createSidebarLessonItem({
              lesson: les,
              courseSlug,
              isActive: isCurrent,
              isCompleted: lesCompleted
            });
            item.dataset.lessonId = les.id;
            return item;
          })
        )
      )
    );

    const sidebar = el('aside', { className: 'viewer-sidebar', id: 'viewer-sidebar' },
      el('div', { className: 'viewer-sidebar-header' },
        el('a', { href: `#/course/${courseSlug}`, className: 'back-to-course-link' },
          icon('fa-solid fa-arrow-left'),
          ' Volver al curso'
        ),
        el('h2', { className: 'viewer-course-title', textContent: course.title }),
        sidebarProgressBar
      ),
      modulesTree
    );

    // 3. Botón de Completar Lección
    const completeBtnIcon = icon(isCompleted ? 'fa-solid fa-circle-check text-mint' : 'fa-regular fa-circle-check');
    const completeBtnText = el('span', {
      id: 'complete-btn-text',
      textContent: isCompleted ? '¡Completada!' : 'Marcar como completada'
    });

    const completeBtn = el('button', {
      className: `btn ${isCompleted ? 'btn-outline' : 'btn-secondary'} btn-sm`,
      id: 'complete-toggle-btn',
      title: isCompleted ? 'Hacer clic para desmarcar lección' : 'Hacer clic para marcar como completada'
    }, completeBtnIcon, completeBtnText);

    // 4. Contenedor de Artículo Markdown
    const articleContainer = el('article', { className: 'markdown-body', id: 'markdown-container' });
    articleContainer.appendChild(parseHtmlFragment(parsedHtml));

    // 5. Navegación inferior Prev / Next
    const prevNav = prevLesson
      ? el('a', { href: `#/course/${courseSlug}/lesson/${prevLesson.id}`, className: 'nav-lesson-btn prev' },
          el('span', { className: 'nav-btn-direction' }, icon('fa-solid fa-arrow-left'), ' Lección Anterior'),
          el('span', { className: 'nav-btn-title', textContent: prevLesson.title })
        )
      : el('div');

    const nextNav = nextLesson
      ? el('a', { href: `#/course/${courseSlug}/lesson/${nextLesson.id}`, className: 'nav-lesson-btn next' },
          el('span', { className: 'nav-btn-direction' }, 'Siguiente Lección ', icon('fa-solid fa-arrow-right')),
          el('span', { className: 'nav-btn-title', textContent: nextLesson.title })
        )
      : el('a', { href: `#/course/${courseSlug}`, className: 'nav-lesson-btn next' },
          el('span', { className: 'nav-btn-direction' }, 'Fin del curso ', icon('fa-solid fa-trophy', 'text-mint')),
          el('span', { className: 'nav-btn-title', textContent: '¡Ver resumen final!' })
        );

    // 6. Breadcrumbs modulares
    const breadcrumbs = createBreadcrumbs([
      { label: 'Cursos', href: '#/courses' },
      { label: course.title, href: `#/course/${courseSlug}` },
      { label: currentLesson.title }
    ]);

    // 7. Contenido Principal del Visor
    const mainContent = el('div', { className: 'viewer-main' },
      el('div', { className: 'viewer-top-bar' },
        breadcrumbs,
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

      el('footer', { className: 'viewer-bottom-nav' }, prevNav, nextNav)
    );

    // 8. Botón móvil de sidebar
    const mobileSidebarToggle = el('button', {
      className: 'sidebar-mobile-toggle',
      id: 'mobile-sidebar-toggle',
      title: 'Abrir temario'
    }, icon('fa-solid fa-bars'));

    mobileSidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });

    // 9. Evento del botón de Completar
    completeBtn.addEventListener('click', () => {
      const isNowCompleted = store.toggleLessonCompleted(courseSlug, lessonId);

      completeBtn.className = `btn ${isNowCompleted ? 'btn-outline' : 'btn-secondary'} btn-sm`;
      completeBtn.title = isNowCompleted ? 'Hacer clic para desmarcar lección' : 'Hacer clic para marcar como completada';
      completeBtnIcon.className = isNowCompleted ? 'fa-solid fa-circle-check text-mint' : 'fa-regular fa-circle-check';
      completeBtnText.textContent = isNowCompleted ? '¡Completada!' : 'Marcar como completada';

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

      // Actualizar barra de progreso modular
      const updatedStats = store.getCourseStats(courseSlug, flattenedLessons.length);
      updateProgressBar(sidebarProgressBar, updatedStats);

      showToast(
        isNowCompleted ? '¡Lección completada! Progreso guardado.' : 'Lección desmarcada.',
        'success'
      );
    });

    // Ensamblar en contenedor principal
    clearElement(container);
    const viewerLayout = el('div', { className: 'viewer-layout' }, sidebar, mainContent);
    container.append(viewerLayout, mobileSidebarToggle);

    // Enriquecer bloques de código con cabecera interactiva y Prism
    enhanceCodeBlocks(articleContainer);

    // Enriquecer quizzes interactivos de autoevaluación
    enhanceQuizzes(articleContainer);

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
