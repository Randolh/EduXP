/**
 * EduXP - Markdown Renderer & Code Enhancer
 * Renderizado puro y robusto con enriquecimiento interactivo en el DOM
 */

import { configManager } from '../config.js';

export function renderMarkdown(markdownText, courseSlug = null) {
  if (!markdownText) return '';

  let text = String(markdownText);

  // Si se provee courseSlug, resolver rutas relativas de imágenes (ej. ./assets/diagram.png o assets/diagram.png)
  if (courseSlug) {
    const baseUrl = configManager.getBaseUrl();
    text = text.replace(/!\[([^\]]*)\]\((?!https?:\/\/|data:)([^)]+)\)/g, (match, alt, relativePath) => {
      const cleanPath = relativePath.replace(/^\.?\//, '');
      const fullUrl = `${baseUrl}/courses/${courseSlug}/${cleanPath}`;
      return `![${alt}](${fullUrl})`;
    });
  }

  // 1. Reemplazo de Callouts / Alerts estilo GitHub
  text = text
    .replace(/^>\s*\[!(NOTE|INFO)\]\s*\n((?:>.*\n?)*)/gim, (_, type, content) => {
      const clean = content.replace(/^>\s?/gm, '').trim();
      return `<div class="callout callout-info"><div class="callout-title"><i class="fa-solid fa-circle-info"></i> Nota Importante</div><p>${clean}</p></div>\n\n`;
    })
    .replace(/^>\s*\[!(TIP)\]\s*\n((?:>.*\n?)*)/gim, (_, type, content) => {
      const clean = content.replace(/^>\s?/gm, '').trim();
      return `<div class="callout callout-tip"><div class="callout-title"><i class="fa-solid fa-lightbulb"></i> Consejo Profesional</div><p>${clean}</p></div>\n\n`;
    })
    .replace(/^>\s*\[!(WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gim, (_, type, content) => {
      const clean = content.replace(/^>\s?/gm, '').trim();
      return `<div class="callout callout-warning"><div class="callout-title"><i class="fa-solid fa-triangle-exclamation"></i> Advertencia</div><p>${clean}</p></div>\n\n`;
    });

  // Si marked no está disponible en ventana
  if (!window.marked) {
    return `<pre class="fallback-md">${escapeHtml(text)}</pre>`;
  }

  try {
    const parseFn = typeof window.marked.parse === 'function'
      ? window.marked.parse
      : (typeof window.marked === 'function' ? window.marked : null);

    if (parseFn) {
      return parseFn(text, { gfm: true, breaks: true });
    }
    return `<pre class="fallback-md">${escapeHtml(text)}</pre>`;
  } catch (err) {
    console.error('Error al parsear markdown:', err);
    return `<pre class="fallback-md">${escapeHtml(text)}</pre>`;
  }
}

/**
 * Enriquece los bloques de código en el DOM añadiendo cabecera, nombre de lenguaje y botón copiar
 */
export function enhanceCodeBlocks(containerElement) {
  if (!containerElement) return;

  const pres = containerElement.querySelectorAll('pre');
  pres.forEach(pre => {
    // Si ya fue envuelto, no repetir
    if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) {
      return;
    }

    const code = pre.querySelector('code');
    if (!code) return;

    // Detectar clase de lenguaje (ej. language-javascript)
    let lang = 'CODE';
    for (const cls of code.classList) {
      if (cls.startsWith('language-')) {
        lang = cls.replace('language-', '').toUpperCase();
        break;
      }
    }

    // Crear contenedor wrapper y header de forma nativa
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.title = 'Copiar código al portapapeles';

    const copyIcon = document.createElement('i');
    copyIcon.className = 'fa-regular fa-clone';
    copyBtn.append(copyIcon, document.createTextNode(' Copiar'));

    const langSpan = document.createElement('span');
    const codeIcon = document.createElement('i');
    codeIcon.className = 'fa-solid fa-code';
    langSpan.append(codeIcon, document.createTextNode(` ${lang}`));

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.append(langSpan, copyBtn);

    // Reemplazar en el DOM
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    // Evento de copia nativo
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(code.innerText).then(() => {
        copyBtn.replaceChildren();
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fa-solid fa-check text-mint';
        copyBtn.append(checkIcon, document.createTextNode(' ¡Copiado!'));

        setTimeout(() => {
          copyBtn.replaceChildren();
          const cloneIcon = document.createElement('i');
          cloneIcon.className = 'fa-regular fa-clone';
          copyBtn.append(cloneIcon, document.createTextNode(' Copiar'));
        }, 2000);
      }).catch(err => {
        console.error('Error copiando al portapapeles:', err);
      });
    });
  });

  // Resaltado de sintaxis Prism
  if (typeof window.Prism !== 'undefined') {
    try {
      window.Prism.highlightAllUnder(containerElement);
    } catch (e) {
      console.warn('Prism highlighting warning:', e);
    }
  }
}

/**
 * Escapar caracteres HTML
 */
function escapeHtml(text) {
  const str = String(text != null ? text : '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
