/**
 * EduXP - Servicio de Integración con Supabase
 * Autenticación basada en Usuario/Contraseña (email virtual) y Sincronización en la Nube
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://acbfgkhvfhiccolrkdwj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjYmZna2h2ZmhpY2NvbHJrZHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NjY0MzUsImV4cCI6MjEwNTM0MjQzNX0.XzlY78_DUjVmCwXHUqpwFCvyaChYXy0ltJb_wKWeITQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

/**
 * Convierte un nombre de usuario en un correo sintético interno para Supabase Auth
 * @param {string} username
 * @returns {string} ej. "carlos@eduxp.local"
 */
export function usernameToEmail(username) {
  const clean = String(username || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '');
  return `${clean}@eduxp.local`;
}

/**
 * Extrae el nombre de usuario limpio desde el objeto de usuario de Supabase
 * @param {Object} user
 * @returns {string}
 */
export function getCleanUsername(user) {
  if (!user) return '';
  if (user.user_metadata && user.user_metadata.username) {
    return user.user_metadata.username;
  }
  if (user.email) {
    return user.email.replace('@eduxp.local', '');
  }
  return 'Estudiante';
}

/**
 * Registra una nueva cuenta de usuario (solo con usuario y contraseña)
 * @param {string} username
 * @param {string} password
 */
export async function signUpWithUsername(username, password) {
  const cleanUser = String(username || '').trim();
  if (cleanUser.length < 3) {
    throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
  }
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const email = usernameToEmail(cleanUser);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: cleanUser
      }
    }
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
      throw new Error(`El usuario "${cleanUser}" ya está registrado. Por favor inicia sesión.`);
    }
    throw error;
  }

  return data.user;
}

/**
 * Inicia sesión usando usuario y contraseña
 * @param {string} username
 * @param {string} password
 */
export async function signInWithUsername(username, password) {
  const cleanUser = String(username || '').trim();
  if (!cleanUser || !password) {
    throw new Error('Por favor ingresa tu usuario y contraseña.');
  }

  const email = usernameToEmail(cleanUser);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid')) {
      throw new Error('Usuario o contraseña incorrectos. Verifica tus credenciales.');
    }
    throw error;
  }

  return data.user;
}

/**
 * Cierra la sesión activa del usuario
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

/**
 * Obtiene el usuario autenticado actual si existe
 */
export async function getActiveUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? session.user : null;
}

/**
 * Descarga todo el progreso de cursos del usuario desde la tabla user_progress
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchUserProgress(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('course_slug, lesson_id, completed, xp_earned')
      .eq('user_id', userId);

    if (error) {
      console.warn('Error obteniendo progreso desde Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Error en fetchUserProgress:', err);
    return [];
  }
}

/**
 * Guarda o actualiza el estado de una lección en la tabla user_progress
 * @param {Object} params
 */
export async function saveLessonToCloud({ userId, username, courseSlug, lessonId, completed, xp = 0 }) {
  if (!userId) return;
  try {
    const record = {
      user_id: userId,
      username: username || 'estudiante',
      course_slug: courseSlug,
      lesson_id: lessonId,
      completed: Boolean(completed),
      xp_earned: completed ? xp : 0,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_progress')
      .upsert(record, { onConflict: 'user_id, course_slug, lesson_id' });

    if (error) {
      console.warn('Error guardando lección en Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Error en saveLessonToCloud:', err);
  }
}

/**
 * Sube y sincroniza el progreso que el usuario tenía guardado localmente hacia Supabase
 * @param {string} userId
 * @param {string} username
 * @param {Object} localStoreProgress
 */
export async function syncLocalProgressToCloud(userId, username, localStoreProgress) {
  if (!userId || !localStoreProgress || !localStoreProgress.completedLessons) return;

  try {
    const records = [];
    const completed = localStoreProgress.completedLessons; // { "slug/lessonId": true }

    for (const [key, isDone] of Object.entries(completed)) {
      if (isDone) {
        const [courseSlug, lessonId] = key.split('/');
        if (courseSlug && lessonId) {
          records.push({
            user_id: userId,
            username: username || 'estudiante',
            course_slug: courseSlug,
            lesson_id: lessonId,
            completed: true,
            xp_earned: 50,
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    if (records.length > 0) {
      const { error } = await supabase
        .from('user_progress')
        .upsert(records, { onConflict: 'user_id, course_slug, lesson_id' });

      if (error) {
        console.warn('Error en sincronización inicial con Supabase:', error.message);
      }
    }
  } catch (err) {
    console.warn('Error sincronizando local a nube:', err);
  }
}

/**
 * Elimina todo el progreso de un curso en la nube para un usuario específico
 * @param {string} userId
 * @param {string} courseSlug
 */
export async function resetCourseProgressInCloud(userId, courseSlug) {
  if (!userId || !courseSlug) return;
  try {
    // 1. Eliminar los registros de la tabla user_progress para este usuario y curso
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId)
      .eq('course_slug', courseSlug);

    if (error) {
      console.warn('Aviso al eliminar registros en Supabase:', error.message);
    }

    // 2. Asegurar que cualquier registro remanente pase a completed = false y xp = 0
    await supabase
      .from('user_progress')
      .update({ completed: false, xp_earned: 0 })
      .eq('user_id', userId)
      .eq('course_slug', courseSlug);

  } catch (err) {
    console.warn('Error en resetCourseProgressInCloud:', err);
  }
}

