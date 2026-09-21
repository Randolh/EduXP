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

const STORAGE_KEY_PROGRESS = 'eduxp_progress_v1';

class Store {
  constructor() {
    this.data = this.load();
    this.currentUser = null;
    this.initSupabaseSync();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error leyendo progreso del usuario:', e);
    }
    return {
      completedLessons: {}, // { [courseId]: [lessonId1, lessonId2] }
      lastVisited: {},      // { [courseId]: lessonId }
      favorites: []
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(this.data));
      window.dispatchEvent(new CustomEvent('eduxp:progress-updated', { detail: this.data }));
    } catch (e) {
      console.warn('Error guardando progreso:', e);
    }
  }

  /**
   * Inicializa la escucha de sesión de Supabase y sincronización bidireccional
   */
  async initSupabaseSync() {
    try {
      this.currentUser = await getActiveUser();
      if (this.currentUser) {
        await this.syncWithCloud(this.currentUser);
      }

      // Escuchar cambios de sesión (login, logout, token refresh)
      supabase.auth.onAuthStateChange(async (event, session) => {
        const previousUser = this.currentUser;
        this.currentUser = session ? session.user : null;

        window.dispatchEvent(new CustomEvent('eduxp:auth-changed', {
          detail: { user: this.currentUser, event }
        }));

        if (this.currentUser && (!previousUser || previousUser.id !== this.currentUser.id)) {
          await this.syncWithCloud(this.currentUser);
        }
      });
    } catch (err) {
      console.warn('No se pudo inicializar la sincronización con Supabase:', err);
    }
  }

  /**
   * Sincroniza y fusiona el progreso entre la nube y el almacenamiento local
   */
  async syncWithCloud(user) {
    if (!user) return;
    try {
      const username = getCleanUsername(user);

      // 1. Descargar progreso de la nube
      const cloudRecords = await fetchUserProgress(user.id);

      // 2. Fusionar lecciones completadas de la nube hacia local
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

      // 3. Subir cualquier lección que el usuario completó en local mientras estaba offline/anónimo
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

    // Sincronizar en segundo plano con Supabase si hay usuario logueado
    if (this.currentUser) {
      saveLessonToCloud({
        userId: this.currentUser.id,
        username: getCleanUsername(this.currentUser),
        courseSlug: courseId,
        lessonId,
        completed: isCompleted,
        xp
      }).catch(e => console.warn('Sync background error:', e));
    }

    return isCompleted;
  }

  toggleLessonCompleted(courseId, lessonId, xp = 50) {
    const currentState = this.isLessonCompleted(courseId, lessonId);
    return this.setLessonCompleted(courseId, lessonId, !currentState, xp);
  }

  setLastVisited(courseId, lessonId) {
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
    this.data = {
      completedLessons: {},
      lastVisited: {},
      favorites: []
    };
    this.save();
  }
}

export const store = new Store();

