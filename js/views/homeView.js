/**
 * EduXP - Vista de Inicio (Home)
 * Implementada con la API nativa del DOM (Buenas prácticas: sin innerHTML)
 * Utiliza componentes modulares de js/components/
 */

import { api } from '../api.js';
import { el, clearElement, icon, createLoader } from '../utils/dom.js';
import { createCourseCard, createBadge } from '../components/index.js';

// Re-exportar para compatibilidad si alguien lo importa de homeView
export { createCourseCard };

export async function renderHome(container) {
  clearElement(container);

  // 1. Hero Section
  const heroSection = el('section', { className: 'hero' },
    el('div', { className: 'hero-glow-blob' }),
    el('div', { className: 'hero-content' },
      el('div', { className: 'hero-tag' },
        createBadge({
          text: 'Educación Tecnológica Libre',
          theme: 'mint',
          iconClass: 'fa-solid fa-sparkles'
        })
      ),
      el('h1', { className: 'hero-title' },
        'Aprende Desarrollo ',
        el('br'),
        el('span', { className: 'hero-highlight', textContent: 'Con Lecciones Prácticas' })
      ),
      el('p', {
        className: 'hero-subtitle',
        textContent: 'Guías 100% gratuitas y libres para adentrarte en cualquier tecnología, herramienta o lenguaje de programación. Sin muros de pago y con lecciones prácticas.'
      }),
      el('div', { className: 'hero-actions' },
        el('a', { href: '#/courses', className: 'btn btn-primary btn-lg' },
          icon('fa-solid fa-compass'),
          ' Explorar Catálogo'
        ),
        el('a', { href: 'https://github.com/Randolh/Content_EduXP', target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-secondary btn-lg' },
          icon('fa-brands fa-github'),
          ' Ver Repositorio en GitHub'
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

  // 3. Beneficios y Características
  const benefitsSection = el('section', {
    className: 'container',
    style: { paddingTop: '1rem', paddingBottom: '4rem' }
  },
    el('div', { className: 'section-header' },
      el('h2', { className: 'section-title' },
        icon('fa-solid fa-star', 'text-cyan'),
        ' ¿Por qué aprender en EduXP?'
      ),
      el('p', { className: 'section-desc', textContent: 'Una plataforma enfocada en ofrecerte la mejor experiencia de aprendizaje en tecnología.' })
    ),
    el('div', { className: 'course-grid', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' } },
      el('div', { className: 'settings-box', style: { marginBottom: '0' } },
        el('h3', {}, icon('fa-solid fa-graduation-cap', 'text-mint'), ' Aprende a tu Ritmo'),
        el('p', { textContent: 'Accede a contenidos 100% gratuitos y libres, sin restricciones de tiempo ni barreras para empezar a formarte hoy mismo.' })
      ),
      el('div', { className: 'settings-box', style: { marginBottom: '0' } },
        el('h3', {}, icon('fa-solid fa-code', 'text-cyan'), ' Lecciones Prácticas'),
        el('p', { textContent: 'Guías estructuradas paso a paso con código real y ejercicios diseñados para aplicar tus conocimientos desde el primer día.' })
      ),
      el('div', { className: 'settings-box', style: { marginBottom: '0' } },
        el('h3', {}, icon('fa-solid fa-chart-line', 'text-mint'), ' Control de tu Progreso'),
        el('p', { textContent: 'Sigue tu avance en cada curso y lección completada, permitiéndote retomar el estudio exactamente donde lo dejaste.' })
      )
    )
  );

  container.append(heroSection, featuredSection, benefitsSection);

  // Cargar cursos asíncronamente
  try {
    const courses = await api.getCourses();
    clearElement(featuredGrid);

    // Seleccionar 3 cursos aleatorios de todos los disponibles
    const getRandomItems = (array, count) => {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, count);
    };

    const featuredCourses = getRandomItems(courses, 3);

    function renderFeatured() {
      clearElement(featuredGrid);
      if (!courses || courses.length === 0) {
        featuredGrid.appendChild(
          el('p', { className: 'text-muted', textContent: 'No hay cursos disponibles actualmente.' })
        );
        return;
      }

      featuredCourses.forEach(course => {
        featuredGrid.appendChild(createCourseCard(course));
      });
    }

    renderFeatured();

    // Escuchar cambios de progreso o autenticación para refrescar tarjetas de inicio
    const onHomeStateChange = () => {
      if (document.body.contains(featuredGrid)) {
        renderFeatured();
      } else {
        window.removeEventListener('eduxp:progress-updated', onHomeStateChange);
        window.removeEventListener('eduxp:auth-changed', onHomeStateChange);
        window.removeEventListener('eduxp:cloud-synced', onHomeStateChange);
      }
    };

    window.addEventListener('eduxp:progress-updated', onHomeStateChange);
    window.addEventListener('eduxp:auth-changed', onHomeStateChange);
    window.addEventListener('eduxp:cloud-synced', onHomeStateChange);

  } catch (err) {
    clearElement(featuredGrid);
    featuredGrid.appendChild(
      el('div', { className: 'settings-box', style: { gridColumn: '1 / -1' } },
        el('p', { className: 'text-danger' }, icon('fa-solid fa-triangle-exclamation'), ` ${err.message}`),
        el('button', { className: 'btn btn-secondary btn-sm', onClick: () => window.location.reload() }, 'Reintentar Carga')
      )
    );
  }
}
