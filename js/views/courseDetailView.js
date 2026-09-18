/**
 * EduXP - Vista de Detalle de Curso (Course Detail / Syllabus)
 * Construcción declarativa 100% nativa con la API del DOM (sin innerHTML)
 * Utiliza componentes modulares ModuleCard, LessonRow, ProgressBar y Badge
 */

import { api } from '../api.js';
import { store } from '../store.js';
import { el, clearElement, icon, createLoader } from '../utils/dom.js';
import { createBadge, createProgressBar, createModuleCard } from '../components/index.js';

export async function renderCourseDetail(container, courseSlug) {
  clearElement(container);
  container.appendChild(createLoader('Cargando temario del curso...'));

  try {
    const course = await api.getCourse(courseSlug);

    // Contar total de lecciones y encontrar lección objetivo
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

    const targetLesson = lastVisited
      ? findLessonById(course.modules, lastVisited) || nextUncompletedLesson || firstLesson
      : nextUncompletedLesson || firstLesson;

    const badgeTheme = course.badgeColor || 'mint';

    // 1. Cabecera del Curso
    const headerSection = el('section', { className: 'course-detail-header' },
      el('div', { className: 'course-header-grid' },
        // Columna de información
        el('div', { className: 'course-info-col' },
          el('a', {
            href: '#/courses',
            className: 'btn btn-ghost btn-sm',
            style: { marginBottom: '0.5rem', paddingLeft: '0' }
          },
            icon('fa-solid fa-arrow-left'),
            ' Volver al Catálogo'
          ),
          el('div', { style: { display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' } },
            createBadge({ text: course.level || 'Todos los niveles', theme: badgeTheme }),
            createBadge({ text: course.category || 'Desarrollo', theme: 'cyan' })
          ),
          el('h1', { textContent: course.title }),
          el('p', { className: 'course-full-desc', textContent: course.description }),
          el('div', { className: 'course-meta-pills' },
            el('div', { className: 'meta-pill' },
              icon('fa-regular fa-clock', 'text-mint'),
              el('span', { textContent: course.duration || 'Flexible' })
            ),
            el('div', { className: 'meta-pill' },
              icon('fa-solid fa-book-open', 'text-cyan'),
              el('span', { textContent: `${course.modules.length} Módulos • ${totalLessonsCount} Lecciones` })
            ),
            el('div', { className: 'meta-pill' },
              icon('fa-brands fa-markdown', 'text-mint'),
              el('span', { textContent: 'Lecciones en Markdown' })
            )
          ),
          // 1. Objetivos de Aprendizaje (Lo que aprenderás)
          course.objectives && course.objectives.length > 0
            ? el('div', { className: 'course-objectives-box' },
                el('div', { className: 'objectives-header' },
                  icon('fa-solid fa-bullseye', 'text-mint'),
                  el('span', { textContent: 'Lo que aprenderás en este curso' })
                ),
                el('ul', { className: 'objectives-grid' },
                  course.objectives.map(obj =>
                    el('li', { className: 'objective-item' },
                      icon('fa-solid fa-circle-check'),
                      el('span', { textContent: obj })
                    )
                  )
                )
              )
            : null,

          // 2. Proyecto Práctico del Curso
          course.project
            ? el('div', { className: 'course-project-box' },
                el('div', { className: 'project-header' },
                  el('div', { className: 'project-title-wrap' },
                    icon('fa-solid fa-laptop-code', 'text-mint'),
                    el('span', { className: 'project-name', textContent: course.project.title })
                  ),
                  el('span', { className: 'project-badge-tag' }, 'Proyecto Integrador')
                ),
                el('p', { className: 'project-desc', textContent: course.project.description }),
                course.project.deliverables && course.project.deliverables.length > 0
                  ? el('div', {},
                      el('div', { className: 'project-deliverables-title', textContent: 'Qué construirás:' }),
                      el('ul', { className: 'project-deliverables-list' },
                        course.project.deliverables.map(deliv =>
                          el('li', { className: 'deliverable-item' },
                            icon('fa-solid fa-check'),
                            el('span', { textContent: deliv })
                          )
                        )
                      )
                    )
                  : null
              )
            : null,

          // 3. Requisitos previos recomendados
          course.requirements && course.requirements.length > 0
            ? el('div', { className: 'course-requirements-box' },
                el('div', { className: 'requirements-header' },
                  icon('fa-solid fa-clipboard-check', 'text-mint'),
                  el('span', { textContent: 'Requisitos previos recomendados' })
                ),
                el('ul', { className: 'requirements-list' },
                  course.requirements.map(req =>
                    el('li', { className: 'requirement-item' },
                      icon('fa-solid fa-circle-check'),
                      el('span', { textContent: req })
                    )
                  )
                )
              )
            : null,

          // 4. Audiencia Objetivo
          course.targetAudience && course.targetAudience.length > 0
            ? el('div', { className: 'course-audience-box' },
                el('div', { className: 'audience-header' },
                  icon('fa-solid fa-users', 'text-cyan'),
                  el('span', { textContent: '¿A quién va dirigido este curso?' })
                ),
                el('ul', { className: 'audience-list' },
                  course.targetAudience.map(aud =>
                    el('li', { className: 'audience-item' },
                      icon('fa-solid fa-user-check'),
                      el('span', { textContent: aud })
                    )
                  )
                )
              )
            : null
        ),

        // Tarjeta de Acción / Progreso
        el('div', { className: 'course-cta-card' },
          el('div', { className: 'cta-progress-box' },
            el('div', { className: 'progress-text-row', style: { marginTop: '0', marginBottom: '0.5rem' } },
              el('span', { style: { color: 'var(--text-main)', fontWeight: '700' }, textContent: 'Tu Avance' }),
              el('span', { className: 'text-mint', textContent: `${stats.percentage}%` })
            ),
            createProgressBar({
              percentage: stats.percentage,
              showLabels: false
            }),
            el('p', {
              style: { fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: '0.5rem' },
              textContent: `${stats.completed} de ${totalLessonsCount} lecciones completadas`
            })
          ),

          targetLesson
            ? el('div', {},
                el('a', {
                  href: `#/course/${courseSlug}/lesson/${targetLesson.id}`,
                  className: 'btn btn-primary btn-block btn-lg'
                },
                  icon('fa-solid fa-play'),
                  ` ${stats.completed > 0 ? 'Continuar Lección' : 'Comenzar Ahora'}`
                ),
                el('p', {
                  style: {
                    fontSize: '0.775rem',
                    color: 'var(--text-dim)',
                    textAlign: 'center',
                    marginTop: '0.65rem'
                  },
                  textContent: `Siguiente: ${targetLesson.title}`
                })
              )
            : el('div', {
                className: 'badge badge-mint',
                style: { textAlign: 'center', fontWeight: '600' }
              },
                icon('fa-solid fa-circle-check'),
                ' ¡Has completado este curso!'
              )
        )
      )
    );

    // 2. Sección del Temario (Syllabus)
    const syllabusSection = el('section', { className: 'syllabus-container' },
      el('div', { className: 'section-header' },
        el('div', {},
          el('h2', { className: 'section-title' },
            icon('fa-solid fa-list-ol', 'text-mint'),
            ' Contenido del Curso'
          ),
          el('p', { className: 'section-desc', textContent: 'Explora las lecciones y temas cubiertos en cada módulo.' })
        )
      ),
      el('div', { className: 'modules-accordion' },
        course.modules.map((mod, modIdx) => createModuleCard({
          courseSlug,
          module: mod,
          moduleIndex: modIdx
        }))
      )
    );

    // Reemplazar hijos de forma atómica y segura
    clearElement(container);
    container.append(headerSection, syllabusSection);

  } catch (err) {
    clearElement(container);
    container.appendChild(
      el('div', { className: 'container' },
        el('div', { className: 'settings-box' },
          el('h2', { className: 'text-danger' },
            icon('fa-solid fa-triangle-exclamation'),
            ' Error al cargar el curso'
          ),
          el('p', { textContent: err.message }),
          el('a', { href: '#/courses', className: 'btn btn-primary btn-sm' }, 'Regresar al catálogo')
        )
      )
    );
  }
}

function findLessonById(modules, lessonId) {
  for (const mod of modules) {
    const found = mod.lessons.find(l => l.id === lessonId);
    if (found) return found;
  }
  return null;
}
