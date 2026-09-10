/**
 * EduXP - Vista de Configuración (Settings / Fuentes de Datos)
 * Implementación 100% nativa de JavaScript DOM sin innerHTML
 */

import { configManager } from '../config.js';
import { store } from '../store.js';
import { el, clearElement, icon } from '../utils/dom.js';
import { showToast } from '../components/index.js';

export function renderSettings(container) {
  clearElement(container);

  const currentConfig = configManager.config;
  let selectedSource = currentConfig.sourceType;

  // Campos de formulario GitHub
  const ownerInput = el('input', {
    type: 'text',
    id: 'gh-owner',
    className: 'form-input',
    value: currentConfig.github.owner || '',
    placeholder: 'ej. usuario-github'
  });

  const repoInput = el('input', {
    type: 'text',
    id: 'gh-repo',
    className: 'form-input',
    value: currentConfig.github.repo || '',
    placeholder: 'ej. mis-cursos-eduxp'
  });

  const branchInput = el('input', {
    type: 'text',
    id: 'gh-branch',
    className: 'form-input',
    value: currentConfig.github.branch || 'main',
    placeholder: 'main'
  });

  const cdnCheckbox = el('input', {
    type: 'checkbox',
    id: 'gh-use-cdn',
    checked: currentConfig.github.useCdn
  });

  const githubFields = el('div', {
    id: 'github-form-fields',
    style: {
      display: currentConfig.sourceType === 'github' ? 'block' : 'none',
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: '1.5rem'
    }
  },
    el('h4', { style: { marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1rem' } },
      icon('fa-solid fa-gear', 'text-cyan'),
      ' Parámetros del Repositorio de GitHub'
    ),
    el('div', { className: 'form-group' },
      el('label', { className: 'form-label', htmlFor: 'gh-owner', textContent: 'Usuario u Organización de GitHub' }),
      ownerInput,
      el('div', { className: 'form-help', textContent: 'El nombre de usuario o la organización dueña del repositorio.' })
    ),
    el('div', { className: 'form-group' },
      el('label', { className: 'form-label', htmlFor: 'gh-repo', textContent: 'Nombre del Repositorio' }),
      repoInput,
      el('div', { className: 'form-help', textContent: 'El repositorio que contiene courses.json y la carpeta courses/.' })
    ),
    el('div', { className: 'form-group' },
      el('label', { className: 'form-label', htmlFor: 'gh-branch', textContent: 'Rama (Branch)' }),
      branchInput,
      el('div', { className: 'form-help', textContent: 'Por lo general main o master.' })
    ),
    el('div', { className: 'form-group', style: { display: 'flex', alignItems: 'center', gap: '0.75rem' } },
      cdnCheckbox,
      el('label', {
        htmlFor: 'gh-use-cdn',
        style: { fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' },
        textContent: 'Usar CDN jsDelivr (Recomendado: Evita rate limits y bloqueos CORS)'
      })
    )
  );

  // Tarjetas de Selección de Origen
  const localCard = el('div', {
    className: `source-card ${selectedSource === 'local' ? 'active' : ''}`,
    id: 'source-local-card'
  },
    el('div', { className: 'source-card-title' },
      el('span', {}, icon('fa-solid fa-hard-drive'), ' Contenido Local / Demo')
    ),
    el('div', {
      className: 'source-card-desc',
      textContent: 'Carga los cursos incluidos dentro de la carpeta ./content/ del proyecto. Ideal para pruebas locales.'
    })
  );

  const githubCard = el('div', {
    className: `source-card ${selectedSource === 'github' ? 'active' : ''}`,
    id: 'source-github-card'
  },
    el('div', { className: 'source-card-title' },
      el('span', {}, icon('fa-brands fa-github'), ' Repositorio Remoto en GitHub')
    ),
    el('div', {
      className: 'source-card-desc',
      textContent: 'Consume el contenido directamente desde un repositorio público en GitHub mediante jsDelivr CDN.'
    })
  );

  const statusMsg = el('div', { id: 'connection-status-message', style: { marginTop: '1rem' } });

  // Botones de acción
  const saveBtn = el('button', { className: 'btn btn-primary' },
    icon('fa-solid fa-floppy-disk'),
    ' Guardar Configuración'
  );

  const testBtn = el('button', { className: 'btn btn-secondary' },
    icon('fa-solid fa-network-wired'),
    ' Probar Conexión'
  );

  const resetBtn = el('button', { className: 'btn btn-ghost' },
    icon('fa-solid fa-rotate-left'),
    ' Restaurar Valores por Defecto'
  );

  const clearProgressBtn = el('button', {
    className: 'btn btn-secondary',
    style: { color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }
  },
    icon('fa-solid fa-trash-can'),
    ' Reiniciar Todo Mi Progreso'
  );

  // Manejadores de Eventos
  localCard.addEventListener('click', () => {
    selectedSource = 'local';
    localCard.classList.add('active');
    githubCard.classList.remove('active');
    githubFields.style.display = 'none';
  });

  githubCard.addEventListener('click', () => {
    selectedSource = 'github';
    githubCard.classList.add('active');
    localCard.classList.remove('active');
    githubFields.style.display = 'block';
  });

  saveBtn.addEventListener('click', () => {
    const owner = ownerInput.value.trim();
    const repo = repoInput.value.trim();
    const branch = branchInput.value.trim() || 'main';
    const useCdn = cdnCheckbox.checked;

    configManager.saveConfig({
      sourceType: selectedSource,
      github: { owner, repo, branch, useCdn }
    });

    clearElement(statusMsg);
    statusMsg.appendChild(
      el('span', { className: 'text-mint' }, icon('fa-solid fa-check'), ' ¡Configuración guardada exitosamente!')
    );
    showToast('¡Configuración guardada exitosamente!', 'success');
    setTimeout(() => { clearElement(statusMsg); }, 3000);
  });

  testBtn.addEventListener('click', async () => {
    clearElement(statusMsg);
    statusMsg.appendChild(
      el('span', { className: 'text-muted' }, icon('fa-solid fa-spinner fa-spin'), ' Comprobando acceso a courses.json...')
    );

    const owner = ownerInput.value.trim();
    const repo = repoInput.value.trim();
    const branch = branchInput.value.trim() || 'main';
    const useCdn = cdnCheckbox.checked;

    let testUrl = './content/courses.json';
    if (selectedSource === 'github') {
      if (!owner || !repo) {
        clearElement(statusMsg);
        statusMsg.appendChild(
          el('span', { className: 'text-danger' },
            icon('fa-solid fa-circle-xmark'),
            ' Debes ingresar el Usuario y el Nombre del repositorio de GitHub.'
          )
        );
        showToast('Debes ingresar el Usuario y Repositorio de GitHub.', 'error');
        return;
      }
      testUrl = useCdn
        ? `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/courses.json`
        : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/courses.json`;
    }

    try {
      const resp = await fetch(testUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const count = (data.courses || []).length;
      clearElement(statusMsg);
      statusMsg.appendChild(
        el('span', { className: 'text-mint' },
          icon('fa-solid fa-circle-check'),
          ` Conexión exitosa. Se detectaron ${count} cursos disponibles en la fuente.`
        )
      );
      showToast(`Conexión exitosa. ${count} cursos detectados.`, 'success');
    } catch (err) {
      clearElement(statusMsg);
      statusMsg.appendChild(
        el('span', { className: 'text-danger' },
          icon('fa-solid fa-circle-xmark'),
          ` Error de conexión: No se pudo leer courses.json (${err.message}). Verifica que el repositorio sea público.`
        )
      );
      showToast(`Error de conexión (${err.message})`, 'error');
    }
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('¿Deseas restaurar la configuración por defecto (Contenido local demo)?')) {
      configManager.resetConfig();
      showToast('Configuración restaurada al contenido local demo.', 'info');
      renderSettings(container);
    }
  });

  clearProgressBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas borrar todo tu progreso registrado? Esta acción no se puede deshacer.')) {
      store.clearAllProgress();
      showToast('Se ha reiniciado tu progreso.', 'info');
    }
  });

  // Ensamblar Vista
  const view = el('div', { className: 'container-narrow' },
    el('div', { className: 'section-header' },
      el('div', {},
        el('h1', { className: 'section-title' },
          icon('fa-solid fa-sliders', 'text-mint'),
          ' Fuentes de Contenido & Repositorio'
        ),
        el('p', {
          className: 'section-desc',
          textContent: 'Conecta cualquier repositorio público de GitHub con cursos en Markdown o usa el contenido local.'
        })
      )
    ),

    el('div', { className: 'settings-box' },
      el('h3', {}, icon('fa-solid fa-database', 'text-mint'), ' Origen de los Cursos'),
      el('p', { textContent: 'Elige de dónde debe cargar EduXP los cursos, temarios y archivos .md:' }),
      el('div', { className: 'source-options' }, localCard, githubCard),
      githubFields,
      el('div', { style: { display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' } },
        saveBtn,
        testBtn,
        resetBtn
      ),
      statusMsg
    ),

    el('div', { className: 'settings-box' },
      el('h3', {}, icon('fa-solid fa-user-clock', 'text-cyan'), ' Progreso de Aprendizaje'),
      el('p', {
        textContent: 'Tu progreso se almacena localmente en tu navegador para proteger tu privacidad. Si deseas reiniciar todas las lecciones completadas para empezar desde cero, puedes hacerlo aquí.'
      }),
      clearProgressBtn
    )
  );

  container.appendChild(view);
}
