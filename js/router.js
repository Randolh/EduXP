/**
 * EduXP - Enrutador SPA basado en Hash
 * Soporta parámetros dinámicos (:slug, :lessonId) y query params (?cat=frontend)
 * 100% Compatible con GitHub Pages
 */

import { renderHome } from './views/homeView.js';
import { renderCatalog } from './views/catalogView.js';
import { renderCourseDetail } from './views/courseDetailView.js';
import { renderLesson } from './views/lessonView.js';
import { renderSettings } from './views/settingsView.js';

class Router {
  constructor(routes = []) {
    this.routes = routes;
    this.appContainer = document.getElementById('app');
    
    // Escuchar cambios de hash
    window.addEventListener('hashchange', () => this.handleRoute());
    // Escuchar carga inicial
    window.addEventListener('DOMContentLoaded', () => this.handleRoute());
  }

  parseHash() {
    const hash = window.location.hash.slice(1) || '/';
    const [pathWithSlash, queryString] = hash.split('?');
    const path = pathWithSlash.startsWith('/') ? pathWithSlash : `/${pathWithSlash}`;

    const queryParams = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((val, key) => {
        queryParams[key] = val;
      });
    }

    return { path, queryParams };
  }

  matchRoute(currentPath) {
    for (const route of this.routes) {
      // Reemplazar :param por expresiones regulares nombradas
      const paramNames = [];
      const regexPattern = route.path
        .replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
          paramNames.push(paramName);
          return '([^/]+)';
        })
        .replace(/\//g, '\\/');

      const regex = new RegExp(`^${regexPattern}$`);
      const match = currentPath.match(regex);

      if (match) {
        const params = {};
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { route, params };
      }
    }
    return null;
  }

  async handleRoute() {
    const { path, queryParams } = this.parseHash();
    const matched = this.matchRoute(path);

    this.updateActiveNavLinks(path);

    // Scroll to top
    window.scrollTo(0, 0);

    if (matched) {
      try {
        await matched.route.handler(this.appContainer, matched.params, queryParams);
      } catch (error) {
        console.error('Error renderizando vista:', error);
        this.renderError('Error al cargar la vista', error.message);
      }
    } else {
      this.renderNotFound(path);
    }
  }

  updateActiveNavLinks(currentPath) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const routeAttr = link.dataset.route;
      let isActive = false;

      if (routeAttr === 'home' && (currentPath === '/' || currentPath === '')) {
        isActive = true;
      } else if (routeAttr === 'courses' && currentPath.startsWith('/course')) {
        isActive = true;
      } else if (routeAttr === 'settings' && currentPath.startsWith('/settings')) {
        isActive = true;
      }

      link.classList.toggle('active', isActive);
    });

    // Cerrar menú móvil si está abierto
    const mobileMenu = document.getElementById('nav-links');
    if (mobileMenu) {
      mobileMenu.classList.remove('is-open');
    }
  }

  renderNotFound(path) {
    this.appContainer.innerHTML = `
      <div class="container" style="text-align: center; padding: 5rem 1.5rem;">
        <i class="fa-solid fa-compass-slash text-mint" style="font-size: 3.5rem; margin-bottom: 1.5rem;"></i>
        <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem;">404 - Página no encontrada</h1>
        <p style="color: var(--text-muted); max-width: 500px; margin: 0 auto 2rem;">
          La ruta <code>#${path}</code> no existe o ha sido movida.
        </p>
        <a href="#/" class="btn btn-primary btn-lg">
          <i class="fa-solid fa-house"></i> Volver al Inicio
        </a>
      </div>
    `;
  }

  renderError(title, message) {
    this.appContainer.innerHTML = `
      <div class="container" style="padding: 4rem 1.5rem;">
        <div class="settings-box" style="border-left: 4px solid var(--color-danger);">
          <h2 class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> ${title}</h2>
          <p style="margin-top: 0.5rem;">${message}</p>
          <a href="#/" class="btn btn-secondary btn-sm" style="margin-top: 1rem;">Regresar al inicio</a>
        </div>
      </div>
    `;
  }
}

export function initRouter() {
  const routes = [
    {
      path: '/',
      handler: (container) => renderHome(container)
    },
    {
      path: '/courses',
      handler: (container, params, query) => renderCatalog(container, query)
    },
    {
      path: '/course/:slug',
      handler: (container, params) => renderCourseDetail(container, params.slug)
    },
    {
      path: '/course/:slug/lesson/:lessonId',
      handler: (container, params) => renderLesson(container, params.slug, params.lessonId)
    },
    {
      path: '/settings',
      handler: (container) => renderSettings(container)
    }
  ];

  return new Router(routes);
}
