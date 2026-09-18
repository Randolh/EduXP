/**
 * EduXP - Vista de Catálogo de Cursos (Catalog)
 * Construida con métodos nativos del DOM de JavaScript (sin innerHTML)
 * Utiliza componentes modulares SearchFilterBar y CourseCard
 */

import { api } from '../api.js';
import { el, clearElement, icon, createLoader } from '../utils/dom.js';
import { createCourseCard, createSearchFilterBar } from '../components/index.js';

export async function renderCatalog(container, queryParams = {}) {
  clearElement(container);

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'api', label: 'APIs & Servicios' }
  ];

  let currentCategory = queryParams.category || 'all';
  let currentSearch = '';
  let allCourses = [];

  const grid = el('div', { className: 'course-grid', id: 'catalog-grid' },
    createLoader('Cargando catálogo...')
  );

  function filterAndRender() {
    clearElement(grid);

    const filtered = allCourses.filter(course => {
      const matchesCategory = currentCategory === 'all' ||
        (course.category && course.category.toLowerCase() === currentCategory.toLowerCase());
      const searchLower = currentSearch.toLowerCase();
      const matchesSearch = !currentSearch ||
        course.title.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower) ||
        (course.tags && course.tags.some(t => t.toLowerCase().includes(searchLower))) ||
        (course.requirements && course.requirements.some(r => r.toLowerCase().includes(searchLower)));

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

  // Barra de Búsqueda y Filtros Modular
  const { element: searchFilterBar } = createSearchFilterBar({
    categories,
    activeCategory: currentCategory,
    searchPlaceholder: 'Buscar por tema, tecnología o palabra clave (ej. React, Hooks, Express, API)...',
    onSearch: (query) => {
      currentSearch = query.trim();
      filterAndRender();
    },
    onCategoryChange: (categoryId) => {
      currentCategory = categoryId;
      filterAndRender();
    }
  });

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
    searchFilterBar,
    grid
  );

  container.appendChild(catalogView);

  try {
    allCourses = await api.getCourses();
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
