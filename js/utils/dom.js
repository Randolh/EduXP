/**
 * EduXP - Utilidades DOM Nativas (Buenas Prácticas Vanilla JS)
 * Construcción declarativa y segura de elementos DOM sin innerHTML.
 */

/**
 * Crea un elemento DOM nativo con atributos, eventos y nodos hijos
 * @param {string} tag - Nombre de la etiqueta HTML
 * @param {Object} attrs - Atributos, clases, estilos o eventos (ej. { className: 'btn', onClick: fn })
 * @param {...(Node|string|number|Array)} children - Nodos o textos hijos
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null) continue;

      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === 'className' || key === 'class') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'dataset' && typeof value === 'object') {
        Object.assign(element.dataset, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    }
  }

  appendChildren(element, children);
  return element;
}

/**
 * Limpia todos los hijos de un elemento de forma nativa sin innerHTML = ''
 * @param {HTMLElement} element
 */
export function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }
}

/**
 * Inserta de manera segura hijos dentro de un elemento padre
 * @param {HTMLElement} parent
 * @param {Array} children
 */
export function appendChildren(parent, children) {
  const flat = children.flat(Infinity);
  for (const child of flat) {
    if (child == null || child === false) continue;
    if (child instanceof Node) {
      parent.appendChild(child);
    } else {
      parent.appendChild(document.createTextNode(String(child)));
    }
  }
}

/**
 * Crea un elemento de icono Font Awesome
 * @param {string} iconClass - ej. "fa-solid fa-graduation-cap"
 * @param {string} extraClasses - ej. "text-mint"
 */
export function icon(iconClass, extraClasses = '') {
  return el('i', { className: `${iconClass} ${extraClasses}`.trim() });
}

/**
 * Crea un loader animado
 * @param {string} text - Texto opcional
 */
export function createLoader(text = 'Cargando...') {
  return el('div', { className: 'app-loader' },
    el('div', { className: 'loader-spinner' }),
    el('p', { className: 'loader-text', textContent: text })
  );
}

/**
 * Convierte una cadena HTML segura (por ejemplo salida de markdown) en un DocumentFragment nativo
 * @param {string} htmlString
 * @returns {DocumentFragment}
 */
export function parseHtmlFragment(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  return template.content;
}
