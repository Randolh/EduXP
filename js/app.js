/**
 * EduXP - Archivo Principal de la Aplicación
 * Orquesta Router, Store, Eventos de navegación y estado global.
 */

import { initRouter } from './router.js';
import { store } from './store.js';
import { configManager } from './config.js';
import { el, clearElement, icon } from './utils/dom.js';
import { openAuthModal, showToast } from './components/index.js';
import { signOutUser, getCleanUsername } from './services/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar Router
  initRouter();

  // 2. Actualizar estadísticas globales en navbar
  updateGlobalStats();

  // 3. Renderizar botón o perfil de autenticación en navbar
  updateAuthNavbar();

  // 4. Actualizar etiqueta de fuente de datos en footer
  updateFooterSourceBadge();

  // 5. Configurar eventos de navegación móvil
  setupMobileNav();

  // 6. Escuchar eventos del Store
  window.addEventListener('eduxp:progress-updated', () => {
    updateGlobalStats();
  });

  // 7. Escuchar cambios de autenticación
  window.addEventListener('eduxp:auth-changed', () => {
    updateAuthNavbar();
    updateGlobalStats();
  });

  // 8. Escuchar evento de sincronización con la nube
  window.addEventListener('eduxp:cloud-synced', (e) => {
    updateAuthNavbar();
    updateGlobalStats();
  });

  // 9. Escuchar cambios de configuración
  window.addEventListener('eduxp:config-changed', () => {
    updateFooterSourceBadge();
  });
});

function updateGlobalStats() {
  const count = store.getTotalCompletedCount();
  const textEl = document.getElementById('global-progress-text');
  if (textEl) {
    textEl.textContent = count === 1 ? '1 lección completada' : `${count} lecciones`;
  }
}

function updateAuthNavbar() {
  const container = document.getElementById('nav-auth-wrap');
  if (!container) return;

  clearElement(container);
  const currentUser = store.getCurrentUser();

  if (!currentUser) {
    const loginBtn = el('button', {
      type: 'button',
      className: 'btn btn-secondary btn-sm',
      id: 'navbar-login-btn',
      onClick: () => openAuthModal('login')
    },
      icon('fa-solid fa-user'),
      document.createTextNode(' Iniciar Sesión')
    );
    container.appendChild(loginBtn);
  } else {
    const username = getCleanUsername(currentUser);
    const dropdown = el('div', {
      className: 'user-dropdown-menu',
      style: { display: 'none' }
    },
      el('div', { className: 'user-dropdown-header' },
        el('div', { className: 'user-dropdown-name', textContent: username }),
        el('div', { className: 'user-dropdown-sub' },
          icon('fa-solid fa-cloud-check', 'text-mint'),
          document.createTextNode(' Progreso sincronizado')
        )
      ),
      el('a', {
        href: '#/library',
        className: 'user-dropdown-item',
        onClick: () => {
          dropdown.style.display = 'none';
        }
      },
        icon('fa-solid fa-book-bookmark text-mint'),
        document.createTextNode(' Mi Biblioteca')
      ),
      el('button', {
        type: 'button',
        className: 'user-dropdown-item text-danger',
        onClick: async () => {
          dropdown.style.display = 'none';
          await store.signOut();
          showToast('Has cerrado sesión.', 'info');
        }
      },
        icon('fa-solid fa-arrow-right-from-bracket'),
        document.createTextNode(' Cerrar Sesión')
      )
    );

    const profileBtn = el('button', {
      type: 'button',
      className: 'user-profile-btn',
      title: `Usuario: ${username}`,
      onClick: (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
      }
    },
      el('span', { className: 'user-avatar-dot' }, icon('fa-solid fa-user-astronaut')),
      el('span', { textContent: username }),
      icon('fa-solid fa-chevron-down', 'text-dim')
    );

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    container.append(profileBtn, dropdown);
  }
}

function updateFooterSourceBadge() {
  const badgeEl = document.getElementById('footer-source-label');
  const repoLink = document.getElementById('repo-link');
  const config = configManager.config;

  if (badgeEl) {
    if (config.sourceType === 'github') {
      badgeEl.textContent = `Fuente: GitHub (${config.github.owner}/${config.github.repo})`;
      if (repoLink) {
        repoLink.href = `https://github.com/${config.github.owner}/${config.github.repo}`;
        repoLink.style.display = 'inline-flex';
      }
    } else {
      badgeEl.textContent = `Fuente: Contenido Local Demo`;
      if (repoLink) {
        repoLink.href = '#/settings';
      }
    }
  }
}

function setupMobileNav() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('is-open');
    });

    // Cerrar menú al hacer clic en un enlace
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
      });
    });
  }
}
