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
  signOutUser,
  resetCourseProgressInCloud
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
      cancelledCourses: [], // [courseId, ...] cursos cancelados que no deben volver a mostrarse
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
          courseStatus: parsed.courseStatus || {},
          cancelledCourses: Array.isArray(parsed.cancelledCourses) ? parsed.cancelledCourses : []
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
      // IMPORTANTE: ignorar cursos que el usuario canceló explícitamente en este dispositivo
      const cancelled = new Set(this.data.cancelledCourses || []);
      let hasNewData = false;
      cloudRecords.forEach(rec => {
        // Si el curso fue cancelado, ignorarlo completamente para que no reaparezca
        if (cancelled.has(rec.course_slug)) return;

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

    // Los cursos cancelados no tienen estado activo (no aparecen en biblioteca)
    const cancelled = this.data.cancelledCourses || [];
    if (cancelled.includes(courseSlug)) return 'not_started';

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
   * Garantiza estrictamente que JAMÁS existan más de 3 cursos con estado 'in_progress'.
   * Si por datos residuales o simultáneos hay más de 3, conserva los 3 con mayor avance
   * o actividad reciente, y pasa los excedentes a 'on_hold'.
   * Los cursos terminados (100%) no cuentan contra este límite.
   * @param {Array} allCourses
   */
  enforceMaxActiveLimit(allCourses = []) {
    if (!this.currentUser || !Array.isArray(allCourses) || allCourses.length === 0) return;

    if (!this.data.courseStatus) this.data.courseStatus = {};

    const cancelled = new Set(this.data.cancelledCourses || []);
    const activeCandidates = [];

    allCourses.forEach(c => {
      // Los cursos cancelados no vuelven a aparecer nunca
      if (cancelled.has(c.slug)) return;

      const total = c.totalLessons || 0;
      const stats = this.getCourseStats(c.slug, total);

      // Si está completado al 100%, es 'completed' y no compite por cupos
      if (total > 0 && stats.completed >= total) {
        return;
      }

      const explicit = this.data.courseStatus[c.slug];
      if (explicit === 'on_hold') {
        return;
      }

      if (explicit === 'in_progress' || stats.completed > 0 || this.getLastVisited(c.slug)) {
        activeCandidates.push({
          slug: c.slug,
          completed: stats.completed,
          hasLastVisited: !!this.getLastVisited(c.slug),
          explicit: explicit === 'in_progress'
        });
      }
    });

    if (activeCandidates.length > 3) {
      // Ordenar: primero los que tienen lecciones completadas (> 0),
      // luego por última visita y estado explícito
      activeCandidates.sort((a, b) => {
        if (b.completed !== a.completed) return b.completed - a.completed;
        if (b.hasLastVisited !== a.hasLastVisited) return (b.hasLastVisited ? 1 : 0) - (a.hasLastVisited ? 1 : 0);
        return (b.explicit ? 1 : 0) - (a.explicit ? 1 : 0);
      });

      const keptSlugs = activeCandidates.slice(0, 3).map(x => x.slug);
      const excessSlugs = activeCandidates.slice(3).map(x => x.slug);

      keptSlugs.forEach(slug => {
        this.data.courseStatus[slug] = 'in_progress';
      });

      excessSlugs.forEach(slug => {
        // Los cursos excedentes pasan a 'on_hold' para liberar el cupo y evitar 4/3
        this.data.courseStatus[slug] = 'on_hold';
      });

      this.save();
    }
  }

  /**
   * Establece manualmente el estado de un curso (ej. 'in_progress' o 'on_hold')
   * @param {string} courseSlug
   * @param {'in_progress' | 'on_hold' | 'completed'} status
   * @param {Array} [allCourses=[]]
   */
  setCourseStatus(courseSlug, status, allCourses = []) {
    if (!this.currentUser) return false;
    if (!this.data.courseStatus) this.data.courseStatus = {};

    if (status === 'in_progress' && Array.isArray(allCourses) && allCourses.length > 0) {
      const activeSlugs = this.getActiveCoursesInProgress(allCourses).filter(s => s !== courseSlug);
      if (activeSlugs.length >= 3) {
        console.warn(`Bloqueado: Ya existen 3 cursos activos. Cancela uno para activar "${courseSlug}".`);
        return false;
      }
    }

    this.data.courseStatus[courseSlug] = status;
    this.save();
    window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
    return true;
  }

  /**
   * Retorna los slugs de cursos actualmente activos en progreso (estrictamente máximo 3)
   * @param {Array} allCourses
   * @returns {Array<string>}
   */
  getActiveCoursesInProgress(allCourses = []) {
    if (!this.currentUser || !Array.isArray(allCourses)) return [];
    this.enforceMaxActiveLimit(allCourses);

    const active = [];
    allCourses.forEach(c => {
      const status = this.getCourseStatus(c.slug, c.totalLessons || 0);
      if (status === 'in_progress') {
        active.push(c.slug);
      }
    });
    // Garantizar que la lista devuelta NUNCA supere 3
    return active.slice(0, 3);
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

    // Si ya hay 3 cursos en progreso y este es un curso nuevo o pausado, bloquear
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
   * Cancela un curso activo en progreso y reinicia TODO su progreso (0%)
   * para liberar permanentemente el cupo.
   * Los cursos terminados están protegidos y no son afectados.
   * @param {string} courseSlug
   * @param {number} [totalLessons=0]
   */
  async cancelCourseAndResetProgress(courseSlug, totalLessons = 0) {
    if (!this.currentUser) return false;

    // Proteger cursos completados: si está terminado, no se reinicia
    const status = this.getCourseStatus(courseSlug, totalLessons);
    if (status === 'completed') {
      console.warn(`El curso "${courseSlug}" ya está terminado y su progreso está protegido.`);
      return false;
    }

    // 1. Eliminar lecciones completadas para este curso
    if (this.data.completedLessons && this.data.completedLessons[courseSlug]) {
      delete this.data.completedLessons[courseSlug];
    }

    // 2. Eliminar última lección visitada
    if (this.data.lastVisited && this.data.lastVisited[courseSlug]) {
      delete this.data.lastVisited[courseSlug];
    }

    // 3. Marcar el estado como 'not_started' (eliminar de courseStatus)
    if (this.data.courseStatus && this.data.courseStatus[courseSlug]) {
      delete this.data.courseStatus[courseSlug];
    }

    // 4. Agregar a la lista de cancelledCourses para que syncWithCloud lo ignore al recargar
    if (!Array.isArray(this.data.cancelledCourses)) {
      this.data.cancelledCourses = [];
    }
    if (!this.data.cancelledCourses.includes(courseSlug)) {
      this.data.cancelledCourses.push(courseSlug);
    }

    // 5. Guardar localmente
    this.save();

    // 6. Emitir evento para actualizar toda la interfaz
    window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));

    // 7. Sincronizar borrado con Supabase
    try {
      await resetCourseProgressInCloud(this.currentUser.id, courseSlug);
    } catch (e) {
      console.warn('Error borrando progreso del curso en Supabase:', e);
    }

    return true;
  }

  /**
   * Elimina un curso de la biblioteca sin importar su estado (lo saca completamente de on_hold).
   * El curso queda como 'not_started' y desaparece de la Biblioteca.
   * @param {string} courseSlug
   */
  removeCourseFromLibrary(courseSlug) {
    if (!this.currentUser) return false;

    // Eliminar completedLessons (sin tocar la nube, no se borra progreso en este caso)
    // Solo se limpia el estado local para que salga de la biblioteca
    if (this.data.lastVisited && this.data.lastVisited[courseSlug]) {
      delete this.data.lastVisited[courseSlug];
    }

    // Quitar de courseStatus (on_hold)
    if (this.data.courseStatus && this.data.courseStatus[courseSlug]) {
      delete this.data.courseStatus[courseSlug];
    }

    // Agregar a cancelledCourses para que no reaparezca desde la nube
    if (!Array.isArray(this.data.cancelledCourses)) {
      this.data.cancelledCourses = [];
    }
    if (!this.data.cancelledCourses.includes(courseSlug)) {
      this.data.cancelledCourses.push(courseSlug);
    }

    this.save();
    window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
    return true;
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

