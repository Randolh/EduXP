/**
 * EduXP - Configuración de fuentes de contenido
 * Permite cambiar entre repositorio local de ejemplo y repositorios remotos en GitHub.
 */

const STORAGE_KEY_CONFIG = 'eduxp_config';

const DEFAULT_CONFIG = {
  // 'local' o 'github'
  sourceType: 'local',
  
  // Parámetros si sourceType === 'github'
  github: {
    owner: 'randolh',
    repo: 'eduxp-courses',
    branch: 'main',
    // jsdelivr evita problemas de CORS y limites de peticiones directas a GitHub Raw
    useCdn: true
  },

  // Ruta base cuando es local (dentro de la misma app)
  localBasePath: './content'
};

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('No se pudo leer la configuración local:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    window.dispatchEvent(new CustomEvent('eduxp:config-changed', { detail: this.config }));
  }

  resetConfig() {
    this.config = { ...DEFAULT_CONFIG };
    localStorage.removeItem(STORAGE_KEY_CONFIG);
    window.dispatchEvent(new CustomEvent('eduxp:config-changed', { detail: this.config }));
  }

  getBaseUrl() {
    if (this.config.sourceType === 'github') {
      const { owner, repo, branch, useCdn } = this.config.github;
      if (useCdn) {
        return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}`;
      } else {
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
      }
    }
    return this.config.localBasePath;
  }

  getCoursesIndexUrl() {
    return `${this.getBaseUrl()}/courses.json`;
  }

  getCourseManifestUrl(courseSlug) {
    return `${this.getBaseUrl()}/courses/${courseSlug}/course.json`;
  }

  getLessonMarkdownUrl(courseSlug, lessonFilePath) {
    return `${this.getBaseUrl()}/courses/${courseSlug}/${lessonFilePath}`;
  }
}

export const configManager = new ConfigManager();
