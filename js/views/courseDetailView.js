/**
 * EduXP - Vista de Detalle de Curso (Course Detail / Syllabus)
 * Construcción declarativa 100% nativa con la API del DOM (sin innerHTML)
 * Utiliza componentes modulares ModuleCard, LessonRow, ProgressBar y Badge
 */

import { api } from '../api.js';
import { store } from '../store.js';
import { el, clearElement, icon, createLoader } from '../utils/dom.js';
import { createBadge, createProgressBar, createModuleCard, openAuthModal, openCourseLimitModal, showToast } from '../components/index.js';

export async function renderCourseDetail(container, courseSlug) {
  clearElement(container);
  container.appendChild(createLoader('Cargando temario del curso...'));

  try {
    await store.waitForAuth();
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
    const isAuthenticated = store.isAuthenticated();

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
              el('span', { className: 'text-mint', textContent: isAuthenticated ? `${stats.percentage}%` : '0%' })
            ),
            createProgressBar({
              percentage: isAuthenticated ? stats.percentage : 0,
              showLabels: false
            }),
            el('p', {
              style: { fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: '0.5rem' },
              textContent: isAuthenticated
                ? `${stats.completed} de ${totalLessonsCount} lecciones completadas`
                : 'Inicia sesión para registrar tu progreso'
            })
          ),

          (() => {
            if (!targetLesson) {
              return el('div', {
                className: 'badge badge-mint',
                style: { textAlign: 'center', fontWeight: '600' }
              },
                icon('fa-solid fa-circle-check'),
                ' ¡Has completado este curso!'
              );
            }

            const courseStatus = store.getCourseStatus(courseSlug, totalLessonsCount);
            const isOnHold = courseStatus === 'on_hold';

            // Determinar label e ícono del botón según estado
            let ctaBtnLabel, ctaBtnIcon, ctaBtnClass;
            if (!isAuthenticated) {
              ctaBtnLabel = 'Iniciar Sesión para Comenzar';
              ctaBtnIcon  = 'fa-solid fa-lock';
              ctaBtnClass = 'btn btn-primary btn-block btn-lg';
            } else if (isOnHold) {
              ctaBtnLabel = 'Activar y Comenzar';
              ctaBtnIcon  = 'fa-solid fa-play';
              ctaBtnClass = 'btn btn-secondary btn-block btn-lg';
            } else if (stats.completed > 0) {
              ctaBtnLabel = 'Continuar Lección';
              ctaBtnIcon  = 'fa-solid fa-play';
              ctaBtnClass = 'btn btn-primary btn-block btn-lg';
            } else {
              ctaBtnLabel = 'Comenzar Ahora';
              ctaBtnIcon  = 'fa-solid fa-play';
              ctaBtnClass = 'btn btn-primary btn-block btn-lg';
            }

            // Usar siempre href=void para controlar la navegación desde el click handler
            const ctaBtn = el('a', {
              href: 'javascript:void(0)',
              className: ctaBtnClass
            },
              icon(ctaBtnIcon),
              ` ${ctaBtnLabel}`
            );

            ctaBtn.addEventListener('click', async (e) => {
              e.preventDefault();

              if (!isAuthenticated) {
                openAuthModal('login', 'Debes iniciar sesión para acceder a las lecciones y registrar tu progreso.');
                return;
              }

              const allCourses = await api.getCourses();
              const check = store.canStartOrResumeCourse(courseSlug, allCourses);

              if (!check.allowed) {
                const activeCourses = allCourses.filter(c => check.activeSlugs.includes(c.slug));
                openCourseLimitModal({
                  courseToStart: course,
                  activeCourses,
                  onProceed: () => {
                    window.location.hash = `/course/${courseSlug}/lesson/${targetLesson.id}`;
                  }
                });
                return;
              }

              // Establecer explícitamente el curso a 'in_progress'
              store.setCourseStatus(courseSlug, 'in_progress', allCourses);

              window.location.hash = `/course/${courseSlug}/lesson/${targetLesson.id}`;
            });

            const isOnWatchlist = isOnHold;


            const watchlistBtn = el('button', {
              type: 'button',
              id: `watchlist-btn-${courseSlug}`,
              className: `btn btn-ghost btn-block btn-sm watchlist-btn ${isOnWatchlist ? 'is-watchlisted' : ''}`,
              style: { marginTop: '0.6rem' },
              title: isOnWatchlist ? 'Ya está en tu lista de En Espera' : 'Guardar en Mi Biblioteca para tomarlo después',
              onClick: () => {
                if (!isAuthenticated) {
                  openAuthModal('login', 'Debes iniciar sesión para guardar cursos en tu biblioteca.');
                  return;
                }
                const curStatus = store.getCourseStatus(courseSlug, totalLessonsCount);
                if (curStatus === 'in_progress') {
                  showToast('Este curso ya está en progreso.', 'info');
                  return;
                }
                if (curStatus === 'completed') {
                  showToast('Este curso ya está completado.', 'info');
                  return;
                }
                if (curStatus === 'on_hold') {
                  // Quitar de espera
                  store.removeCourseFromLibrary(courseSlug);
                  watchlistBtn.classList.remove('is-watchlisted');
                  watchlistBtn.title = 'Guardar en Mi Biblioteca para tomarlo después';
                  const wIcon = watchlistBtn.querySelector('i');
                  const wText = watchlistBtn.querySelector('.watchlist-label');
                  if (wIcon) wIcon.className = 'fa-regular fa-bookmark';
                  if (wText) wText.textContent = ' Guardar para después';
                  showToast(`"${course.title}" eliminado de En Espera.`, 'info');
                } else {
                  // Agregar a espera
                  store.addCourseToWatchlist(courseSlug, totalLessonsCount);
                  watchlistBtn.classList.add('is-watchlisted');
                  watchlistBtn.title = 'Ya está en tu lista de En Espera';
                  const wIcon = watchlistBtn.querySelector('i');
                  const wText = watchlistBtn.querySelector('.watchlist-label');
                  if (wIcon) wIcon.className = 'fa-solid fa-bookmark';
                  if (wText) wText.textContent = ' Guardado en Espera';
                  showToast(`"${course.title}" guardado en Mi Biblioteca → En Espera.`, 'success');
                }
              }
            },
              icon(isOnWatchlist ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'),
              el('span', { className: 'watchlist-label' }, isOnWatchlist ? ' Guardado en Espera' : ' Guardar para después')
            );

            return el('div', {},
              ctaBtn,
              isAuthenticated ? watchlistBtn : null,
              el('p', {
                style: {
                  fontSize: '0.775rem',
                  color: 'var(--text-dim)',
                  textAlign: 'center',
                  marginTop: '0.65rem'
                }
              },
                icon(isAuthenticated ? 'fa-regular fa-compass' : 'fa-solid fa-shield-halved', 'text-mint'),
                ` ${isAuthenticated ? `Siguiente: ${targetLesson.title}` : ' Progreso aislado y seguro en la nube'}`
              )
            );
          })()
        )
      )
    );

    // Re-renderizar si cambia el estado de autenticación mientras está en esta vista
    // IMPORTANTE: solo escuchar cambios de auth, NO de progreso (eduxp:progress-updated)
    // ya que ese evento se dispara durante la navegación de lecciones y causaría re-render
    const onAuthUpdate = () => {
      const currentHash = window.location.hash;
      // Solo re-renderizar si estamos EXACTAMENTE en la vista de detalle del curso
      // (no en una sub-ruta como /lesson/)
      const isExactDetailRoute = currentHash === `#/course/${courseSlug}` ||
        currentHash === `#/course/${courseSlug}/`;
      if (isExactDetailRoute) {
        window.removeEventListener('eduxp:auth-changed', onAuthUpdate);
        window.removeEventListener('eduxp:cloud-synced', onAuthUpdate);
        renderCourseDetail(container, courseSlug);
      }
    };
    window.addEventListener('eduxp:auth-changed', onAuthUpdate);
    window.addEventListener('eduxp:cloud-synced', onAuthUpdate);

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
