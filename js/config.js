/**
 * EduXP - Configuración fija de fuentes de contenido desde config.json
 */

const DEFAULT_CONFIG = {
  appName: 'EduXP',
  sourceType: 'github',
  github: {
    owner: 'Randolh',
    repo: 'Content_EduXP',
    branch: 'main',
    useCdn: false
  },
  localBasePath: './content'
};

class ConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadExternalConfig();
  }

  async loadExternalConfig() {
    try {
      const res = await fetch('./config.json');
      if (res.ok) {
        const jsonConfig = await res.json();
        this.config = { ...DEFAULT_CONFIG, ...jsonConfig };
        window.dispatchEvent(new CustomEvent('eduxp:config-changed', { detail: this.config }));
      }
    } catch (e) {
      console.warn('Usando configuración predeterminada en memoria:', e);
    }
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
    if (this.config.sourceType === 'github') {
      const { owner, repo, branch } = this.config.github;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/courses.json`;
    }
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


