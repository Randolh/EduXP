/**
 * EduXP - Breadcrumbs Component
 * Migas de pan de navegación jerárquica
 * Construidas con la API nativa del DOM (cero innerHTML)
 */

import { el, icon } from '../utils/dom.js';

/**
 * Crea una barra de breadcrumbs para navegación
 * @param {Array<{ label: string, href?: string, icon?: string }>} items
 * @returns {HTMLElement}
 */
export function createBreadcrumbs(items = []) {
  const container = el('nav', {
    className: 'viewer-breadcrumbs',
    'aria-label': 'Navegación secundaria'
  });

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;

    if (item.href && !isLast) {
      const link = el('a', { href: item.href });
      if (item.icon) {
        link.appendChild(icon(item.icon));
        link.appendChild(document.createTextNode(' '));
      }
      link.appendChild(document.createTextNode(item.label));
      container.appendChild(link);
    } else {
      const current = el('span', { className: 'breadcrumb-current' });
      if (item.icon) {
        current.appendChild(icon(item.icon));
        current.appendChild(document.createTextNode(' '));
      }
      current.appendChild(document.createTextNode(item.label));
      container.appendChild(current);
    }

    if (!isLast) {
      const sep = el('span', { className: 'breadcrumb-sep' }, icon('fa-solid fa-chevron-right'));
      container.appendChild(sep);
    }
  });

  return container;
}
