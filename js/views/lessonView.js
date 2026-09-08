/**
 * EduXP - Vista del Visor de Lección (Lesson Viewer)
 * Renderiza el Markdown de la lección con barra lateral de navegación y controles interactivos.
 */

import { api } from '../api.js';
import { store } from '../store.js';
import { renderMarkdown, enhanceCodeBlocks } from '../utils/markdown.js';

export async function renderLesson(container, courseSlug, lessonId) {
  container.innerHTML = `<div class="app-loader"><div class="loader-spinner"></div><p class="loader-text">Cargando lección...</p></div>`;

  try {
    const course = await api.getCourse(courseSlug);
    
    // Aplanar todas las lecciones en orden para facilitar navegación anterior / siguiente
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

    // Obtener el contenido Markdown crudo
    const markdownRaw = await api.getLessonMarkdown(courseSlug, currentLesson.file);
    const parsedHtml = renderMarkdown(markdownRaw);

    const isCompleted = store.isLessonCompleted(courseSlug, lessonId);
    const stats = store.getCourseStats(courseSlug, flattenedLessons.length);

    container.innerHTML = `
      <div class="viewer-layout">
        <!-- Sidebar del Temario -->
        <aside class="viewer-sidebar" id="viewer-sidebar">
          <div class="viewer-sidebar-header">
            <a href="#/course/${courseSlug}" class="back-to-course-link">
              <i class="fa-solid fa-arrow-left"></i> Volver al curso
            </a>
            <h2 class="viewer-course-title">${course.title}</h2>
            
            <div class="sidebar-progress-wrap">
              <div class="progress-track">
                <div class="progress-fill" id="sidebar-progress-bar" style="width: ${stats.percentage}%;"></div>
              </div>
              <div class="progress-text-row">
                <span id="sidebar-progress-label">${stats.percentage}% completado</span>
                <span id="sidebar-progress-count">${stats.completed}/${stats.total}</span>
              </div>
            </div>
          </div>

          <!-- Árbol de módulos y lecciones -->
          <div class="viewer-modules-tree">
            ${course.modules.map((mod, modIdx) => `
              <div class="sidebar-module-group">
                <div class="sidebar-module-title">Módulo ${modIdx + 1}: ${mod.title}</div>
                ${mod.lessons.map(les => {
                  const lesCompleted = store.isLessonCompleted(courseSlug, les.id);
                  const isCurrent = les.id === lessonId;
                  return `
                    <a href="#/course/${courseSlug}/lesson/${les.id}" class="sidebar-lesson-item ${isCurrent ? 'active' : ''}" data-lesson-id="${les.id}">
                      <div class="sidebar-lesson-icon ${lesCompleted ? 'completed' : ''}">
                        <i class="fa-solid ${lesCompleted ? 'fa-check' : 'fa-play'}"></i>
                      </div>
                      <span class="sidebar-lesson-title">${les.title}</span>
                    </a>
                  `;
                }).join('')}
              </div>
            `).join('')}
          </div>
        </aside>

        <!-- Contenido Principal -->
        <div class="viewer-main">
          <!-- Top Bar con Breadcrumbs y acción de completado -->
          <div class="viewer-top-bar">
            <div class="viewer-breadcrumbs">
              <a href="#/courses">Cursos</a>
              <i class="fa-solid fa-angle-right"></i>
              <a href="#/course/${courseSlug}">${course.title}</a>
              <i class="fa-solid fa-angle-right"></i>
              <span>${currentLesson.title}</span>
            </div>

            <div class="viewer-actions">
              <button class="btn ${isCompleted ? 'btn-outline' : 'btn-primary'} btn-sm" id="complete-toggle-btn">
                <i class="fa-solid ${isCompleted ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span id="complete-btn-text">${isCompleted ? 'Completada' : 'Marcar como lista'}</span>
              </button>
            </div>
          </div>

          <!-- Cabecera de la Lección -->
          <header class="viewer-header">
            <h1 class="viewer-lesson-title">${currentLesson.title}</h1>
            <div class="viewer-lesson-meta">
              <span><i class="fa-regular fa-clock"></i> Tiempo estimado: ${currentLesson.duration || '10 min'}</span>
              <span><i class="fa-solid fa-layer-group"></i> ${currentLesson.moduleTitle}</span>
              ${currentLesson.xp ? `<span class="badge badge-mint"><i class="fa-solid fa-bolt"></i> +${currentLesson.xp} XP</span>` : ''}
            </div>
          </header>

          <!-- Cuerpo Renderizado en Markdown -->
          <article class="markdown-body" id="markdown-container">
            ${parsedHtml}
          </article>

          <!-- Navegación Inferior (Prev / Next) -->
          <footer class="viewer-navigation-footer">
            ${prevLesson ? `
              <a href="#/course/${courseSlug}/lesson/${prevLesson.id}" class="nav-direction-btn prev">
                <span class="nav-direction-label"><i class="fa-solid fa-arrow-left"></i> Lección Anterior</span>
                <span class="nav-direction-title">${prevLesson.title}</span>
              </a>
            ` : '<div></div>'}

            ${nextLesson ? `
              <a href="#/course/${courseSlug}/lesson/${nextLesson.id}" class="nav-direction-btn next">
                <span class="nav-direction-label">Siguiente Lección <i class="fa-solid fa-arrow-right"></i></span>
                <span class="nav-direction-title">${nextLesson.title}</span>
              </a>
            ` : `
              <a href="#/course/${courseSlug}" class="nav-direction-btn next">
                <span class="nav-direction-label">Fin del curso <i class="fa-solid fa-trophy text-mint"></i></span>
                <span class="nav-direction-title">¡Ver resumen final!</span>
              </a>
            `}
          </footer>
        </div>
      </div>

      <!-- Botón flotante para móviles -->
      <button class="sidebar-mobile-btn" id="mobile-sidebar-toggle" title="Abrir temario">
        <i class="fa-solid fa-bars"></i>
      </button>
    `;

    // Enriquecer bloques de código y resaltar sintaxis con Prism
    const mdContainer = container.querySelector('#markdown-container');
    enhanceCodeBlocks(mdContainer);

    // Configurar botón toggle completado
    const completeBtn = container.querySelector('#complete-toggle-btn');
    const completeBtnText = container.querySelector('#complete-btn-text');

    completeBtn.addEventListener('click', () => {
      const isNowCompleted = store.toggleLessonCompleted(courseSlug, lessonId);
      
      // Actualizar estilo del botón
      completeBtn.className = `btn ${isNowCompleted ? 'btn-outline' : 'btn-primary'} btn-sm`;
      completeBtn.querySelector('i').className = `fa-solid ${isNowCompleted ? 'fa-check-circle' : 'fa-circle'}`;
      completeBtnText.textContent = isNowCompleted ? 'Completada' : 'Marcar como lista';

      // Actualizar icono en el sidebar correspondiente
      const sidebarItem = container.querySelector(`.sidebar-lesson-item[data-lesson-id="${lessonId}"]`);
      if (sidebarItem) {
        const iconWrap = sidebarItem.querySelector('.sidebar-lesson-icon');
        if (isNowCompleted) {
          iconWrap.classList.add('completed');
          iconWrap.innerHTML = `<i class="fa-solid fa-check"></i>`;
        } else {
          iconWrap.classList.remove('completed');
          iconWrap.innerHTML = `<i class="fa-solid fa-play"></i>`;
        }
      }

      // Actualizar barra de progreso del sidebar
      const updatedStats = store.getCourseStats(courseSlug, flattenedLessons.length);
      container.querySelector('#sidebar-progress-bar').style.width = `${updatedStats.percentage}%`;
      container.querySelector('#sidebar-progress-label').textContent = `${updatedStats.percentage}% completado`;
      container.querySelector('#sidebar-progress-count').textContent = `${updatedStats.completed}/${updatedStats.total}`;

      // Mostrar toast
      showToast(isNowCompleted ? '¡Lección completada! Progreso guardado.' : 'Lección desmarcada.', 'success');
    });

    // Control móvil del sidebar
    const mobileSidebarToggle = container.querySelector('#mobile-sidebar-toggle');
    const sidebar = container.querySelector('#viewer-sidebar');
    if (mobileSidebarToggle && sidebar) {
      mobileSidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
      });
    }

  } catch (err) {
    container.innerHTML = `
      <div class="container">
        <div class="settings-box">
          <h2 class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error al cargar la lección</h2>
          <p>${err.message}</p>
          <a href="#/course/${courseSlug}" class="btn btn-primary btn-sm">Regresar al temario del curso</a>
        </div>
      </div>
    `;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-check text-mint' : 'fa-info-circle text-cyan'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
