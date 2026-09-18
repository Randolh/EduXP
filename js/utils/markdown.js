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
    })
  // 2. Extraer y proteger Quizzes con placeholders únicos para evitar alteraciones de marked
  const quizPlaceholders = [];
  text = text.replace(/^>\s*\[!QUIZ\]\s*\n((?:>.*\n?)*)/gim, (_, content) => {
    const quizHtml = parseQuizBlock(content);
    const id = `@@QUIZ_PLACEHOLDER_${quizPlaceholders.length}@@`;
    quizPlaceholders.push({ id, html: quizHtml });
    return `\n\n${id}\n\n`;
  });

  // Si marked no está disponible en ventana
  if (!window.marked) {
    return `<pre class="fallback-md">${escapeHtml(text)}</pre>`;
  }

  let resultHtml = '';
  try {
    const parseFn = typeof window.marked.parse === 'function'
      ? window.marked.parse
      : (typeof window.marked === 'function' ? window.marked : null);

    if (parseFn) {
      resultHtml = parseFn(text, { gfm: true, breaks: true });
    } else {
      resultHtml = `<pre class="fallback-md">${escapeHtml(text)}</pre>`;
    }
  } catch (err) {
    console.error('Error al parsear markdown:', err);
    resultHtml = `<pre class="fallback-md">${escapeHtml(text)}</pre>`;
  }

  // 3. Reinsertar los bloques HTML de quizzes sin escapar
  quizPlaceholders.forEach(({ id, html }) => {
    const wrappedRegex = new RegExp(`<p>\\s*${id}\\s*<\\/p>`, 'g');
    if (wrappedRegex.test(resultHtml)) {
      resultHtml = resultHtml.replace(wrappedRegex, html);
    } else {
      resultHtml = resultHtml.replaceAll(id, html);
    }
  });

  return resultHtml;
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
 * Parsea el bloque de Quiz estilo markdown y genera el HTML del componente
 */
function parseQuizBlock(rawContent) {
  const clean = rawContent.replace(/^>\s?/gm, '').trim();
  const lines = clean.split('\n');

  const questionLines = [];
  const options = [];
  const explanationLines = [];
  let parsingOptions = false;
  let parsingExplanation = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const optionMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.*)$/);

    if (optionMatch) {
      parsingOptions = true;
      const isCorrect = optionMatch[1].toLowerCase() === 'x';
      options.push({ text: optionMatch[2].trim(), isCorrect });
    } else if (parsingOptions && (trimmed.toLowerCase().startsWith('**explicación**') || trimmed.toLowerCase().startsWith('explicación:') || parsingExplanation)) {
      parsingExplanation = true;
      explanationLines.push(trimmed);
    } else if (!parsingOptions) {
      questionLines.push(trimmed);
    } else if (parsingExplanation) {
      explanationLines.push(trimmed);
    }
  }

  const questionText = questionLines.join(' ').replace(/^###?\s*/, '').replace(/^\*\*Autoevaluación\*\*:\s*/i, '').replace(/^Autoevaluación:\s*/i, '').trim();
  const explanationText = explanationLines.join(' ').replace(/^\*\*Explicación\*\*:\s*/i, '').replace(/^Explicación:\s*/i, '').trim();

  const optionsHtml = options.map((opt) => `<button class="quiz-option" data-correct="${opt.isCorrect}" type="button"><span class="quiz-option-radio"></span><span class="quiz-option-text">${escapeHtml(opt.text)}</span></button>`).join('');

  return `<div class="quiz-card"><div class="quiz-header"><i class="fa-solid fa-circle-question text-mint"></i><span class="quiz-badge">Autoevaluación Interactiva</span></div><div class="quiz-question">${escapeHtml(questionText)}</div><div class="quiz-options">${optionsHtml}</div><div class="quiz-feedback" style="display: none;" data-explanation="${escapeHtml(explanationText)}"><div class="quiz-feedback-title"></div><div class="quiz-feedback-explanation"></div></div></div>`;
}

/**
 * Activa la interactividad nativa de los Quizzes en el visor de lección
 */
export function enhanceQuizzes(containerElement) {
  if (!containerElement) return;

  const quizCards = containerElement.querySelectorAll('.quiz-card');
  quizCards.forEach(card => {
    const options = card.querySelectorAll('.quiz-option');
    const feedbackBox = card.querySelector('.quiz-feedback');
    const feedbackTitle = card.querySelector('.quiz-feedback-title');
    const feedbackExp = card.querySelector('.quiz-feedback-explanation');
    const explanation = feedbackBox ? feedbackBox.dataset.explanation : '';

    options.forEach(option => {
      option.addEventListener('click', () => {
        const isCorrect = option.dataset.correct === 'true';

        // Limpiar estados erróneos previos
        options.forEach(opt => opt.classList.remove('is-wrong'));

        if (isCorrect) {
          option.classList.add('is-correct');
          // Deshabilitar todas las opciones
          options.forEach(opt => { opt.disabled = true; });

          if (feedbackBox) {
            feedbackBox.className = 'quiz-feedback feedback-success';
            feedbackTitle.innerHTML = '<i class="fa-solid fa-circle-check text-mint"></i> ¡Respuesta Correcta! Excelente trabajo.';
            feedbackExp.textContent = explanation || 'Has respondido correctamente a la pregunta de autoevaluación.';
            feedbackBox.style.display = 'block';
          }
        } else {
          option.classList.add('is-wrong');
          if (feedbackBox) {
            feedbackBox.className = 'quiz-feedback feedback-error';
            feedbackTitle.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i> Respuesta incorrecta';
            feedbackExp.textContent = 'Esa opción no es correcta. Analiza de nuevo el concepto e inténtalo con otra opción.';
            feedbackBox.style.display = 'block';
          }
        }
      });
    });
  });
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

