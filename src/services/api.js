import { SCRIPT_URL, AUTH_SHEET_ID, DRIVE_FOLDER_ID, isConfigured } from '../config';

// Storage keys for local demo simulation
const LOCAL_STORAGE_KEY_USERS = 'grind_demo_users';
const LOCAL_STORAGE_KEY_GRINDS = 'grind_demo_grinds_';
const LOCAL_STORAGE_KEY_MILLS = 'grind_demo_mills_';

/**
 * Client-side input sanitizer to prevent formula injection and dangerous characters
 */
export const sanitize = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  let str = String(val).trim();
  // If string starts with formula trigger in spreadsheet, escape with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str;
};

/**
 * Local demo users
 */
const getDemoUsers = () => {
  const users = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
  return users ? JSON.parse(users) : [];
};

const saveDemoUsers = (users) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
};

/**
 * Local demo mills / grinders
 */
const getDemoMills = (userSheetId) => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MILLS + userSheetId);
  if (saved) return JSON.parse(saved);
  return [];
};

const saveDemoMills = (userSheetId, mills) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_MILLS + userSheetId, JSON.stringify(mills));
};

/**
 * Local demo grinds
 */
const getDemoGrinds = (userSheetId) => {
  const grinds = localStorage.getItem(LOCAL_STORAGE_KEY_GRINDS + userSheetId);
  if (grinds) return JSON.parse(grinds);
  return [];
};

const saveDemoGrinds = (userSheetId, grinds) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_GRINDS + userSheetId, JSON.stringify(grinds));
};

/**
 * Execute request to Google Apps Script Web App
 */
async function callAppsScript(payload) {
  if (!isConfigured()) {
    return handleLocalDemo(payload);
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error en Google Apps Script: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[Grind Tracker] Error llamando a Apps Script:', err);
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Error de CORS / Conexión: Verifica que la Web App en Google Apps Script esté desplegada con "Acceso: Cualquier persona" y ejecutándose como tu usuario.');
    }
    throw err;
  }
}

/**
 * Fallback local demo simulator
 */
function handleLocalDemo(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { action } = payload;
      const users = getDemoUsers();

      if (action === 'login') {
        const found = users.find(
          u => u.username.toLowerCase() === (payload.username || '').toLowerCase() && u.password === payload.password
        );
        if (found) {
          const sessionToken = 'demo_token_' + Date.now();
          found.session_token = sessionToken;
          saveDemoUsers(users);
          resolve({
            success: true,
            user: {
              username: found.username,
              user_sheet_id: found.user_sheet_id,
              session_token: sessionToken
            },
            isDemo: true
          });
        } else {
          resolve({ success: false, message: 'Usuario o contraseña incorrectos (Demo: prueba barista / 123)' });
        }
      } 
      else if (action === 'register') {
        const exists = users.find(u => u.username.toLowerCase() === (payload.username || '').toLowerCase());
        if (exists) {
          resolve({ success: false, message: 'El nombre de usuario ya está registrado en el sistema.' });
        } else {
          const sessionToken = 'demo_token_' + Date.now();
          const newUser = {
            username: payload.username,
            password: payload.password,
            user_sheet_id: `sheet_${payload.username.toLowerCase()}_${Date.now()}`,
            session_token: sessionToken
          };
          users.push(newUser);
          saveDemoUsers(users);

          resolve({
            success: true,
            user: {
              username: newUser.username,
              user_sheet_id: newUser.user_sheet_id,
              session_token: sessionToken
            },
            isDemo: true
          });
        }
      }
      else if (action === 'getGrinders') {
        const mills = getDemoMills(payload.userSheetId);
        resolve({ success: true, grinders: mills, isDemo: true });
      }
      else if (action === 'addGrinder') {
        const mills = getDemoMills(payload.userSheetId);
        const newMill = {
          id: 'demo_mill_' + Date.now(),
          ...payload.grinder,
          fecha_creacion: payload.grinder.fecha_creacion || new Date().toLocaleDateString('es-ES')
        };
        mills.push(newMill);
        saveDemoMills(payload.userSheetId, mills);
        resolve({ success: true, grinder: newMill, isDemo: true });
      }
      else if (action === 'updateGrinder') {
        const mills = getDemoMills(payload.userSheetId);
        const idx = mills.findIndex(m => String(m.id) === String(payload.grinder.id));
        if (idx !== -1) {
          mills[idx] = { ...mills[idx], ...payload.grinder };
          saveDemoMills(payload.userSheetId, mills);
          resolve({ success: true, grinder: mills[idx], isDemo: true });
        } else {
          resolve({ success: false, message: 'Molino no encontrado para actualizar.' });
        }
      }
      else if (action === 'deleteGrinder') {
        const mills = getDemoMills(payload.userSheetId);
        const filtered = mills.filter(m => String(m.id) !== String(payload.id));
        saveDemoMills(payload.userSheetId, filtered);
        resolve({ success: true, isDemo: true });
      }
      else if (action === 'getGrinds') {
        const grinds = getDemoGrinds(payload.userSheetId);
        resolve({ success: true, grinds, isDemo: true });
      }
      else if (action === 'addGrind') {
        const grinds = getDemoGrinds(payload.userSheetId);
        const newGrind = {
          id: 'demo_grind_' + Date.now(),
          ...payload.grind,
          fecha: payload.grind.fecha || new Date().toLocaleDateString('es-ES')
        };
        grinds.unshift(newGrind);
        saveDemoGrinds(payload.userSheetId, grinds);
        resolve({ success: true, grind: newGrind, isDemo: true });
      }
      else if (action === 'updateGrind') {
        const grinds = getDemoGrinds(payload.userSheetId);
        const idx = grinds.findIndex(g => String(g.id) === String(payload.grind.id));
        if (idx !== -1) {
          grinds[idx] = { ...grinds[idx], ...payload.grind };
          saveDemoGrinds(payload.userSheetId, grinds);
          resolve({ success: true, grind: grinds[idx], isDemo: true });
        } else {
          resolve({ success: false, message: 'Molienda no encontrada para actualizar.' });
        }
      }
      else if (action === 'deleteGrind') {
        const grinds = getDemoGrinds(payload.userSheetId);
        const filtered = grinds.filter(g => String(g.id) !== String(payload.id));
        saveDemoGrinds(payload.userSheetId, filtered);
        resolve({ success: true, isDemo: true });
      }
      else if (action === 'updateUser') {
        const idx = users.findIndex(u => u.username.toLowerCase() === (payload.username || '').toLowerCase());
        if (idx !== -1) {
          if (payload.newUsername) users[idx].username = payload.newUsername;
          if (payload.newPassword) users[idx].password = payload.newPassword;
          saveDemoUsers(users);
          resolve({ success: true, user: { username: users[idx].username }, isDemo: true });
        } else {
          resolve({ success: false, message: 'Usuario no encontrado en modo demo.' });
        }
      }
      else {
        resolve({ success: false, message: `Acción '${action}' no reconocida en demo.` });
      }
    }, 200);
  });
}

/**
 * Public API client methods
 */
export const api = {
  // Login
  async login(username, password) {
    return callAppsScript({
      action: 'login',
      authSheetId: AUTH_SHEET_ID,
      username: username.trim(),
      password: password.trim()
    });
  },

  // Register
  async register(username, password) {
    return callAppsScript({
      action: 'register',
      authSheetId: AUTH_SHEET_ID,
      driveFolderId: DRIVE_FOLDER_ID,
      username: username.trim(),
      password: password.trim()
    });
  },

  // --- Grinders / Molinos ---
  async getGrinders(userSheetId, username, sessionToken) {
    return callAppsScript({
      action: 'getGrinders',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken
    });
  },

  async addGrinder(userSheetId, grinderData, username, sessionToken) {
    return callAppsScript({
      action: 'addGrinder',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      grinder: grinderData
    });
  },

  async updateGrinder(userSheetId, grinderData, username, sessionToken) {
    return callAppsScript({
      action: 'updateGrinder',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      grinder: grinderData
    });
  },

  async deleteGrinder(userSheetId, id, username, sessionToken) {
    return callAppsScript({
      action: 'deleteGrinder',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      id
    });
  },

  // --- Grinds / Moliendas ---
  async getGrinds(userSheetId, username, sessionToken) {
    return callAppsScript({
      action: 'getGrinds',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken
    });
  },

  async addGrind(userSheetId, grindData, username, sessionToken) {
    return callAppsScript({
      action: 'addGrind',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      grind: grindData
    });
  },

  async updateGrind(userSheetId, grindData, username, sessionToken) {
    return callAppsScript({
      action: 'updateGrind',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      grind: grindData
    });
  },

  async deleteGrind(userSheetId, id, username, sessionToken) {
    return callAppsScript({
      action: 'deleteGrind',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      id
    });
  },

  // --- User Profile ---
  async updateUser(username, newUsername, newPassword, sessionToken) {
    return callAppsScript({
      action: 'updateUser',
      authSheetId: AUTH_SHEET_ID,
      username,
      sessionToken,
      newUsername: newUsername ? newUsername.trim() : undefined,
      newPassword: newPassword ? newPassword.trim() : undefined
    });
  }
};
