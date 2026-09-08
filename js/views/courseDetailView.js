/**
 * EduXP - Vista de Detalle de Curso (Course Detail / Syllabus)
 * Construcción declarativa 100% nativa con la API del DOM (Buenas prácticas: sin innerHTML)
 */

import { api } from '../api.js';
import { store } from '../store.js';
import { el, clearElement, icon, createLoader } from '../utils/dom.js';

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
            el('span', { className: `badge badge-${badgeTheme}`, textContent: course.level || 'Todos los niveles' }),
            el('span', { className: 'badge badge-cyan', textContent: course.category || 'Desarrollo' })
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
          )
        ),

        // Tarjeta de Acción / Progreso
        el('div', { className: 'course-cta-card' },
          el('div', { className: 'cta-progress-box' },
            el('div', { className: 'progress-text-row', style: { marginTop: '0', marginBottom: '0.5rem' } },
              el('span', { style: { color: 'var(--text-main)', fontWeight: '700' }, textContent: 'Tu Avance' }),
              el('span', { className: 'text-mint', textContent: `${stats.percentage}%` })
            ),
            el('div', { className: 'progress-track' },
              el('div', { className: 'progress-fill', style: { width: `${stats.percentage}%` } })
            ),
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
                  style: { fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.5rem' }
                },
                  'Próxima: ',
                  el('strong', { textContent: targetLesson.title })
                )
              )
            : el('p', {
                className: 'text-mint',
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
        course.modules.map((mod, modIdx) => createModuleCard(courseSlug, mod, modIdx))
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

function createModuleCard(courseSlug, mod, modIdx) {
  return el('div', { className: 'module-card' },
    el('div', { className: 'module-header' },
      el('div', { className: 'module-title' },
        el('span', {
          style: { color: 'var(--mint-primary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' },
          textContent: `MOD ${modIdx + 1}`
        }),
        el('span', { textContent: mod.title })
      ),
      el('span', { className: 'module-counter', textContent: `${mod.lessons.length} lecciones` })
    ),
    el('ul', { className: 'lessons-list' },
      mod.lessons.map(lesson => {
        const isCompleted = store.isLessonCompleted(courseSlug, lesson.id);
        return el('li', { className: 'lesson-item-row' },
          el('div', { className: 'lesson-main-info' },
            el('div', {
              className: `lesson-status-icon ${isCompleted ? 'completed' : ''}`,
              title: isCompleted ? 'Lección completada' : 'Pendiente'
            },
              icon(`fa-solid ${isCompleted ? 'fa-check' : 'fa-play'}`)
            ),
            el('a', {
              href: `#/course/${courseSlug}/lesson/${lesson.id}`,
              className: 'lesson-title-link',
              textContent: lesson.title
            })
          ),
          el('div', { className: 'lesson-item-meta' },
            el('span', {},
              icon('fa-regular fa-clock'),
              ` ${lesson.duration || '10 min'}`
            ),
            el('a', {
              href: `#/course/${courseSlug}/lesson/${lesson.id}`,
              className: 'btn btn-ghost btn-sm',
              title: 'Ir a la lección'
            },
              icon('fa-solid fa-chevron-right')
            )
          )
        );
      })
    )
  );
}

function findLessonById(modules, lessonId) {
  for (const mod of modules) {
    const found = mod.lessons.find(l => l.id === lessonId);
    if (found) return found;
  }
  return null;
}
