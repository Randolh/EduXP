/**
 * EduXP - Callout Component
 * Bloque de notas / avisos contextuales (Info, Tip, Advertencia)
 * Construido con la API nativa del DOM (cero innerHTML)
 * Soporta creación funcional y Web Component <callout-box>
 */

import { el, icon } from '../utils/dom.js';

const CALLOUT_CONFIGS = {
  info: {
    className: 'callout-info',
    defaultIcon: 'fa-solid fa-circle-info',
    defaultTitle: 'Nota Importante'
  },
  tip: {
    className: 'callout-tip',
    defaultIcon: 'fa-solid fa-lightbulb',
    defaultTitle: 'Consejo Profesional'
  },
  warning: {
    className: 'callout-warning',
    defaultIcon: 'fa-solid fa-triangle-exclamation',
    defaultTitle: 'Advertencia'
  }
};

/**
 * Crea un bloque callout decorativo
 * @param {Object} options
 * @param {string} [options.type='info'] - 'info' | 'tip' | 'warning'
 * @param {string} [options.title] - Título personalizado
 * @param {string|Node} options.message - Contenido del callout
 * @param {string} [options.iconClass] - Icono personalizado
 * @returns {HTMLElement}
 */
export function createCallout({
  type = 'info',
  title = null,
  message = '',
  iconClass = null
} = {}) {
  const cfg = CALLOUT_CONFIGS[type] || CALLOUT_CONFIGS.info;
  const activeIcon = iconClass || cfg.defaultIcon;
  const activeTitle = title || cfg.defaultTitle;

  const titleEl = el('div', { className: 'callout-title' },
    icon(activeIcon),
    document.createTextNode(` ${activeTitle}`)
  );

  const messageEl = typeof message === 'string'
    ? el('p', { textContent: message })
    : message;

  return el('div', { className: `callout ${cfg.className}` }, titleEl, messageEl);
}

/**
 * Custom Element: <callout-box type="tip" title="Consejo">Texto</callout-box>
 */
export class CalloutBoxElement extends HTMLElement {
  connectedCallback() {
    const type = this.getAttribute('type') || 'info';
    const title = this.getAttribute('title');
    const text = this.textContent.trim();

    const callout = createCallout({ type, title, message: text });
    this.replaceChildren(callout);
  }
}

if (!customElements.get('callout-box')) {
  customElements.define('callout-box', CalloutBoxElement);
}
