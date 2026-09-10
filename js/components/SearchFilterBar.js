/**
 * EduXP - SearchFilterBar Component
 * Barra de búsqueda interactiva con chips de filtro de categoría
 * Construida con métodos nativos del DOM (cero innerHTML)
 */

import { el, icon } from '../utils/dom.js';

/**
 * Crea una barra interactiva de búsqueda y filtrado
 * @param {Object} options
 * @param {Array<{ id: string, label: string }>} options.categories - Lista de categorías
 * @param {string} [options.activeCategory='all'] - ID de la categoría activa
 * @param {string} [options.searchPlaceholder] - Placeholder del input de búsqueda
 * @param {Function} [options.onSearch] - Callback al escribir en la búsqueda (query)
 * @param {Function} [options.onCategoryChange] - Callback al seleccionar categoría (categoryId)
 * @returns {{ element: HTMLElement, searchInput: HTMLInputElement }}
 */
export function createSearchFilterBar({
  categories = [],
  activeCategory = 'all',
  searchPlaceholder = 'Buscar por tema o tecnología...',
  onSearch = null,
  onCategoryChange = null
} = {}) {
  // Input de búsqueda
  const searchInput = el('input', {
    type: 'text',
    className: 'search-input',
    placeholder: searchPlaceholder
  });

  if (typeof onSearch === 'function') {
    searchInput.addEventListener('input', (e) => {
      onSearch(e.target.value);
    });
  }

  const searchBox = el('div', { className: 'search-box-wrap' },
    icon('fa-solid fa-magnifying-glass', 'search-icon'),
    searchInput
  );

  // Chips de categoría
  const chipsContainer = el('div', { className: 'filter-chips' });

  categories.forEach(cat => {
    const isActive = (activeCategory || 'all').toLowerCase() === cat.id.toLowerCase();
    const chipBtn = el('button', {
      type: 'button',
      className: `chip-btn ${isActive ? 'active' : ''}`,
      dataset: { category: cat.id },
      textContent: cat.label
    });

    chipBtn.addEventListener('click', () => {
      chipsContainer.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));
      chipBtn.classList.add('active');

      if (typeof onCategoryChange === 'function') {
        onCategoryChange(cat.id);
      }
    });

    chipsContainer.appendChild(chipBtn);
  });

  const toolbar = el('div', { className: 'catalog-toolbar' }, searchBox, chipsContainer);

  return { element: toolbar, searchInput };
}
