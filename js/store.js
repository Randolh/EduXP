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
  syncLocalProgressToCloud,
  signOutUser
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
      courseStatus: {},     // { [courseId]: 'in_progress' | 'on_hold' | 'completed' }
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
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...this.getDefaultData(),
          ...parsed,
          courseStatus: parsed.courseStatus || {}
        };
      }
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
   * Maneja el inicio de sesión inmediato del usuario para actualizar la UI sin latencia
   */
  async handleUserSignedIn(user) {
    if (!user) return;
    this.currentUser = user;
    this.data = this.load(user.id);
    window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
    window.dispatchEvent(new CustomEvent('eduxp:auth-changed', {
      detail: { user: this.currentUser, event: 'SIGNED_IN' }
    }));
    await this.syncWithCloud(user);
  }

  /**
   * Cierra la sesión inmediatamente y limpia el estado visual antes de la llamada de red
   */
  async signOut() {
    this.currentUser = null;
    this.data = this.getDefaultData();
    window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
    window.dispatchEvent(new CustomEvent('eduxp:auth-changed', {
      detail: { user: null, event: 'SIGNED_OUT' }
    }));

    if (window.location.hash.includes('/lesson/')) {
      window.location.hash = '#/courses';
    }

    try {
      await signOutUser();
    } catch (e) {
      console.warn('Error en signOut:', e);
    }
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
          window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
          await this.syncWithCloud(this.currentUser);
        } else {
          this.data = this.getDefaultData();
          window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
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
            window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
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

      this.save();

      // Subir cualquier lección completada localmente bajo este usuario
      const localCompletedObj = {};
      for (const courseId in this.data.completedLessons) {
        (this.data.completedLessons[courseId] || []).forEach(lId => {
          localCompletedObj[`${courseId}/${lId}`] = true;
        });
      }

      await syncLocalProgressToCloud(user.id, username, { completedLessons: localCompletedObj });

      window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
      window.dispatchEvent(new CustomEvent('eduxp:cloud-synced', {
        detail: { user, totalCount: this.getTotalCompletedCount() }
      }));
    } catch (err) {
      console.warn('Error en syncWithCloud:', err);
    }
  }

  isLessonCompleted(courseId, lessonId) {
    if (!this.currentUser) return false;
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
    if (!this.currentUser) return null;
    return this.data.lastVisited[courseId] || null;
  }

  getCourseStats(courseId, totalLessons = 0) {
    if (!this.currentUser) {
      return {
        completed: 0,
        total: totalLessons,
        percentage: 0
      };
    }
    const completed = (this.data.completedLessons[courseId] || []).length;
    const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    return {
      completed,
      total: totalLessons,
      percentage: Math.min(percentage, 100)
    };
  }

  getTotalCompletedCount() {
    if (!this.currentUser) return 0;
    let total = 0;
    for (const courseId in this.data.completedLessons) {
      total += (this.data.completedLessons[courseId] || []).length;
    }
    return total;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Obtiene el estado actual de un curso en la biblioteca del usuario
   * @param {string} courseSlug
   * @param {number} [totalLessons=0]
   * @returns {'completed' | 'in_progress' | 'on_hold' | 'not_started'}
   */
  getCourseStatus(courseSlug, totalLessons = 0) {
    if (!this.currentUser) return 'not_started';

    const stats = this.getCourseStats(courseSlug, totalLessons);
    if (totalLessons > 0 && stats.completed >= totalLessons) {
      return 'completed';
    }

    const explicitStatus = this.data.courseStatus ? this.data.courseStatus[courseSlug] : null;
    if (explicitStatus === 'on_hold') {
      return 'on_hold';
    }
    if (explicitStatus === 'in_progress' || stats.completed > 0 || this.getLastVisited(courseSlug)) {
      return 'in_progress';
    }

    return 'not_started';
  }

  /**
   * Establece manualmente el estado de un curso (ej. 'in_progress' o 'on_hold')
   * @param {string} courseSlug
   * @param {'in_progress' | 'on_hold' | 'completed'} status
   */
  setCourseStatus(courseSlug, status) {
    if (!this.currentUser) return false;
    if (!this.data.courseStatus) this.data.courseStatus = {};
    this.data.courseStatus[courseSlug] = status;
    this.save();
    window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
    return true;
  }

  /**
   * Retorna los slugs de cursos actualmente activos en progreso
   * @param {Array} allCourses
   * @returns {Array<string>}
   */
  getActiveCoursesInProgress(allCourses = []) {
    if (!this.currentUser || !Array.isArray(allCourses)) return [];
    const active = [];
    allCourses.forEach(c => {
      const status = this.getCourseStatus(c.slug, c.totalLessons || 0);
      if (status === 'in_progress') {
        active.push(c.slug);
      }
    });
    return active;
  }

  /**
   * Valida si el usuario puede iniciar o reanudar un curso sin exceder el límite de 3
   * @param {string} courseSlug
   * @param {Array} allCourses
   * @returns {{ allowed: boolean, count: number, max: number, activeSlugs: string[] }}
   */
  canStartOrResumeCourse(courseSlug, allCourses = []) {
    if (!this.currentUser) {
      return { allowed: true, count: 0, max: 3, activeSlugs: [] };
    }

    const activeSlugs = this.getActiveCoursesInProgress(allCourses);

    // Si ya está entre los cursos en progreso, continuar siempre es válido
    if (activeSlugs.includes(courseSlug)) {
      return { allowed: true, count: activeSlugs.length, max: 3, activeSlugs };
    }

    // Si ya hay 3 cursos en progreso y este es un 4to curso, bloquear
    if (activeSlugs.length >= 3) {
      return { allowed: false, count: activeSlugs.length, max: 3, activeSlugs };
    }

    return { allowed: true, count: activeSlugs.length, max: 3, activeSlugs };
  }

  /**
   * Mueve un curso activo a 'En Espera' (on_hold) para liberar cupo
   * @param {string} courseSlug
   */
  pauseCourseToHold(courseSlug) {
    return this.setCourseStatus(courseSlug, 'on_hold');
  }

  /**
   * Reanuda un curso a 'En Progreso', validando el cupo de 3
   * @param {string} courseSlug
   * @param {Array} allCourses
   */
  resumeCourse(courseSlug, allCourses = []) {
    const check = this.canStartOrResumeCourse(courseSlug, allCourses);
    if (!check.allowed) {
      return { success: false, reason: 'limit_reached', ...check };
    }
    this.setCourseStatus(courseSlug, 'in_progress');
    return { success: true, ...check };
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

