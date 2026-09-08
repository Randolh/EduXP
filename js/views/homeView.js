/**
 * EduXP - Vista de Inicio (Home)
 */

import { api } from '../api.js';
import { store } from '../store.js';

export async function renderHome(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-glow-blob"></div>
      <div class="hero-content">
        <div class="hero-tag">
          <span class="badge badge-mint"><i class="fa-solid fa-sparkles"></i> Educación Tecnológica Libre</span>
        </div>
        <h1 class="hero-title">
          Aprende Desarrollo Web Moderno <br>
          <span class="hero-highlight">Con Código Práctico y Markdown</span>
        </h1>
        <p class="hero-subtitle">
          Cursos 100% gratuitos y de código abierto sobre React, Node.js, Express y más. Sin muros de pago, con lecciones actualizadas directamente desde GitHub.
        </p>
        <div class="hero-actions">
          <a href="#/courses" class="btn btn-primary btn-lg">
            <i class="fa-solid fa-compass"></i> Explorar Catálogo
          </a>
          <a href="#/settings" class="btn btn-secondary btn-lg">
            <i class="fa-brands fa-github"></i> Conectar Tu Repositorio
          </a>
        </div>

        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">3+</span>
            <span class="stat-label">Cursos Especializados</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">Libre y Sin Costo</span>
          </div>
          <div class="stat-item">
            <span class="stat-number"><i class="fa-solid fa-code"></i></span>
            <span class="stat-label">Basado en Markdown</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Cursos Destacados -->
    <section class="container">
      <div class="section-header">
        <div>
          <h2 class="section-title"><i class="fa-solid fa-fire text-mint"></i> Cursos Recomendados</h2>
          <p class="section-desc">Selecciona una ruta y empieza a escribir código hoy mismo.</p>
        </div>
        <a href="#/courses" class="btn btn-outline btn-sm">Ver todos <i class="fa-solid fa-arrow-right"></i></a>
      </div>

      <div class="course-grid" id="featured-courses-grid">
        <div class="app-loader"><div class="loader-spinner"></div></div>
      </div>
    </section>

    <!-- Beneficios / Características -->
    <section class="container" style="padding-top: 1rem; padding-bottom: 4rem;">
      <div class="section-header">
        <h2 class="section-title"><i class="fa-solid fa-shield-halved text-cyan"></i> ¿Por qué elegir EduXP?</h2>
      </div>
      <div class="course-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
        <div class="settings-box" style="margin-bottom: 0;">
          <h3><i class="fa-solid fa-file-lines text-mint"></i> Desacoplado en Markdown</h3>
          <p>Todo el contenido de las lecciones vive en archivos .md en repositorios de GitHub. Puedes bifurcar (fork), clonar o crear tus propios cursos sin tocar el código fuente del sitio.</p>
        </div>
        <div class="settings-box" style="margin-bottom: 0;">
          <h3><i class="fa-solid fa-laptop-code text-cyan"></i> Cero Frameworks Pesados</h3>
          <p>Construido 100% en JavaScript Vanilla, HTML5 y CSS3. Carga ultra rápida, cero pasos de compilación y compatibilidad total con GitHub Pages.</p>
        </div>
        <div class="settings-box" style="margin-bottom: 0;">
          <h3><i class="fa-solid fa-chart-line text-mint"></i> Progreso en Tu Navegador</h3>
          <p>Tus avances y lecciones completadas se guardan de forma privada en tu navegador mediante LocalStorage. Continúa donde lo dejaste en cualquier momento.</p>
        </div>
      </div>
    </section>
  `;

  // Cargar cursos
  try {
    const courses = await api.getCourses();
    const grid = container.querySelector('#featured-courses-grid');
    if (!courses || courses.length === 0) {
      grid.innerHTML = `<p class="text-muted">No hay cursos disponibles actualmente.</p>`;
      return;
    }

    grid.innerHTML = courses.slice(0, 3).map(course => renderCourseCard(course)).join('');
  } catch (err) {
    const grid = container.querySelector('#featured-courses-grid');
    grid.innerHTML = `
      <div class="settings-box" style="grid-column: 1 / -1;">
        <p class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${err.message}</p>
        <a href="#/settings" class="btn btn-secondary btn-sm">Configurar Fuente de Contenido</a>
      </div>
    `;
  }
}

function renderCourseCard(course) {
  const stats = store.getCourseStats(course.slug, course.totalLessons || 0);
  const badgeTheme = course.badgeColor || 'mint';
  const iconClass = course.icon || 'fa-solid fa-code';

  return `
    <article class="course-card">
      <div class="card-header-banner">
        <div class="card-icon-bubble">
          <i class="${iconClass}"></i>
        </div>
        <span class="badge badge-${badgeTheme}">${course.level || 'Todos'}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${course.title}</h3>
        <p class="card-desc">${course.description}</p>
        
        <div class="card-progress-bar-wrap">
          <div class="progress-track">
            <div class="progress-fill" style="width: ${stats.percentage}%;"></div>
          </div>
          <div class="progress-text-row">
            <span>${stats.percentage}% completado</span>
            <span>${stats.completed}/${stats.total || course.totalLessons || 0} lecciones</span>
          </div>
        </div>

        <div class="card-meta-row">
          <div class="card-meta-item">
            <i class="fa-regular fa-clock"></i> ${course.duration || '2-3 hrs'}
          </div>
          <div class="card-meta-item">
            <i class="fa-solid fa-list-check"></i> ${course.totalLessons || 0} temas
          </div>
        </div>
      </div>
      <div class="card-footer-action">
        <a href="#/course/${course.slug}" class="btn btn-primary btn-block btn-sm">
          <i class="fa-solid fa-play"></i> ${stats.completed > 0 ? 'Continuar Curso' : 'Comenzar Curso'}
        </a>
      </div>
    </article>
  `;
}
