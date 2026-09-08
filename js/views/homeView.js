/**
 * EduXP - Vista de Inicio (Home)
 * Implementada con la API nativa del DOM (Buenas prácticas: sin innerHTML)
 */

import { api } from '../api.js';
import { store } from '../store.js';
import { el, clearElement, icon, createLoader } from '../utils/dom.js';

export async function renderHome(container) {
  clearElement(container);

  // 1. Hero Section
  const heroSection = el('section', { className: 'hero' },
    el('div', { className: 'hero-glow-blob' }),
    el('div', { className: 'hero-content' },
      el('div', { className: 'hero-tag' },
        el('span', { className: 'badge badge-mint' },
          icon('fa-solid fa-sparkles'),
          ' Educación Tecnológica Libre'
        )
      ),
      el('h1', { className: 'hero-title' },
        'Aprende Desarrollo Web Moderno ',
        el('br'),
        el('span', { className: 'hero-highlight', textContent: 'Con Código Práctico y Markdown' })
      ),
      el('p', {
        className: 'hero-subtitle',
        textContent: 'Cursos 100% gratuitos y de código abierto sobre React, Node.js, Express y más. Sin muros de pago, con lecciones actualizadas directamente desde GitHub.'
      }),
      el('div', { className: 'hero-actions' },
        el('a', { href: '#/courses', className: 'btn btn-primary btn-lg' },
          icon('fa-solid fa-compass'),
          ' Explorar Catálogo'
        ),
        el('a', { href: '#/settings', className: 'btn btn-secondary btn-lg' },
          icon('fa-brands fa-github'),
          ' Conectar Tu Repositorio'
        )
      ),
      el('div', { className: 'hero-stats' },
        el('div', { className: 'stat-item' },
          el('span', { className: 'stat-number', textContent: '3+' }),
          el('span', { className: 'stat-label', textContent: 'Cursos Especializados' })
        ),
        el('div', { className: 'stat-item' },
          el('span', { className: 'stat-number', textContent: '100%' }),
          el('span', { className: 'stat-label', textContent: 'Libre y Sin Costo' })
        ),
        el('div', { className: 'stat-item' },
          el('span', { className: 'stat-number' }, icon('fa-solid fa-code')),
          el('span', { className: 'stat-label', textContent: 'Basado en Markdown' })
        )
      )
    )
  );

  // 2. Cursos Destacados
  const featuredGrid = el('div', { className: 'course-grid', id: 'featured-courses-grid' },
    createLoader('Cargando cursos destacados...')
  );

  const featuredSection = el('section', { className: 'container' },
    el('div', { className: 'section-header' },
      el('div', {},
        el('h2', { className: 'section-title' },
          icon('fa-solid fa-fire', 'text-mint'),
          ' Cursos Recomendados'
        ),
        el('p', { className: 'section-desc', textContent: 'Selecciona una ruta y empieza a escribir código hoy mismo.' })
      ),
      el('a', { href: '#/courses', className: 'btn btn-outline btn-sm' },
        'Ver todos ',
        icon('fa-solid fa-arrow-right')
      )
    ),
    featuredGrid
  );

  // 3. Beneficios
  const benefitsSection = el('section', {
    className: 'container',
    style: { paddingTop: '1rem', paddingBottom: '4rem' }
  },
    el('div', { className: 'section-header' },
      el('h2', { className: 'section-title' },
        icon('fa-solid fa-shield-halved', 'text-cyan'),
        ' ¿Por qué elegir EduXP?'
      )
    ),
    el('div', { className: 'course-grid', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' } },
      el('div', { className: 'settings-box', style: { marginBottom: '0' } },
        el('h3', {}, icon('fa-solid fa-file-lines', 'text-mint'), ' Desacoplado en Markdown'),
        el('p', { textContent: 'Todo el contenido de las lecciones vive en archivos .md en repositorios de GitHub. Puedes bifurcar (fork), clonar o crear tus propios cursos sin tocar el código fuente del sitio.' })
      ),
      el('div', { className: 'settings-box', style: { marginBottom: '0' } },
        el('h3', {}, icon('fa-solid fa-laptop-code', 'text-cyan'), ' Cero Frameworks Pesados'),
        el('p', { textContent: 'Construido 100% en JavaScript Vanilla, HTML5 y CSS3. Carga ultra rápida, cero pasos de compilación y compatibilidad total con GitHub Pages.' })
      ),
      el('div', { className: 'settings-box', style: { marginBottom: '0' } },
        el('h3', {}, icon('fa-solid fa-chart-line', 'text-mint'), ' Progreso en Tu Navegador'),
        el('p', { textContent: 'Tus avances y lecciones completadas se guardan de forma privada en tu navegador mediante LocalStorage. Continúa donde lo dejaste en cualquier momento.' })
      )
    )
  );

  container.append(heroSection, featuredSection, benefitsSection);

  // Cargar cursos asíncronamente
  try {
    const courses = await api.getCourses();
    clearElement(featuredGrid);

    if (!courses || courses.length === 0) {
      featuredGrid.appendChild(
        el('p', { className: 'text-muted', textContent: 'No hay cursos disponibles actualmente.' })
      );
      return;
    }

    courses.slice(0, 3).forEach(course => {
      featuredGrid.appendChild(createCourseCard(course));
    });
  } catch (err) {
    clearElement(featuredGrid);
    featuredGrid.appendChild(
      el('div', { className: 'settings-box', style: { gridColumn: '1 / -1' } },
        el('p', { className: 'text-danger' }, icon('fa-solid fa-triangle-exclamation'), ` ${err.message}`),
        el('a', { href: '#/settings', className: 'btn btn-secondary btn-sm' }, 'Configurar Fuente de Contenido')
      )
    );
  }
}

export function createCourseCard(course) {
  const stats = store.getCourseStats(course.slug, course.totalLessons || 0);
  const badgeTheme = course.badgeColor || 'mint';
  const iconClass = course.icon || 'fa-solid fa-code';

  return el('article', { className: 'course-card' },
    el('div', { className: 'card-header-banner' },
      el('div', { className: 'card-icon-bubble' }, icon(iconClass)),
      el('span', { className: `badge badge-${badgeTheme}`, textContent: course.level || 'Todos' })
    ),
    el('div', { className: 'card-body' },
      el('h3', { className: 'card-title', textContent: course.title }),
      el('p', { className: 'card-desc', textContent: course.description }),
      el('div', { className: 'card-progress-bar-wrap' },
        el('div', { className: 'progress-track' },
          el('div', { className: 'progress-fill', style: { width: `${stats.percentage}%` } })
        ),
        el('div', { className: 'progress-text-row' },
          el('span', { textContent: `${stats.percentage}% completado` }),
          el('span', { textContent: `${stats.completed}/${stats.total || course.totalLessons || 0} lecciones` })
        )
      ),
      el('div', { className: 'card-meta-row' },
        el('div', { className: 'card-meta-item' },
          icon('fa-regular fa-clock'),
          ` ${course.duration || '2-3 hrs'}`
        ),
        el('div', { className: 'card-meta-item' },
          icon('fa-solid fa-list-check'),
          ` ${course.totalLessons || 0} temas`
        )
      )
    ),
    el('div', { className: 'card-footer-action' },
      el('a', { href: `#/course/${course.slug}`, className: 'btn btn-primary btn-block btn-sm' },
        icon('fa-solid fa-play'),
        ` ${stats.completed > 0 ? 'Continuar Curso' : 'Comenzar Curso'}`
      )
    )
  );
}
