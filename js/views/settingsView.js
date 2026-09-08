/**
 * EduXP - Vista de Configuración (Settings / Fuentes de Datos)
 */

import { configManager } from '../config.js';
import { store } from '../store.js';

export function renderSettings(container) {
  const currentConfig = configManager.config;

  container.innerHTML = `
    <div class="container-narrow">
      <div class="section-header">
        <div>
          <h1 class="section-title"><i class="fa-solid fa-sliders text-mint"></i> Fuentes de Contenido & Repositorio</h1>
          <p class="section-desc">Conecta cualquier repositorio público de GitHub con cursos en Markdown o usa el contenido local.</p>
        </div>
      </div>

      <!-- Selector de Origen -->
      <div class="settings-box">
        <h3><i class="fa-solid fa-database text-mint"></i> Origen de los Cursos</h3>
        <p>Elige de dónde debe cargar EduXP los cursos, temarios y archivos .md:</p>

        <div class="source-options">
          <div class="source-card ${currentConfig.sourceType === 'local' ? 'active' : ''}" id="source-local-card">
            <div class="source-card-title">
              <span><i class="fa-solid fa-hard-drive"></i> Contenido Local / Demo</span>
              ${currentConfig.sourceType === 'local' ? '<i class="fa-solid fa-circle-check text-mint"></i>' : ''}
            </div>
            <div class="source-card-desc">
              Carga los cursos incluidos dentro de la carpeta <code>./content/</code> del proyecto. Ideal para pruebas locales o despliegues integrados.
            </div>
          </div>

          <div class="source-card ${currentConfig.sourceType === 'github' ? 'active' : ''}" id="source-github-card">
            <div class="source-card-title">
              <span><i class="fa-brands fa-github"></i> Repositorio Remoto en GitHub</span>
              ${currentConfig.sourceType === 'github' ? '<i class="fa-solid fa-circle-check text-mint"></i>' : ''}
            </div>
            <div class="source-card-desc">
              Consume el contenido directamente desde un repositorio público en GitHub mediante jsDelivr CDN de alta velocidad.
            </div>
          </div>
        </div>

        <!-- Formulario de Configuración GitHub -->
        <div id="github-form-fields" style="display: ${currentConfig.sourceType === 'github' ? 'block' : 'none'}; border-top: 1px solid var(--border-subtle); padding-top: 1.5rem;">
          <h4 style="margin-bottom: 1rem; color: var(--text-main); font-size: 1rem;">
            <i class="fa-solid fa-gear text-cyan"></i> Parámetros del Repositorio de GitHub
          </h4>
          
          <div class="form-group">
            <label class="form-label" for="gh-owner">Usuario u Organización de GitHub</label>
            <input type="text" id="gh-owner" class="form-input" value="${currentConfig.github.owner || ''}" placeholder="ej. usuario-github">
            <div class="form-help">El nombre de usuario o la organización dueña del repositorio.</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="gh-repo">Nombre del Repositorio</label>
            <input type="text" id="gh-repo" class="form-input" value="${currentConfig.github.repo || ''}" placeholder="ej. mis-cursos-eduxp">
            <div class="form-help">El repositorio que contiene la estructura con <code>courses.json</code> y la carpeta <code>courses/</code>.</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="gh-branch">Rama (Branch)</label>
            <input type="text" id="gh-branch" class="form-input" value="${currentConfig.github.branch || 'main'}" placeholder="main">
            <div class="form-help">Por lo general <code>main</code> o <code>master</code>.</div>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="checkbox" id="gh-use-cdn" ${currentConfig.github.useCdn ? 'checked' : ''}>
            <label for="gh-use-cdn" style="font-size: 0.875rem; color: var(--text-muted); cursor: pointer;">
              Usar CDN jsDelivr (Recomendado: Evita rate limits de la API de GitHub y mejora la velocidad)
            </label>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary" id="save-config-btn">
            <i class="fa-solid fa-floppy-disk"></i> Guardar Configuración
          </button>
          <button class="btn btn-secondary" id="test-connection-btn">
            <i class="fa-solid fa-network-wired"></i> Probar Conexión
          </button>
          <button class="btn btn-ghost" id="reset-config-btn">
            <i class="fa-solid fa-rotate-left"></i> Restaurar Valores por Defecto
          </button>
        </div>

        <div id="connection-status-message" style="margin-top: 1rem;"></div>
      </div>

      <!-- Zona de Progreso del Usuario -->
      <div class="settings-box">
        <h3><i class="fa-solid fa-user-clock text-cyan"></i> Progreso de Aprendizaje</h3>
        <p>Tu progreso se almacena localmente en tu navegador para proteger tu privacidad. Si deseas reiniciar todas las lecciones completadas para empezar desde cero, puedes hacerlo aquí.</p>
        
        <button class="btn btn-secondary" id="clear-progress-btn" style="color: var(--color-danger); border-color: rgba(239, 68, 68, 0.3);">
          <i class="fa-solid fa-trash-can"></i> Reiniciar Todo Mi Progreso
        </button>
      </div>
    </div>
  `;

  // Controladores de interfaz
  const localCard = container.querySelector('#source-local-card');
  const githubCard = container.querySelector('#source-github-card');
  const githubFields = container.querySelector('#github-form-fields');
  const saveBtn = container.querySelector('#save-config-btn');
  const testBtn = container.querySelector('#test-connection-btn');
  const resetBtn = container.querySelector('#reset-config-btn');
  const clearProgressBtn = container.querySelector('#clear-progress-btn');
  const statusMsg = container.querySelector('#connection-status-message');

  let selectedSource = currentConfig.sourceType;

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
    const owner = container.querySelector('#gh-owner').value.trim();
    const repo = container.querySelector('#gh-repo').value.trim();
    const branch = container.querySelector('#gh-branch').value.trim() || 'main';
    const useCdn = container.querySelector('#gh-use-cdn').checked;

    configManager.saveConfig({
      sourceType: selectedSource,
      github: { owner, repo, branch, useCdn }
    });

    statusMsg.innerHTML = `<span class="text-mint"><i class="fa-solid fa-check"></i> ¡Configuración guardada exitosamente!</span>`;
    setTimeout(() => { statusMsg.innerHTML = ''; }, 3000);
  });

  testBtn.addEventListener('click', async () => {
    statusMsg.innerHTML = `<span class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Comprobando acceso a courses.json...</span>`;
    
    // Guardar temporalmente para probar
    const owner = container.querySelector('#gh-owner').value.trim();
    const repo = container.querySelector('#gh-repo').value.trim();
    const branch = container.querySelector('#gh-branch').value.trim() || 'main';
    const useCdn = container.querySelector('#gh-use-cdn').checked;

    let testUrl = './content/courses.json';
    if (selectedSource === 'github') {
      if (!owner || !repo) {
        statusMsg.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark"></i> Debes ingresar el Usuario y el Nombre del repositorio de GitHub.</span>`;
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
      statusMsg.innerHTML = `<span class="text-mint"><i class="fa-solid fa-circle-check"></i> Conexión exitosa. Se detectaron ${count} cursos disponibles en la fuente.</span>`;
    } catch (err) {
      statusMsg.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark"></i> Error de conexión: No se pudo leer courses.json (${err.message}). Verifica que el repositorio sea público y el archivo exista.</span>`;
    }
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('¿Deseas restaurar la configuración por defecto (Contenido local demo)?')) {
      configManager.resetConfig();
      renderSettings(container);
    }
  });

  clearProgressBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas borrar todo tu progreso registrado? Esta acción no se puede deshacer.')) {
      store.clearAllProgress();
      alert('Se ha reiniciado tu progreso.');
    }
  });
}
