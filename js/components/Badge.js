/**
 * EduXP - Badge & Pill Component
 * Construido con la API nativa del DOM (cero innerHTML)
 * Soporta creación funcional y Web Component <badge-pill>
 */

import { el, icon } from '../utils/dom.js';

/**
 * Crea un badge con estilo e icono opcional
 * @param {Object} options
 * @param {string} options.text - Texto del badge
 * @param {string} [options.theme='mint'] - mint | cyan | purple | orange | warning | danger
 * @param {string} [options.iconClass] - Clase de Font Awesome (ej. 'fa-solid fa-code')
 * @returns {HTMLElement}
 */
export function createBadge({ text, theme = 'mint', iconClass = null } = {}) {
  const badgeEl = el('span', { className: `badge badge-${theme}` });

  if (iconClass) {
    badgeEl.appendChild(icon(iconClass));
    badgeEl.appendChild(document.createTextNode(' '));
  }

  badgeEl.appendChild(document.createTextNode(text || ''));
  return badgeEl;
}

/**
 * Custom Element: <badge-pill theme="mint" icon="fa-solid fa-sparkles">Texto</badge-pill>
 */
export class BadgePillElement extends HTMLElement {
  connectedCallback() {
    const text = this.textContent.trim();
    const theme = this.getAttribute('theme') || 'mint';
    const iconClass = this.getAttribute('icon');

    const badge = createBadge({ text, theme, iconClass });
    this.replaceChildren(badge);
  }
}

if (!customElements.get('badge-pill')) {
  customElements.define('badge-pill', BadgePillElement);
}
