/**
 * EduXP - Vista de Detalle de Curso (Course Detail / Syllabus)
 */

import { api } from '../api.js';
import { store } from '../store.js';

export async function renderCourseDetail(container, courseSlug) {
  container.innerHTML = `<div class="app-loader"><div class="loader-spinner"></div></div>`;

  try {
    const course = await api.getCourse(courseSlug);
    
    // Contar total de lecciones
    let totalLessonsCount = 0;
    let firstLesson = null;
    let nextUncompletedLesson = null;

    course.modules.forEach(mod => {
      mod.lessons.forEach(les => {
        totalLessonsCount++;
        if (!firstLesson) firstLesson = les;
        if (!nextUncompletedLesson && !store.isLessonCompleted(courseSlug, les.id)) {
          nextUncompletedLesson = les;
        }
      });
    });

    const stats = store.getCourseStats(courseSlug, totalLessonsCount);
    const lastVisited = store.getLastVisited(courseSlug);
    
    // Determinar la lección a la que enviar al hacer click en el CTA principal
    const targetLesson = lastVisited 
      ? findLessonById(course.modules, lastVisited) || nextUncompletedLesson || firstLesson
      : nextUncompletedLesson || firstLesson;

    const badgeTheme = course.badgeColor || 'mint';
    const iconClass = course.icon || 'fa-solid fa-code';

    container.innerHTML = `
      <!-- Cabecera del Curso -->
      <section class="course-detail-header">
        <div class="course-header-grid">
          <div class="course-info-col">
            <a href="#/courses" class="btn btn-ghost btn-sm" style="margin-bottom: 0.5rem; padding-left: 0;">
              <i class="fa-solid fa-arrow-left"></i> Volver al Catálogo
            </a>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
              <span class="badge badge-${badgeTheme}">${course.level || 'Todos los niveles'}</span>
              <span class="badge badge-cyan">${course.category || 'Desarrollo'}</span>
            </div>
            <h1>${course.title}</h1>
            <p class="course-full-desc">${course.description}</p>
            <div class="course-meta-pills">
              <div class="meta-pill">
                <i class="fa-regular fa-clock text-mint"></i>
                <span>${course.duration || 'Flexible'}</span>
              </div>
              <div class="meta-pill">
                <i class="fa-solid fa-book-open text-cyan"></i>
                <span>${course.modules.length} Módulos • ${totalLessonsCount} Lecciones</span>
              </div>
              <div class="meta-pill">
                <i class="fa-brands fa-markdown text-mint"></i>
                <span>Lecciones en Markdown</span>
              </div>
            </div>
          </div>

          <!-- Tarjeta de Acción / Progreso -->
          <div class="course-cta-card">
            <div class="cta-progress-box">
              <div class="progress-text-row" style="margin-top: 0; margin-bottom: 0.5rem;">
                <span style="color: var(--text-main); font-weight: 700;">Tu Avance</span>
                <span class="text-mint">${stats.percentage}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${stats.percentage}%;"></div>
              </div>
              <p style="font-size: 0.775rem; color: var(--text-dim); margin-top: 0.5rem;">
                ${stats.completed} de ${totalLessonsCount} lecciones completadas
              </p>
            </div>

            ${targetLesson ? `
              <a href="#/course/${courseSlug}/lesson/${targetLesson.id}" class="btn btn-primary btn-block btn-lg">
                <i class="fa-solid fa-play"></i> ${stats.completed > 0 ? 'Continuar Lección' : 'Comenzar Ahora'}
              </a>
              <p style="font-size: 0.75rem; color: var(--text-dim); text-align: center; margin-top: 0.5rem;">
                Próxima: <strong>${targetLesson.title}</strong>
              </p>
            ` : `
              <p class="text-mint" style="text-align: center; font-weight: 600;">
                <i class="fa-solid fa-circle-check"></i> ¡Has completado este curso!
              </p>
            `}
          </div>
        </div>
      </section>

      <!-- Temario Detallado (Syllabus) -->
      <section class="syllabus-container">
        <div class="section-header">
          <div>
            <h2 class="section-title"><i class="fa-solid fa-list-ol text-mint"></i> Contenido del Curso</h2>
            <p class="section-desc">Explora las lecciones y temas cubiertos en cada módulo.</p>
          </div>
        </div>

        <div class="modules-accordion">
          ${course.modules.map((mod, modIdx) => renderModuleCard(courseSlug, mod, modIdx)).join('')}
        </div>
      </section>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="container">
        <div class="settings-box">
          <h2 class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error al cargar el curso</h2>
          <p>${err.message}</p>
          <a href="#/courses" class="btn btn-primary btn-sm">Regresar al catálogo</a>
        </div>
      </div>
    `;
  }
}

function renderModuleCard(courseSlug, mod, modIdx) {
  return `
    <div class="module-card">
      <div class="module-header">
        <div class="module-title">
          <span style="color: var(--mint-primary); font-size: 0.85rem; font-family: var(--font-mono);">MOD ${modIdx + 1}</span>
          <span>${mod.title}</span>
        </div>
        <span class="module-counter">${mod.lessons.length} lecciones</span>
      </div>
      <ul class="lessons-list">
        ${mod.lessons.map(lesson => {
          const isCompleted = store.isLessonCompleted(courseSlug, lesson.id);
          return `
            <li class="lesson-item-row">
              <div class="lesson-main-info">
                <div class="lesson-status-icon ${isCompleted ? 'completed' : ''}" title="${isCompleted ? 'Lección completada' : 'Pendiente'}">
                  <i class="fa-solid ${isCompleted ? 'fa-check' : 'fa-play'}"></i>
                </div>
                <a href="#/course/${courseSlug}/lesson/${lesson.id}" class="lesson-title-link">
                  ${lesson.title}
                </a>
              </div>
              <div class="lesson-item-meta">
                <span><i class="fa-regular fa-clock"></i> ${lesson.duration || '10 min'}</span>
                <a href="#/course/${courseSlug}/lesson/${lesson.id}" class="btn btn-ghost btn-sm" title="Ir a la lección">
                  <i class="fa-solid fa-chevron-right"></i>
                </a>
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;
}

function findLessonById(modules, lessonId) {
  for (const mod of modules) {
    const found = mod.lessons.find(l => l.id === lessonId);
    if (found) return found;
  }
  return null;
}
