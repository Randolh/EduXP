/**
 * EduXP - Vista de Catálogo de Cursos (Catalog)
 */

import { api } from '../api.js';
import { store } from '../store.js';

export async function renderCatalog(container, queryParams = {}) {
  container.innerHTML = `
    <div class="container">
      <div class="section-header">
        <div>
          <h1 class="section-title"><i class="fa-solid fa-graduation-cap text-mint"></i> Catálogo de Cursos</h1>
          <p class="section-desc">Selecciona el curso que deseas aprender. Todo el material es gratuito y abierto.</p>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="catalog-toolbar">
        <div class="search-box-wrap">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" id="course-search-input" class="search-input" placeholder="Buscar por tema, tecnología o palabra clave (ej. React, Hooks, Express, API)...">
        </div>
        
        <div class="filter-chips" id="filter-chips">
          <button class="chip-btn active" data-category="all">Todos</button>
          <button class="chip-btn" data-category="frontend">Frontend</button>
          <button class="chip-btn" data-category="backend">Backend</button>
          <button class="chip-btn" data-category="api">APIs & Servicios</button>
        </div>
      </div>

      <!-- Grid de Cursos -->
      <div class="course-grid" id="catalog-grid">
        <div class="app-loader"><div class="loader-spinner"></div></div>
      </div>
    </div>
  `;

  try {
    const allCourses = await api.getCourses();
    const grid = container.querySelector('#catalog-grid');
    const searchInput = container.querySelector('#course-search-input');
    const chipBtns = container.querySelectorAll('.chip-btn');

    let currentCategory = queryParams.category || 'all';
    let currentSearch = '';

    // Si viene categoría en los parámetros de la URL, activar el chip correspondiente
    if (queryParams.category) {
      chipBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === queryParams.category);
      });
    }

    function filterAndRender() {
      const filtered = allCourses.filter(course => {
        const matchesCategory = currentCategory === 'all' || (course.category && course.category.toLowerCase() === currentCategory.toLowerCase());
        const searchLower = currentSearch.toLowerCase();
        const matchesSearch = !currentSearch ||
          course.title.toLowerCase().includes(searchLower) ||
          course.description.toLowerCase().includes(searchLower) ||
          (course.tags && course.tags.some(t => t.toLowerCase().includes(searchLower)));

        return matchesCategory && matchesSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="settings-box" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fa-solid fa-folder-open text-muted" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
            <h3>No se encontraron cursos</h3>
            <p>Intenta con otros términos de búsqueda o cambia el filtro de categoría.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(course => renderCatalogCard(course)).join('');
    }

    // Eventos de filtro
    chipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chipBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterAndRender();
      });
    });

    // Evento de búsqueda reactiva
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      filterAndRender();
    });

    filterAndRender();
  } catch (err) {
    const grid = container.querySelector('#catalog-grid');
    grid.innerHTML = `
      <div class="settings-box" style="grid-column: 1 / -1;">
        <p class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${err.message}</p>
        <a href="#/settings" class="btn btn-secondary btn-sm">Revisar configuración de repositorios</a>
      </div>
    `;
  }
}

function renderCatalogCard(course) {
  const stats = store.getCourseStats(course.slug, course.totalLessons || 0);
  const badgeTheme = course.badgeColor || 'mint';
  const iconClass = course.icon || 'fa-solid fa-code';

  return `
    <article class="course-card">
      <div class="card-header-banner">
        <div class="card-icon-bubble">
          <i class="${iconClass}"></i>
        </div>
        <span class="badge badge-${badgeTheme}">${course.level || 'General'}</span>
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
            <i class="fa-regular fa-clock"></i> ${course.duration || 'Flexible'}
          </div>
          <div class="card-meta-item">
            <i class="fa-solid fa-layer-group"></i> ${course.category || 'Programación'}
          </div>
        </div>
      </div>
      <div class="card-footer-action">
        <a href="#/course/${course.slug}" class="btn btn-primary btn-block btn-sm">
          <i class="fa-solid fa-arrow-right"></i> Ver Temario Completo
        </a>
      </div>
    </article>
  `;
}
