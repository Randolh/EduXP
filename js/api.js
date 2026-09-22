/**
 * EduXP - Cliente API de Contenidos
 * Consume repositorios locales o GitHub (jsDelivr / GitHub Raw)
 */

import { configManager } from './config.js';

class ContentApi {
  constructor() {
    this.cache = new Map();
  }

  clearCache() {
    this.cache.clear();
  }

  async fetchWithCache(url, isJson = true, useMemoryCache = true) {
    const isLocal = configManager.config?.sourceType === 'local';
    if (!isLocal && useMemoryCache && this.cache.has(url)) {
      return this.cache.get(url);
    }

    try {
      // Añadir timestamp para evitar caché agresiva del navegador o CDN al consultar JSON
      const fetchUrl = (isJson && !isLocal) ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url;
      const response = await fetch(fetchUrl, {
        headers: {
          'Accept': isJson ? 'application/json' : 'text/plain, text/markdown'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = isJson ? await response.json() : await response.text();
      if (useMemoryCache) {
        this.cache.set(url, data);
      }
      return data;
    } catch (error) {
      console.error(`Error al obtener recurso desde: ${url}`, error);
      throw error;
    }
  }

  /**
   * Obtiene la lista general de cursos disponibles
   */
  async getCourses() {
    const url = configManager.getCoursesIndexUrl();
    try {
      const data = await this.fetchWithCache(url, true, false);
      return data.courses || [];
    } catch (error) {
      throw new Error(`No se pudo cargar el catálogo de cursos. Verifica la fuente o conexión (${url}).`);
    }
  }

  /**
   * Obtiene la especificación y temario de un curso concreto
   */
  async getCourse(slug) {
    const url = configManager.getCourseManifestUrl(slug);
    try {
      const course = await this.fetchWithCache(url, true, false);
      return course;
    } catch (error) {
      throw new Error(`No se encontró el curso "${slug}".`);
    }
  }

  /**
   * Obtiene el archivo Markdown de una lección
   */
  async getLessonMarkdown(courseSlug, lessonFilePath) {
    const url = configManager.getLessonMarkdownUrl(courseSlug, lessonFilePath);
    try {
      const markdown = await this.fetchWithCache(url, false, false);
      return markdown;
    } catch (error) {
      throw new Error(`No se pudo cargar el contenido de la lección (${lessonFilePath}).`);
    }
  }
}

export const api = new ContentApi();

// Limpiar cache si la configuración cambia
window.addEventListener('eduxp:config-changed', () => {
  api.clearCache();
});
