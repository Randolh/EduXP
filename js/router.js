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
import { el, clearElement, icon } from './utils/dom.js';
import { store } from './store.js';
import { openAuthModal } from './components/AuthModal.js';

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
        // Verificar si la ruta requiere autenticación obligatoria
        if (matched.route.requiresAuth) {
          await store.waitForAuth();
          if (!store.isAuthenticated()) {
            console.warn(`Ruta protegida (${path}): Inicio de sesión obligatorio.`);
            const fallbackPath = matched.params?.slug ? `#/course/${matched.params.slug}` : '#/courses';
            window.location.hash = fallbackPath;
            openAuthModal('login', 'Debes iniciar sesión para acceder a las lecciones y registrar tu progreso.');
            return;
          }
        }

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
    clearElement(this.appContainer);
    this.appContainer.appendChild(
      el('div', { className: 'container', style: { textAlign: 'center', padding: '5rem 1.5rem' } },
        el('i', {
          className: 'fa-solid fa-compass-slash text-mint',
          style: { fontSize: '3.5rem', marginBottom: '1.5rem', display: 'block' }
        }),
        el('h1', { style: { fontSize: '2.25rem', fontWeight: '800', marginBottom: '1rem' }, textContent: '404 - Página no encontrada' }),
        el('p', { style: { color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem' } },
          'La ruta ',
          el('code', { textContent: `#${path}` }),
          ' no existe o ha sido movida.'
        ),
        el('a', { href: '#/', className: 'btn btn-primary btn-lg' },
          icon('fa-solid fa-house'),
          ' Volver al Inicio'
        )
      )
    );
  }

  renderError(title, message) {
    clearElement(this.appContainer);
    this.appContainer.appendChild(
      el('div', { className: 'container', style: { padding: '4rem 1.5rem' } },
        el('div', { className: 'settings-box', style: { borderLeft: '4px solid var(--color-danger)' } },
          el('h2', { className: 'text-danger' },
            icon('fa-solid fa-triangle-exclamation'),
            ` ${title}`
          ),
          el('p', { style: { marginTop: '0.5rem' }, textContent: message }),
          el('a', { href: '#/', className: 'btn btn-secondary btn-sm', style: { marginTop: '1rem' } }, 'Regresar al inicio')
        )
      )
    );
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
      requiresAuth: true,
      handler: (container, params) => renderLesson(container, params.slug, params.lessonId)
    },
    {
      path: '/settings',
      handler: (container) => renderSettings(container)
    }
  ];

  return new Router(routes);
}
