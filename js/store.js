/**
 * EduXP - Almacén de Estado y Progreso del Estudiante
 * Guarda lecciones completadas, última lección y notas en localStorage y en Supabase si hay sesión activa.
 */

import {
  supabase,
  getActiveUser,
  getCleanUsername,
  fetchUserProgress,
  saveLessonToCloud,
  syncLocalProgressToCloud
} from './services/supabase.js';

class Store {
  constructor() {
    this.currentUser = null;
    this._authInitialized = false;
    this._authReadyPromise = null;
    this.data = this.getDefaultData();
    this.cleanLegacyStorage();
    this.initSupabaseSync();
  }

  getDefaultData() {
    return {
      completedLessons: {}, // { [courseId]: [lessonId1, lessonId2] }
      lastVisited: {},      // { [courseId]: lessonId }
      favorites: []
    };
  }

  /**
   * Elimina cualquier almacenamiento legado global para evitar mezclar datos
   */
  cleanLegacyStorage() {
    try {
      localStorage.removeItem('eduxp_progress_v1');
    } catch (e) {
      // Ignorar errores de localStorage
    }
  }

  getStorageKey(userId) {
    return userId ? `eduxp_progress_${userId}` : null;
  }

  load(userId) {
    if (!userId) {
      return this.getDefaultData();
    }
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error leyendo progreso del usuario:', e);
    }
    return this.getDefaultData();
  }

  save() {
    // Si no hay usuario autenticado, no se persiste nada en localStorage
    if (!this.currentUser) return;
    try {
      const key = this.getStorageKey(this.currentUser.id);
      if (key) {
        localStorage.setItem(key, JSON.stringify(this.data));
      }
      window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
    } catch (e) {
      console.warn('Error guardando progreso:', e);
    }
  }

  /**
   * Promesa que resuelve cuando se ha determinado el estado inicial de autenticación
   */
  async waitForAuth() {
    if (this._authInitialized) return this.currentUser;
    return this._authReadyPromise;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Inicializa la escucha de sesión de Supabase y sincronización bidireccional
   */
  initSupabaseSync() {
    this._authReadyPromise = new Promise(async (resolve) => {
      try {
        this.currentUser = await getActiveUser();
        if (this.currentUser) {
          this.data = this.load(this.currentUser.id);
          await this.syncWithCloud(this.currentUser);
        } else {
          this.data = this.getDefaultData();
        }
      } catch (err) {
        console.warn('No se pudo inicializar la sesión con Supabase:', err);
      } finally {
        this._authInitialized = true;
        resolve(this.currentUser);
      }

      // Escuchar cambios de sesión (login, logout, token refresh)
      supabase.auth.onAuthStateChange(async (event, session) => {
        const previousUser = this.currentUser;
        this.currentUser = session ? session.user : null;

        if (this.currentUser) {
          // El usuario inició sesión o cambió de cuenta
          if (!previousUser || previousUser.id !== this.currentUser.id) {
            this.data = this.load(this.currentUser.id);
            await this.syncWithCloud(this.currentUser);
          }
        } else {
          // El usuario CERRÓ SESIÓN:
          // 1. Despejar completamente los datos en memoria para que no contaminen al siguiente usuario
          this.data = this.getDefaultData();
          window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));

          // 2. Si el usuario estaba dentro de una lección protegida, expulsar al catálogo
          if (window.location.hash.includes('/lesson/')) {
            window.location.hash = '#/courses';
          }
        }

        window.dispatchEvent(new CustomEvent('eduxp:auth-changed', {
          detail: { user: this.currentUser, event }
        }));
      });
    });
  }

  /**
   * Sincroniza y fusiona el progreso entre la nube y el almacenamiento local aislado del usuario
   */
  async syncWithCloud(user) {
    if (!user) return;
    try {
      const username = getCleanUsername(user);

      // 1. Descargar progreso de la nube para este usuario
      const cloudRecords = await fetchUserProgress(user.id);

      // 2. Fusionar lecciones completadas de la nube hacia el almacenamiento local del usuario
      let hasNewData = false;
      cloudRecords.forEach(rec => {
        if (!this.data.completedLessons[rec.course_slug]) {
          this.data.completedLessons[rec.course_slug] = [];
        }
        const list = this.data.completedLessons[rec.course_slug];
        if (rec.completed && !list.includes(rec.lesson_id)) {
          list.push(rec.lesson_id);
          hasNewData = true;
        }
      });

      if (hasNewData) {
        this.save();
      }

      // 3. Subir cualquier lección completada localmente bajo este usuario
      const localCompletedObj = {};
      for (const courseId in this.data.completedLessons) {
        (this.data.completedLessons[courseId] || []).forEach(lId => {
          localCompletedObj[`${courseId}/${lId}`] = true;
        });
      }

      await syncLocalProgressToCloud(user.id, username, { completedLessons: localCompletedObj });

      window.dispatchEvent(new CustomEvent('eduxp:cloud-synced', {
        detail: { user, totalCount: this.getTotalCompletedCount() }
      }));
    } catch (err) {
      console.warn('Error en syncWithCloud:', err);
    }
  }

  isLessonCompleted(courseId, lessonId) {
    const courseList = this.data.completedLessons[courseId];
    return Array.isArray(courseList) && courseList.includes(lessonId);
  }

  setLessonCompleted(courseId, lessonId, isCompleted = true, xp = 50) {
    // Si no está autenticado, no permitir guardar avance
    if (!this.currentUser) {
      console.warn('Acción bloqueada: Se requiere iniciar sesión para guardar progreso.');
      return false;
    }

    if (!this.data.completedLessons[courseId]) {
      this.data.completedLessons[courseId] = [];
    }

    const list = this.data.completedLessons[courseId];
    const index = list.indexOf(lessonId);

    if (isCompleted && index === -1) {
      list.push(lessonId);
    } else if (!isCompleted && index !== -1) {
      list.splice(index, 1);
    }

    this.save();

    // Sincronizar en segundo plano con Supabase para este usuario
    saveLessonToCloud({
      userId: this.currentUser.id,
      username: getCleanUsername(this.currentUser),
      courseSlug: courseId,
      lessonId,
      completed: isCompleted,
      xp
    }).catch(e => console.warn('Sync background error:', e));

    return isCompleted;
  }

  toggleLessonCompleted(courseId, lessonId, xp = 50) {
    const currentState = this.isLessonCompleted(courseId, lessonId);
    return this.setLessonCompleted(courseId, lessonId, !currentState, xp);
  }

  setLastVisited(courseId, lessonId) {
    if (!this.currentUser) return;
    this.data.lastVisited[courseId] = lessonId;
    this.save();
  }

  getLastVisited(courseId) {
    return this.data.lastVisited[courseId] || null;
  }

  getCourseStats(courseId, totalLessons = 0) {
    const completed = (this.data.completedLessons[courseId] || []).length;
    const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    return {
      completed,
      total: totalLessons,
      percentage: Math.min(percentage, 100)
    };
  }

  getTotalCompletedCount() {
    let total = 0;
    for (const courseId in this.data.completedLessons) {
      total += (this.data.completedLessons[courseId] || []).length;
    }
    return total;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  clearAllProgress() {
    if (this.currentUser) {
      const key = this.getStorageKey(this.currentUser.id);
      if (key) {
        localStorage.removeItem(key);
      }
    }
    this.data = this.getDefaultData();
    this.save();
  }
}

export const store = new Store();

