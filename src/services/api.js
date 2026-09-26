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
  // If string starts with spreadsheet formula trigger (=, +, -, @), prefix with apostrophe
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str;
};

/**
 * Normalizes and serializes a grinder payload before sending to Apps Script or saving to storage
 * Schema: id | name | type | total_clicks | total_dial_numbers | dial_steps | created_at
 */
export const serializeGrinder = (grinderData = {}) => {
  const rawType = String(grinderData.type || grinderData.tipo || 'Clicks').trim();
  const isDial = rawType.toLowerCase() === 'dial';
  const type = isDial ? 'Dial' : 'Clicks';

  const name = sanitize(grinderData.name || grinderData.nombre || '');
  const totalClicks = !isDial ? (Number(grinderData.total_clicks) || 40) : null;
  const totalDialNumbers = isDial ? (Number(grinderData.total_dial_numbers ?? grinderData.total_numeros) || 11) : null;
  const dialSteps = isDial ? (Number(grinderData.dial_steps ?? grinderData.pasos_por_numero) || 3) : null;
  const createdAt = grinderData.created_at || grinderData.fecha_creacion || new Date().toLocaleDateString('es-ES');

  return {
    id: grinderData.id,
    name,
    nombre: name, // Dual support
    type,
    tipo: type.toLowerCase(), // Dual support
    total_clicks: totalClicks,
    total_dial_numbers: totalDialNumbers,
    total_numeros: totalDialNumbers, // Dual support
    dial_steps: dialSteps,
    pasos_por_numero: dialSteps, // Dual support
    created_at: createdAt,
    fecha_creacion: createdAt // Dual support
  };
};

/**
 * Parses and maps a grinder response from Apps Script or cache to ensure full dual compatibility
 */
export const parseGrinder = (item) => {
  if (!item) return item;
  const rawType = String(item.type || item.tipo || 'Clicks').trim();
  const isDial = rawType.toLowerCase() === 'dial';
  const type = isDial ? 'Dial' : 'Clicks';

  const name = String(item.name || item.nombre || '');
  const totalClicks = (!isDial && item.total_clicks != null && item.total_clicks !== '' && !isNaN(item.total_clicks))
    ? Number(item.total_clicks)
    : null;
  const rawDialNumbers = item.total_dial_numbers ?? item.total_numeros;
  const totalDialNumbers = (isDial && rawDialNumbers != null && rawDialNumbers !== '' && !isNaN(rawDialNumbers))
    ? Number(rawDialNumbers)
    : null;
  const rawDialSteps = item.dial_steps ?? item.pasos_por_numero;
  const dialSteps = (isDial && rawDialSteps != null && rawDialSteps !== '' && !isNaN(rawDialSteps))
    ? Number(rawDialSteps)
    : null;
  const createdAt = String(item.created_at || item.fecha_creacion || '');

  return {
    id: String(item.id || ''),
    name,
    nombre: name,
    type,
    tipo: type.toLowerCase(),
    total_clicks: totalClicks,
    total_dial_numbers: totalDialNumbers,
    total_numeros: totalDialNumbers,
    dial_steps: dialSteps,
    pasos_por_numero: dialSteps,
    created_at: createdAt,
    fecha_creacion: createdAt
  };
};

/**
 * Normalizes and serializes a grind payload before sending to Apps Script or saving to storage
 * Schema: id | molino | coffee_name | roaster | metodo | variedad | proceso | pais | flavor_profile | water_temp | dose_in | yield_out | grado | comentario | fecha
 */
export const serializeGrind = (grindData = {}) => {
  const coffeeName = sanitize(grindData.coffee_name || grindData.nombre_cafe || '');
  const roaster = sanitize(grindData.roaster || grindData.tostadero || '');
  const flavorProfile = sanitize(grindData.flavor_profile || grindData.perfil_sabor || '');
  
  const rawWaterTemp = grindData.water_temp ?? grindData.temp_agua;
  const waterTemp = (rawWaterTemp !== null && rawWaterTemp !== undefined && rawWaterTemp !== '' && !isNaN(rawWaterTemp))
    ? Number(rawWaterTemp)
    : null;

  const rawDoseIn = grindData.dose_in ?? grindData.cafe_in;
  const doseIn = (rawDoseIn !== null && rawDoseIn !== undefined && rawDoseIn !== '' && !isNaN(rawDoseIn))
    ? Number(rawDoseIn)
    : null;

  const rawYieldOut = grindData.yield_out ?? grindData.cafe_out;
  const yieldOut = (rawYieldOut !== null && rawYieldOut !== undefined && rawYieldOut !== '' && !isNaN(rawYieldOut))
    ? Number(rawYieldOut)
    : null;

  const fecha = grindData.fecha || new Date().toLocaleDateString('es-ES');

  return {
    id: grindData.id,
    molino: sanitize(grindData.molino || ''),
    coffee_name: coffeeName,
    nombre_cafe: coffeeName,
    roaster: roaster,
    tostadero: roaster,
    metodo: sanitize(grindData.metodo || 'Espresso'),
    variedad: sanitize(grindData.variedad || ''),
    proceso: sanitize(grindData.proceso || ''),
    pais: sanitize(grindData.pais || ''),
    flavor_profile: flavorProfile,
    perfil_sabor: flavorProfile,
    water_temp: waterTemp,
    temp_agua: waterTemp,
    dose_in: doseIn,
    cafe_in: doseIn,
    yield_out: yieldOut,
    cafe_out: yieldOut,
    grado: grindData.grado !== undefined ? grindData.grado : 0,
    comentario: sanitize(grindData.comentario || ''),
    fecha
  };
};

/**
 * Parses and maps a grind response from Apps Script or cache with extended attributes
 */
export const parseGrind = (item) => {
  if (!item) return item;
  const coffeeName = String(item.coffee_name || item.nombre_cafe || '');
  const roaster = String(item.roaster || item.tostadero || '');
  const flavorProfile = String(item.flavor_profile || item.perfil_sabor || '');

  const rawWaterTemp = item.water_temp ?? item.temp_agua;
  const waterTemp = (rawWaterTemp !== null && rawWaterTemp !== undefined && rawWaterTemp !== '' && !isNaN(rawWaterTemp))
    ? Number(rawWaterTemp)
    : null;

  const rawDoseIn = item.dose_in ?? item.cafe_in;
  const doseIn = (rawDoseIn !== null && rawDoseIn !== undefined && rawDoseIn !== '' && !isNaN(rawDoseIn))
    ? Number(rawDoseIn)
    : null;

  const rawYieldOut = item.yield_out ?? item.cafe_out;
  const yieldOut = (rawYieldOut !== null && rawYieldOut !== undefined && rawYieldOut !== '' && !isNaN(rawYieldOut))
    ? Number(rawYieldOut)
    : null;

  return {
    id: String(item.id || ''),
    molino: String(item.molino || ''),
    coffee_name: coffeeName,
    nombre_cafe: coffeeName,
    roaster: roaster,
    tostadero: roaster,
    metodo: String(item.metodo || 'Espresso'),
    variedad: String(item.variedad || ''),
    proceso: String(item.proceso || ''),
    pais: String(item.pais || ''),
    flavor_profile: flavorProfile,
    perfil_sabor: flavorProfile,
    water_temp: waterTemp,
    temp_agua: waterTemp,
    dose_in: doseIn,
    cafe_in: doseIn,
    yield_out: yieldOut,
    cafe_out: yieldOut,
    grado: item.grado !== undefined ? item.grado : 0,
    comentario: String(item.comentario || ''),
    fecha: String(item.fecha || '')
  };
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
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.map(parseGrinder);
    } catch (e) {
      console.warn('Error parseando molinos locales de demo:', e);
    }
  }
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
  if (grinds) {
    try {
      const parsed = JSON.parse(grinds);
      return parsed.map(parseGrind);
    } catch (e) {
      console.warn('Error parseando moliendas locales de demo:', e);
    }
  }
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
      throw new Error('Error de CORS / Conexión: Verifica que la Web App en Google Apps Script esté desplegada como Nueva Versión con "Acceso: Cualquier persona" y ejecutándose como tu usuario.');
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
        resolve({ success: true, grinders: mills.map(parseGrinder), isDemo: true });
      }
      else if (action === 'addGrinder') {
        const mills = getDemoMills(payload.userSheetId);
        const serialized = serializeGrinder({
          id: 'demo_mill_' + Date.now(),
          ...payload.grinder
        });
        const newMill = parseGrinder(serialized);
        mills.push(newMill);
        saveDemoMills(payload.userSheetId, mills);
        resolve({ success: true, grinder: newMill, isDemo: true });
      }
      else if (action === 'updateGrinder') {
        const mills = getDemoMills(payload.userSheetId);
        const idx = mills.findIndex(m => String(m.id) === String(payload.grinder.id));
        if (idx !== -1) {
          const updated = parseGrinder({
            ...mills[idx],
            ...serializeGrinder(payload.grinder)
          });
          mills[idx] = updated;
          saveDemoMills(payload.userSheetId, mills);
          resolve({ success: true, grinder: updated, isDemo: true });
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
        resolve({ success: true, grinds: grinds.map(parseGrind), isDemo: true });
      }
      else if (action === 'addGrind') {
        const grinds = getDemoGrinds(payload.userSheetId);
        const serialized = serializeGrind({
          id: 'demo_grind_' + Date.now(),
          ...payload.grind
        });
        const newGrind = parseGrind(serialized);
        grinds.unshift(newGrind);
        saveDemoGrinds(payload.userSheetId, grinds);
        resolve({ success: true, grind: newGrind, isDemo: true });
      }
      else if (action === 'updateGrind') {
        const grinds = getDemoGrinds(payload.userSheetId);
        const idx = grinds.findIndex(g => String(g.id) === String(payload.grind.id));
        if (idx !== -1) {
          const updated = parseGrind({
            ...grinds[idx],
            ...serializeGrind(payload.grind)
          });
          grinds[idx] = updated;
          saveDemoGrinds(payload.userSheetId, grinds);
          resolve({ success: true, grind: updated, isDemo: true });
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
    const res = await callAppsScript({
      action: 'getGrinders',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken
    });

    if (res && res.success && Array.isArray(res.grinders)) {
      res.grinders = res.grinders.map(parseGrinder);
    }
    return res;
  },

  async addGrinder(userSheetId, grinderData, username, sessionToken) {
    const payloadGrinder = serializeGrinder(grinderData);
    const res = await callAppsScript({
      action: 'addGrinder',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      grinder: payloadGrinder
    });

    if (res && res.success && res.grinder) {
      res.grinder = parseGrinder(res.grinder);
    }
    return res;
  },

  async updateGrinder(userSheetId, grinderData, username, sessionToken) {
    const payloadGrinder = serializeGrinder(grinderData);
    const res = await callAppsScript({
      action: 'updateGrinder',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      grinder: payloadGrinder
    });

    if (res && res.success && res.grinder) {
      res.grinder = parseGrinder(res.grinder);
    }
    return res;
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
    const res = await callAppsScript({
      action: 'getGrinds',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken
    });

    if (res && res.success && Array.isArray(res.grinds)) {
      res.grinds = res.grinds.map(parseGrind);
    }
    return res;
  },

  async addGrind(userSheetId, grindData, username, sessionToken) {
    const payloadGrind = serializeGrind(grindData);
    const res = await callAppsScript({
      action: 'addGrind',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      grind: payloadGrind
    });

    if (res && res.success && res.grind) {
      res.grind = parseGrind(res.grind);
    }
    return res;
  },

  async updateGrind(userSheetId, grindData, username, sessionToken) {
    const payloadGrind = serializeGrind(grindData);
    const res = await callAppsScript({
      action: 'updateGrind',
      authSheetId: AUTH_SHEET_ID,
      userSheetId,
      username,
      sessionToken,
      grind: payloadGrind
    });

    if (res && res.success && res.grind) {
      res.grind = parseGrind(res.grind);
    }
    return res;
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
