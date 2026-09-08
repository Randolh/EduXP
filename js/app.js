/**
 * EduXP - Archivo Principal de la Aplicación
 * Orquesta Router, Store, Eventos de navegación y estado global.
 */

import { initRouter } from './router.js';
import { store } from './store.js';
import { configManager } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar Router
  initRouter();

  // 2. Actualizar estadísticas globales en navbar
  updateGlobalStats();

  // 3. Actualizar etiqueta de fuente de datos en footer
  updateFooterSourceBadge();

  // 4. Configurar eventos de navegación móvil
  setupMobileNav();

  // 5. Escuchar eventos del Store
  window.addEventListener('eduxp:progress-updated', () => {
    updateGlobalStats();
  });

  // 6. Escuchar cambios de configuración
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
