/**
 * EduXP - ProgressBar Component
 * Construido con la API nativa del DOM (cero innerHTML)
 * Soporta creación funcional y Web Component <progress-bar>
 */

import { el } from '../utils/dom.js';

/**
 * Crea una barra de progreso reactiva y modular
 * @param {Object} options
 * @param {number} [options.percentage=0] - Porcentaje de 0 a 100
 * @param {number} [options.completed] - Número de lecciones completadas
 * @param {number} [options.total] - Total de lecciones
 * @param {boolean} [options.showLabels=true] - Si muestra la fila de texto inferior
 * @param {string} [options.size='default'] - 'default' | 'sm' | 'lg'
 * @param {string} [options.fillId] - ID opcional para el fill
 * @param {string} [options.labelId] - ID opcional para el texto de porcentaje
 * @param {string} [options.countId] - ID opcional para el texto de conteo
 * @returns {HTMLElement}
 */
export function createProgressBar({
  percentage = 0,
  completed = null,
  total = null,
  showLabels = true,
  size = 'default',
  fillId = null,
  labelId = null,
  countId = null
} = {}) {
  const safePercentage = Math.min(100, Math.max(0, Math.round(percentage)));

  const fillAttrs = {
    className: 'progress-fill',
    style: { width: `${safePercentage}%` }
  };
  if (fillId) fillAttrs.id = fillId;

  const fill = el('div', fillAttrs);

  let trackClass = 'progress-track';
  if (size === 'sm') trackClass += ' progress-sm';
  if (size === 'lg') trackClass += ' progress-lg';

  const track = el('div', { className: trackClass }, fill);

  const container = el('div', { className: 'progress-bar-component' }, track);

  if (showLabels) {
    const labelAttrs = {};
    if (labelId) labelAttrs.id = labelId;
    const labelSpan = el('span', labelAttrs, `${safePercentage}% completado`);

    const countAttrs = {};
    if (countId) countAttrs.id = countId;
    const countText = (completed != null && total != null) ? `${completed}/${total} lecciones` : '';
    const countSpan = el('span', countAttrs, countText);

    const textRow = el('div', { className: 'progress-text-row' }, labelSpan, countSpan);
    container.appendChild(textRow);
  }

  return container;
}

/**
 * Actualiza una barra de progreso existente de forma nativa sin innerHTML
 * @param {HTMLElement} container - Contenedor retornado por createProgressBar
 * @param {Object} stats
 * @param {number} stats.percentage
 * @param {number} [stats.completed]
 * @param {number} [stats.total]
 */
export function updateProgressBar(container, { percentage = 0, completed = null, total = null } = {}) {
  if (!container) return;
  const safePercentage = Math.min(100, Math.max(0, Math.round(percentage)));

  const fill = container.querySelector('.progress-fill');
  if (fill) {
    fill.style.width = `${safePercentage}%`;
  }

  const textRow = container.querySelector('.progress-text-row');
  if (textRow) {
    const spans = textRow.querySelectorAll('span');
    if (spans[0]) {
      spans[0].textContent = `${safePercentage}% completado`;
    }
    if (spans[1] && completed != null && total != null) {
      spans[1].textContent = `${completed}/${total} lecciones`;
    }
  }
}

/**
 * Custom Element: <progress-bar value="60" completed="6" total="10"></progress-bar>
 */
export class ProgressBarElement extends HTMLElement {
  connectedCallback() {
    const percentage = parseFloat(this.getAttribute('value') || '0');
    const completed = this.hasAttribute('completed') ? parseInt(this.getAttribute('completed'), 10) : null;
    const total = this.hasAttribute('total') ? parseInt(this.getAttribute('total'), 10) : null;
    const showLabels = this.getAttribute('labels') !== 'false';
    const size = this.getAttribute('size') || 'default';

    const bar = createProgressBar({ percentage, completed, total, showLabels, size });
    this.replaceChildren(bar);
  }
}

if (!customElements.get('progress-bar')) {
  customElements.define('progress-bar', ProgressBarElement);
}
