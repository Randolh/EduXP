/**
 * EduXP - Almacén de Estado y Progreso del Estudiante
 * Guarda lecciones completadas, última lección y notas en localStorage.
 */

const STORAGE_KEY_PROGRESS = 'eduxp_progress_v1';

class Store {
  constructor() {
    this.data = this.load();
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

  isLessonCompleted(courseId, lessonId) {
    const courseList = this.data.completedLessons[courseId];
    return Array.isArray(courseList) && courseList.includes(lessonId);
  }

  setLessonCompleted(courseId, lessonId, isCompleted = true) {
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
    return isCompleted;
  }

  toggleLessonCompleted(courseId, lessonId) {
    const currentState = this.isLessonCompleted(courseId, lessonId);
    return this.setLessonCompleted(courseId, lessonId, !currentState);
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
