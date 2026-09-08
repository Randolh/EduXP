/**
 * EduXP - Vista de Catálogo de Cursos (Catalog)
 * Construida con métodos nativos del DOM de JavaScript (sin innerHTML)
 */

import { api } from '../api.js';
import { createCourseCard } from './homeView.js';
import { el, clearElement, icon, createLoader } from '../utils/dom.js';

export async function renderCatalog(container, queryParams = {}) {
  clearElement(container);

  const searchInput = el('input', {
    type: 'text',
    id: 'course-search-input',
    className: 'search-input',
    placeholder: 'Buscar por tema, tecnología o palabra clave (ej. React, Hooks, Express, API)...'
  });

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'api', label: 'APIs & Servicios' }
  ];

  const chipButtons = categories.map(cat => {
    const isActive = (queryParams.category || 'all').toLowerCase() === cat.id;
    return el('button', {
      className: `chip-btn ${isActive ? 'active' : ''}`,
      dataset: { category: cat.id },
      textContent: cat.label
    });
  });

  const grid = el('div', { className: 'course-grid', id: 'catalog-grid' },
    createLoader('Cargando catálogo...')
  );

  const catalogView = el('div', { className: 'container' },
    el('div', { className: 'section-header' },
      el('div', {},
        el('h1', { className: 'section-title' },
          icon('fa-solid fa-graduation-cap', 'text-mint'),
          ' Catálogo de Cursos'
        ),
        el('p', {
          className: 'section-desc',
          textContent: 'Selecciona el curso que deseas aprender. Todo el material es gratuito y abierto.'
        })
      )
    ),

    // Barra de Búsqueda y Filtros
    el('div', { className: 'catalog-toolbar' },
      el('div', { className: 'search-box-wrap' },
        icon('fa-solid fa-magnifying-glass', 'search-icon'),
        searchInput
      ),
      el('div', { className: 'filter-chips', id: 'filter-chips' }, chipButtons)
    ),

    grid
  );

  container.appendChild(catalogView);

  try {
    const allCourses = await api.getCourses();

    let currentCategory = queryParams.category || 'all';
    let currentSearch = '';

    function filterAndRender() {
      clearElement(grid);

      const filtered = allCourses.filter(course => {
        const matchesCategory = currentCategory === 'all' ||
          (course.category && course.category.toLowerCase() === currentCategory.toLowerCase());
        const searchLower = currentSearch.toLowerCase();
        const matchesSearch = !currentSearch ||
          course.title.toLowerCase().includes(searchLower) ||
          course.description.toLowerCase().includes(searchLower) ||
          (course.tags && course.tags.some(t => t.toLowerCase().includes(searchLower)));

        return matchesCategory && matchesSearch;
      });

      if (filtered.length === 0) {
        grid.appendChild(
          el('div', {
            className: 'settings-box',
            style: { gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }
          },
            el('i', {
              className: 'fa-solid fa-folder-open text-muted',
              style: { fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }
            }),
            el('h3', { textContent: 'No se encontraron cursos' }),
            el('p', { textContent: 'Intenta con otros términos de búsqueda o cambia el filtro de categoría.' })
          )
        );
        return;
      }

      filtered.forEach(course => {
        grid.appendChild(createCourseCard(course));
      });
    }

    // Eventos de categorías
    chipButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        chipButtons.forEach(b => b.classList.remove('active'));
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
    clearElement(grid);
    grid.appendChild(
      el('div', { className: 'settings-box', style: { gridColumn: '1 / -1' } },
        el('p', { className: 'text-danger' },
          icon('fa-solid fa-triangle-exclamation'),
          ` ${err.message}`
        ),
        el('a', { href: '#/settings', className: 'btn btn-secondary btn-sm' }, 'Revisar configuración de repositorios')
      )
    );
  }
}
