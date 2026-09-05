import { SCRIPT_URL, AUTH_SHEET_ID, DRIVE_FOLDER_ID, isConfigured } from '../config';

// Key for local demo storage when SCRIPT_URL is not yet configured
const LOCAL_STORAGE_KEY_USERS = 'molienda_demo_users';
const LOCAL_STORAGE_KEY_GRINDS = 'molienda_demo_grinds_';

/**
 * Helper to get local demo users
 */
const getDemoUsers = () => {
  const users = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
  return users ? JSON.parse(users) : [
    { username: 'barista', password: '123', user_sheet_id: 'demo_sheet_barista' }
  ];
};

const saveDemoUsers = (users) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
};

const getDemoGrinds = (userSheetId) => {
  const grinds = localStorage.getItem(LOCAL_STORAGE_KEY_GRINDS + userSheetId);
  if (grinds) return JSON.parse(grinds);
  
  // Initial demo data
  const initial = [
    {
      id: 'demo-1',
      molino: 'Comandante C40',
      metodo: 'V60 / Filtro',
      pais: 'Etiopía Yirgacheffe',
      grado: 22.0,
      comentario: 'Tueste medio-claro. Notas a jazmín y bergamota, acidez brillante.',
      fecha: new Date().toLocaleDateString('es-ES')
    },
    {
      id: 'demo-2',
      molino: 'Eureka Mignon Specialita',
      metodo: 'Espresso',
      pais: 'Colombia Huila',
      grado: 2.8,
      comentario: 'Extracción 18g en / 36g out en 28 segundos. Crema avellanada y cuerpo denso.',
      fecha: new Date(Date.now() - 86400000).toLocaleDateString('es-ES')
    },
    {
      id: 'demo-3',
      molino: '1Zpresso JX-Pro',
      metodo: 'Aeropress',
      pais: 'Kenia Nyeri',
      grado: 15.5,
      comentario: 'Método invertido, 2:00 min infusión. Notas a grosella negra y ciruela.',
      fecha: new Date(Date.now() - 172800000).toLocaleDateString('es-ES')
    }
  ];
  localStorage.setItem(LOCAL_STORAGE_KEY_GRINDS + userSheetId, JSON.stringify(initial));
  return initial;
};

const saveDemoGrinds = (userSheetId, grinds) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_GRINDS + userSheetId, JSON.stringify(grinds));
};

/**
 * Execute request to Google Apps Script Web App
 */
async function callAppsScript(payload) {
  // If not configured, use local simulated backend
  if (!isConfigured()) {
    console.warn('[MoliendaCafé] SCRIPT_URL o IDs no configurados. Operando en Modo Demo Local.');
    return handleLocalDemo(payload);
  }

  try {
    // Note: text/plain avoids CORS preflight OPTIONS in Apps Script Web Apps
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor de Google Apps Script: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[MoliendaCafé] Error llamando a Apps Script:', err);
    throw err;
  }
}

/**
 * Fallback local demo store
 */
function handleLocalDemo(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { action } = payload;
      const users = getDemoUsers();

      if (action === 'login') {
        const found = users.find(u => u.username.toLowerCase() === payload.username.toLowerCase() && u.password === payload.password);
        if (found) {
          resolve({ success: true, user: { username: found.username, user_sheet_id: found.user_sheet_id }, isDemo: true });
        } else {
          resolve({ success: false, message: 'Usuario o contraseña incorrectos (Demo: prueba barista / 123)' });
        }
      } 
      else if (action === 'register') {
        const exists = users.find(u => u.username.toLowerCase() === payload.username.toLowerCase());
        if (exists) {
          resolve({ success: false, message: 'El nombre de usuario ya está registrado en el sistema.' });
        } else {
          const newUser = {
            username: payload.username,
            password: payload.password,
            user_sheet_id: `sheet_${payload.username.toLowerCase()}_${Date.now()}`
          };
          users.push(newUser);
          saveDemoUsers(users);
          resolve({ success: true, user: { username: newUser.username, user_sheet_id: newUser.user_sheet_id }, isDemo: true });
        }
      }
      else if (action === 'getGrinds') {
        const grinds = getDemoGrinds(payload.userSheetId);
        resolve({ success: true, grinds, isDemo: true });
      }
      else if (action === 'addGrind') {
        const grinds = getDemoGrinds(payload.userSheetId);
        const newGrind = {
          id: 'grind_' + Date.now(),
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
          resolve({ success: false, message: 'Molienda no encontrada para actualizar' });
        }
      }
      else if (action === 'deleteGrind') {
        const grinds = getDemoGrinds(payload.userSheetId);
        const filtered = grinds.filter(g => String(g.id) !== String(payload.id));
        saveDemoGrinds(payload.userSheetId, filtered);
        resolve({ success: true, isDemo: true });
      }
      else if (action === 'updateUser') {
        const idx = users.findIndex(u => u.username.toLowerCase() === payload.currentUsername.toLowerCase());
        if (idx !== -1) {
          if (payload.newUsername) users[idx].username = payload.newUsername;
          if (payload.newPassword) users[idx].password = payload.newPassword;
          saveDemoUsers(users);
          resolve({ success: true, user: { username: users[idx].username }, isDemo: true });
        } else {
          resolve({ success: false, message: 'Usuario no encontrado' });
        }
      }
      else {
        resolve({ success: false, message: `Acción '${action}' no reconocida en demo.` });
      }
    }, 250);
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

  // Get user's grinds
  async getGrinds(userSheetId) {
    return callAppsScript({
      action: 'getGrinds',
      userSheetId
    });
  },

  // Add grind
  async addGrind(userSheetId, grindData) {
    return callAppsScript({
      action: 'addGrind',
      userSheetId,
      grind: grindData
    });
  },

  // Update grind
  async updateGrind(userSheetId, grindData) {
    return callAppsScript({
      action: 'updateGrind',
      userSheetId,
      grind: grindData
    });
  },

  // Delete grind
  async deleteGrind(userSheetId, id) {
    return callAppsScript({
      action: 'deleteGrind',
      userSheetId,
      id
    });
  },

  // Update user profile
  async updateUser(currentUsername, newUsername, newPassword) {
    return callAppsScript({
      action: 'updateUser',
      authSheetId: AUTH_SHEET_ID,
      currentUsername,
      newUsername: newUsername ? newUsername.trim() : undefined,
      newPassword: newPassword ? newPassword.trim() : undefined
    });
  }
};
