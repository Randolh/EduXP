/**
 * EduXP - Toast Notification Component & Manager
 * Sistema de notificaciones flotantes construido 100% con la API nativa del DOM (cero innerHTML)
 */

import { el, icon } from '../utils/dom.js';

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = el('div', { id: 'toast-container', className: 'toast-container' });
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

/**
 * Muestra una notificación toast temporal
 * @param {string} message - Mensaje a mostrar
 * @param {'success'|'error'|'info'} [type='success'] - Tipo de notificación
 * @param {string} [customIcon] - Clase de Font Awesome personalizada
 * @param {number} [duration=3500] - Duración en milisegundos
 */
export function showToast(message, type = 'success', customIcon = null, duration = 3500) {
  const container = ensureToastContainer();

  let iconClass = customIcon;
  if (!iconClass) {
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    else if (type === 'error') iconClass = 'fa-solid fa-triangle-exclamation';
    else iconClass = 'fa-solid fa-circle-info';
  }

  const toastEl = el('div', { className: `toast toast-${type}` },
    icon(iconClass),
    el('span', { className: 'toast-text', textContent: message })
  );

  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(10px) scale(0.95)';
    toastEl.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 250);
  }, duration);
}
