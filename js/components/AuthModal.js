/**
 * EduXP - Componente Modal de Autenticación (Usuario & Contraseña)
 * Permite Iniciar Sesión y Crear Cuenta en Supabase sin necesidad de ingresar correo.
 */

import { el, icon, clearElement } from '../utils/dom.js';
import { signUpWithUsername, signInWithUsername, getCleanUsername } from '../services/supabase.js';
import { showToast } from './Toast.js';
import { store } from '../store.js';

let currentModal = null;

/**
 * Abre el modal de autenticación
 * @param {'login' | 'register'} initialTab
 * @param {string} [customMessage]
 */
export function openAuthModal(initialTab = 'login', customMessage = null) {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }

  let activeTab = initialTab; // 'login' | 'register'
  let isLoading = false;

  // 1. Elementos del formulario
  const usernameInput = el('input', {
    type: 'text',
    className: 'auth-input-field',
    placeholder: 'ej. randolh',
    required: true,
    autocomplete: 'username'
  });

  const passwordInput = el('input', {
    type: 'password',
    className: 'auth-input-field',
    placeholder: 'Mínimo 6 caracteres',
    required: true,
    autocomplete: 'current-password'
  });

  const errorBanner = el('div', { className: 'auth-error-banner', style: { display: 'none' } });

  const submitBtn = el('button', {
    type: 'submit',
    className: 'btn btn-primary btn-block auth-submit-btn'
  });

  const tabLoginBtn = el('button', {
    type: 'button',
    className: `auth-tab-btn ${activeTab === 'login' ? 'is-active' : ''}`,
    textContent: 'Iniciar Sesión'
  });

  const tabRegisterBtn = el('button', {
    type: 'button',
    className: `auth-tab-btn ${activeTab === 'register' ? 'is-active' : ''}`,
    textContent: 'Crear Cuenta'
  });

  const modalTitle = el('h3', { className: 'auth-modal-title' });
  const modalSubtitle = el('p', { className: 'auth-modal-subtitle' });

  function updateTabUi() {
    clearError();
    if (activeTab === 'login') {
      tabLoginBtn.className = 'auth-tab-btn is-active';
      tabRegisterBtn.className = 'auth-tab-btn';
      modalTitle.textContent = 'Bienvenido de nuevo';
      modalSubtitle.textContent = customMessage || 'Inicia sesión para sincronizar tu progreso y continuar donde lo dejaste.';
      submitBtn.textContent = 'Entrar a mi Cuenta';
      passwordInput.autocomplete = 'current-password';
    } else {
      tabLoginBtn.className = 'auth-tab-btn';
      tabRegisterBtn.className = 'auth-tab-btn is-active';
      modalTitle.textContent = 'Crea tu Cuenta';
      modalSubtitle.textContent = customMessage || 'Solo necesitas un nombre de usuario y contraseña para guardar tu avance en la nube.';
      submitBtn.textContent = 'Crear Cuenta Gratis';
      passwordInput.autocomplete = 'new-password';
    }
  }

  function showError(msg) {
    clearElement(errorBanner);
    errorBanner.append(icon('fa-solid fa-circle-exclamation'), document.createTextNode(` ${msg}`));
    errorBanner.style.display = 'flex';
  }

  function clearError() {
    errorBanner.style.display = 'none';
    clearElement(errorBanner);
  }

  tabLoginBtn.addEventListener('click', () => {
    activeTab = 'login';
    updateTabUi();
  });

  tabRegisterBtn.addEventListener('click', () => {
    activeTab = 'register';
    updateTabUi();
  });

  // 2. Manejador de Envío
  const form = el('form', { className: 'auth-form' },
    errorBanner,
    el('div', { className: 'auth-form-group' },
      el('label', { className: 'auth-form-label', textContent: 'Nombre de Usuario' }),
      el('div', { className: 'auth-input-wrap' },
        icon('fa-solid fa-user', 'auth-input-icon'),
        usernameInput
      ),
      el('div', { className: 'auth-input-hint', textContent: 'Sin espacios ni símbolos especiales (letras, números y guiones).' })
    ),
    el('div', { className: 'auth-form-group' },
      el('label', { className: 'auth-form-label', textContent: 'Contraseña' }),
      el('div', { className: 'auth-input-wrap' },
        icon('fa-solid fa-lock', 'auth-input-icon'),
        passwordInput
      ),
      el('div', { className: 'auth-input-hint', textContent: 'Usa una contraseña segura de 6 caracteres o más.' })
    ),
    submitBtn,
    el('p', { className: 'auth-sync-note' },
      icon('fa-solid fa-cloud-arrow-up text-mint'),
      ' Tu progreso se sincronizará automáticamente entre todos tus dispositivos mediante Supabase.'
    )
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isLoading) return;

    clearError();
    const user = usernameInput.value.trim();
    const pass = passwordInput.value;

    if (!user || user.length < 3) {
      showError('El nombre de usuario debe tener al menos 3 caracteres.');
      usernameInput.focus();
      return;
    }
    if (!pass || pass.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.');
      passwordInput.focus();
      return;
    }

    isLoading = true;
    submitBtn.disabled = true;
    submitBtn.textContent = activeTab === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...';

    try {
      let authUser = null;
      if (activeTab === 'register') {
        authUser = await signUpWithUsername(user, pass);
        showToast(`¡Cuenta creada con éxito! Bienvenido, ${getCleanUsername(authUser)}.`, 'success');
      } else {
        authUser = await signInWithUsername(user, pass);
        showToast(`¡Sesión iniciada! Bienvenido de nuevo, ${getCleanUsername(authUser)}.`, 'success');
      }

      if (authUser) {
        await store.handleUserSignedIn(authUser);
      }

      closeModal();
    } catch (err) {
      showError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      isLoading = false;
      submitBtn.disabled = false;
      submitBtn.textContent = activeTab === 'login' ? 'Entrar a mi Cuenta' : 'Crear Cuenta Gratis';
    }
  });

  // 3. Ventana Modal
  const closeBtn = el('button', {
    className: 'auth-modal-close-btn',
    title: 'Cerrar ventana',
    type: 'button'
  }, icon('fa-solid fa-xmark'));

  const modalWindow = el('div', { className: 'auth-modal-window' },
    closeBtn,
    el('div', { className: 'auth-modal-header' },
      el('div', { className: 'auth-modal-icon-bubble' }, icon('fa-solid fa-user-astronaut')),
      modalTitle,
      modalSubtitle
    ),
    el('div', { className: 'auth-tabs-row' },
      tabLoginBtn,
      tabRegisterBtn
    ),
    el('div', { className: 'auth-modal-body' }, form)
  );

  const overlay = el('div', { className: 'auth-modal-overlay' }, modalWindow);

  function closeModal() {
    overlay.remove();
    document.removeEventListener('keydown', handleKeyDown);
    currentModal = null;
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', handleKeyDown);

  updateTabUi();
  document.body.appendChild(overlay);
  currentModal = overlay;

  setTimeout(() => {
    usernameInput.focus();
  }, 100);
}
