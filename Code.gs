/**
 * =========================================================================
 * Grind Tracker - Backend Google Apps Script (Code.gs)
 * =========================================================================
 * API REST Serverless para la PWA de Grind Tracker.
 * 
 * Arquitectura y Principios de Integración:
 *  - Autenticación con Session Tokens criptográficos (UUID) y TTL de 30 días.
 *  - Hojas privadas aisladas en Google Drive (DRIVE_FOLDER_ID).
 *  - Auto-creación y sincronización de pestaña 'molinos' al registrar o iniciar sesión.
 *  - Auto-actualización y migración dinámica de cabeceras en 'moliendas' y 'molinos'
 *    sin pérdida de datos existentes (compatibilidad total con formatos previos).
 *  - Sanitización estricta de entradas contra inyecciones de fórmulas (=, +, -, @).
 * 
 * Endpoints gestionados en doPost(e):
 *  - login          : Valida credenciales, genera Session Token y asegura pestañas 'molinos' y 'moliendas'.
 *  - register       : Crea usuario en Auth, spreadsheet privado en Drive e inicializa 'moliendas' y 'molinos'.
 *  - getGrinders    : Obtiene la lista de molinos configurados del usuario.
 *  - addGrinder     : Agrega un nuevo molino (tipo Clicks o Dial).
 *  - updateGrinder  : Actualiza configuración de un molino existente.
 *  - deleteGrinder  : Elimina un molino por su ID.
 *  - getGrinds      : Obtiene el listado de moliendas registradas.
 *  - addGrind       : Agrega una nueva molienda con atributos extendidos de café y espresso.
 *  - updateGrind    : Actualiza una molienda existente.
 *  - deleteGrind    : Elimina una molienda por su ID.
 *  - updateUser     : Actualiza nombre de usuario o contraseña en Auth.
 */

// 1. Cabeceras estándar para la hoja de autenticación global
var AUTH_HEADERS = ["username", "password", "user_sheet_id", "session_token", "session_expiry", "created_at"];

// 2. Cabeceras estándar para la pestaña 'molinos'
var MOLINOS_HEADERS = [
  "id",
  "name",
  "type",
  "total_clicks",
  "total_dial_numbers",
  "dial_steps",
  "created_at"
];

// 3. Cabeceras estándar extendidas para la pestaña 'moliendas'
var GRIND_HEADERS = [
  "id",
  "molino",
  "coffee_name",
  "roaster",
  "metodo",
  "variedad",
  "proceso",
  "pais",
  "flavor_profile",
  "water_temp",
  "dose_in",
  "yield_out",
  "grado",
  "comentario",
  "fecha"
];

// Tiempo de vida de la sesión: 30 días en milisegundos
var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Petición GET para monitorizar la salud del servicio y CORS
 */
function doGet(e) {
  return createJsonResponse({
    status: "online",
    name: "Grind Tracker API",
    version: "2.1.0",
    message: "Servicio Google Apps Script de Grind Tracker activo y sincronizado.",
    timestamp: new Date().toISOString()
  });
}

/**
 * Petición OPTIONS para responder a preflights CORS de navegadores
 */
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Enrutador principal de peticiones POST
 */
function doPost(e) {
  try {
    var rawContent = e.postData ? e.postData.contents : null;
    if (!rawContent) {
      return createJsonResponse({
        success: false,
        message: "No se recibieron datos en el cuerpo de la petición."
      });
    }

    var data = JSON.parse(rawContent);
    var action = data.action;

    switch (action) {
      case "login":
        return handleLogin(data);
      case "register":
        return handleRegister(data);
      case "getGrinders":
        return handleGetGrinders(data);
      case "addGrinder":
        return handleAddGrinder(data);
      case "updateGrinder":
        return handleUpdateGrinder(data);
      case "deleteGrinder":
        return handleDeleteGrinder(data);
      case "getGrinds":
        return handleGetGrinds(data);
      case "addGrind":
        return handleAddGrind(data);
      case "updateGrind":
        return handleUpdateGrind(data);
      case "deleteGrind":
        return handleDeleteGrind(data);
      case "updateUser":
        return handleUpdateUser(data);
      default:
        return createJsonResponse({
          success: false,
          message: "Acción no reconocida: " + action
        });
    }
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "Error interno en Apps Script: " + error.toString()
    });
  }
}

/**
 * =========================================================================
 * 1. SEGURIDAD: SANITIZACIÓN & VALIDACIÓN DE SESIÓN
 * =========================================================================
 */

/**
 * Sanitiza valores contra Formula Injection (=, +, -, @) y scripts maliciosos
 */
function sanitizeInput(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "number" || typeof val === "boolean") return val;
  var str = String(val).trim();
  
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str; // Forzar interpretación como texto plano en Sheets
  }
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  return str;
}

/**
 * Valida el Session Token del usuario y comprueba la propiedad de la hoja
 */
function validateSession(authSheetId, username, sessionToken, userSheetId) {
  if (!authSheetId || !username) {
    return { valid: false, message: "Faltan credenciales de sesión requeridas." };
  }

  var authSheet = getOrCreateAuthSheet(authSheetId);
  var values = authSheet.getDataRange().getValues();
  var userLower = String(username).toLowerCase().trim();
  var now = new Date().getTime();

  for (var i = 1; i < values.length; i++) {
    var rowUser = String(values[i][0]).toLowerCase().trim();
    var rowSheetId = String(values[i][2] || "").trim();
    var rowToken = String(values[i][3] || "").trim();
    var rowExpiry = values[i][4] ? new Date(values[i][4]).getTime() : 0;

    if (rowUser === userLower) {
      // Migración automática de usuarios previos sin token
      if (!rowToken) {
        var newToken = sessionToken || Utilities.getUuid();
        var newExpiry = new Date(now + SESSION_TTL_MS).toISOString();
        authSheet.getRange(i + 1, 4).setValue(newToken);
        authSheet.getRange(i + 1, 5).setValue(newExpiry);
        rowToken = newToken;
      }

      if (sessionToken && rowToken && rowToken !== sessionToken) {
        return { valid: false, unauthorized: true, message: "Token de sesión no válido." };
      }
      if (rowExpiry && rowExpiry < now) {
        return { valid: false, unauthorized: true, message: "La sesión ha expirado. Inicia sesión nuevamente." };
      }
      if (userSheetId && rowSheetId && rowSheetId !== userSheetId) {
        return { valid: false, unauthorized: true, message: "Acceso no autorizado a la hoja solicitada." };
      }

      return {
        valid: true,
        rowIndex: i + 1,
        username: values[i][0],
        userSheetId: rowSheetId
      };
    }
  }

  return { valid: false, unauthorized: true, message: "Usuario no encontrado en la base de datos de Auth." };
}

/**
 * =========================================================================
 * 2. AUTENTICACIÓN: LOGIN, REGISTRO & PERFIL
 * =========================================================================
 */

function handleLogin(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username || "").toLowerCase().trim();
  var password = String(data.password || "").trim();

  if (!authSheetId || !username || !password) {
    return createJsonResponse({ success: false, message: "Faltan parámetros de autenticación." });
  }

  var authSheet = getOrCreateAuthSheet(authSheetId);
  var values = authSheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    var rowUser = String(values[i][0]).toLowerCase().trim();
    var rowPass = String(values[i][1]).trim();
    var rowSheetId = String(values[i][2]).trim();

    if (rowUser === username) {
      if (rowPass === password) {
        var sessionToken = Utilities.getUuid();
        var expiryDate = new Date(new Date().getTime() + SESSION_TTL_MS).toISOString();
        var rowNumber = i + 1;

        authSheet.getRange(rowNumber, 4).setValue(sessionToken);
        authSheet.getRange(rowNumber, 5).setValue(expiryDate);

        // Auto-sincronización y comprobación de pestañas 'molinos' y 'moliendas' en login
        if (rowSheetId) {
          try {
            var userSpreadsheet = SpreadsheetApp.openById(rowSheetId);
            getOrCreateMolinosSheet(userSpreadsheet);
            getOrCreateMoliendasSheet(userSpreadsheet);
          } catch (syncErr) {
            Logger.log("Aviso de sincronización en login: " + syncErr.toString());
          }
        }

        return createJsonResponse({
          success: true,
          user: {
            username: values[i][0],
            user_sheet_id: rowSheetId,
            session_token: sessionToken
          }
        });
      } else {
        return createJsonResponse({ success: false, message: "Contraseña incorrecta." });
      }
    }
  }

  return createJsonResponse({ success: false, message: "Usuario no encontrado." });
}

function handleRegister(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var driveFolderId = sanitizeInput(data.driveFolderId);
  var username = sanitizeInput(data.username || "").trim();
  var password = String(data.password || "").trim();

  if (!authSheetId || !driveFolderId || !username || !password) {
    return createJsonResponse({ success: false, message: "Faltan datos para completar el registro." });
  }

  var authSheet = getOrCreateAuthSheet(authSheetId);
  var values = authSheet.getDataRange().getValues();

  // Verificar unicidad de usuario
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === username.toLowerCase()) {
      return createJsonResponse({ success: false, message: "El usuario '" + username + "' ya está registrado." });
    }
  }

  // 1. Obtener la carpeta privada en Google Drive
  var folder;
  try {
    folder = DriveApp.getFolderById(driveFolderId);
  } catch (err) {
    return createJsonResponse({
      success: false,
      message: "No se encontró la carpeta en Google Drive con ID: " + driveFolderId + ". Verifica los permisos y el ID."
    });
  }

  // 2. Crear nuevo Spreadsheet individual para el usuario dentro de DRIVE_FOLDER_ID
  var sheetTitle = "GrindTracker_" + username;
  var newSpreadsheet = SpreadsheetApp.create(sheetTitle);
  var newUserSheetId = newSpreadsheet.getId();

  var file = DriveApp.getFileById(newUserSheetId);
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  // Inicializar pestañas 'moliendas' y 'molinos' con cabeceras estándar
  getOrCreateMoliendasSheet(newSpreadsheet);
  getOrCreateMolinosSheet(newSpreadsheet);

  // 3. Generar Session Token y registrar credenciales en Auth Sheet
  var sessionToken = Utilities.getUuid();
  var sessionExpiry = new Date(new Date().getTime() + SESSION_TTL_MS).toISOString();

  authSheet.appendRow([
    username,
    password,
    newUserSheetId,
    sessionToken,
    sessionExpiry,
    new Date().toISOString()
  ]);

  return createJsonResponse({
    success: true,
    user: {
      username: username,
      user_sheet_id: newUserSheetId,
      session_token: sessionToken
    }
  });
}

function handleUpdateUser(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username || "").trim();
  var sessionToken = sanitizeInput(data.sessionToken || "").trim();
  var newUsername = data.newUsername ? sanitizeInput(data.newUsername).trim() : null;
  var newPassword = data.newPassword ? String(data.newPassword).trim() : null;

  var session = validateSession(authSheetId, username, sessionToken);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  var authSheet = getOrCreateAuthSheet(authSheetId);
  var rowNumber = session.rowIndex;

  if (newUsername && newUsername.toLowerCase() !== username.toLowerCase()) {
    var values = authSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).toLowerCase().trim() === newUsername.toLowerCase()) {
        return createJsonResponse({ success: false, message: "El nuevo nombre de usuario ya está en uso." });
      }
    }
    authSheet.getRange(rowNumber, 1).setValue(newUsername);
  }

  if (newPassword) {
    authSheet.getRange(rowNumber, 2).setValue(newPassword);
  }

  return createJsonResponse({
    success: true,
    message: "Perfil actualizado correctamente.",
    user: { username: newUsername || username }
  });
}

/**
 * =========================================================================
 * 3. MÓDULO: MIS MOLINOS (CRUD)
 * =========================================================================
 */

function handleGetGrinders(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username);
  var sessionToken = sanitizeInput(data.sessionToken);
  var userSheetId = sanitizeInput(data.userSheetId);

  var session = validateSession(authSheetId, username, sessionToken, userSheetId);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMolinosSheet(ss);
  var values = sheet.getDataRange().getValues();

  var grinders = [];
  if (values.length > 1) {
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row[0]) {
        var rawType = String(row[2] || "Clicks").trim();
        var isDial = rawType.toLowerCase() === "dial";
        var typeFormatted = isDial ? "Dial" : "Clicks";
        var totalClicks = (!isDial && row[3] !== "" && row[3] !== null && !isNaN(row[3])) ? parseFloat(row[3]) : null;
        var totalDialNumbers = (isDial && row[4] !== "" && row[4] !== null && !isNaN(row[4])) ? parseFloat(row[4]) : null;
        var dialSteps = (isDial && row[5] !== "" && row[5] !== null && !isNaN(row[5])) ? parseFloat(row[5]) : null;
        var createdAt = String(row[6] || "");

        grinders.push({
          id: String(row[0]),
          name: String(row[1] || ""),
          nombre: String(row[1] || ""),
          type: typeFormatted,
          tipo: typeFormatted.toLowerCase(),
          total_clicks: totalClicks,
          total_dial_numbers: totalDialNumbers,
          total_numeros: totalDialNumbers,
          dial_steps: dialSteps,
          pasos_por_numero: dialSteps,
          created_at: createdAt,
          fecha_creacion: createdAt
        });
      }
    }
  }

  return createJsonResponse({ success: true, grinders: grinders });
}

function handleAddGrinder(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username);
  var sessionToken = sanitizeInput(data.sessionToken);
  var userSheetId = sanitizeInput(data.userSheetId);
  var grinder = data.grinder;

  var session = validateSession(authSheetId, username, sessionToken, userSheetId);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  if (!grinder) {
    return createJsonResponse({ success: false, message: "Datos del molino requeridos." });
  }

  var name = sanitizeInput(grinder.name || grinder.nombre || "");
  if (!name) {
    return createJsonResponse({ success: false, message: "El nombre del molino es obligatorio." });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMolinosSheet(ss);

  var id = grinder.id || ("mill_" + new Date().getTime());
  var rawType = String(grinder.type || grinder.tipo || "Clicks").trim();
  var isDial = rawType.toLowerCase() === "dial";
  var type = isDial ? "Dial" : "Clicks";

  // Requisito: Si es Clicks -> total_clicks activo; total_dial_numbers y dial_steps vacíos.
  // Requisito: Si es Dial -> total_dial_numbers y dial_steps activos; total_clicks vacío.
  var totalClicks = !isDial ? (parseFloat(grinder.total_clicks) || 40) : "";
  var totalDialNumbers = isDial ? (parseFloat(grinder.total_dial_numbers || grinder.total_numeros) || 11) : "";
  var dialSteps = isDial ? (parseFloat(grinder.dial_steps || grinder.pasos_por_numero) || 3) : "";
  var createdAt = grinder.created_at || grinder.fecha_creacion || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  sheet.appendRow([
    id,
    name,
    type,
    totalClicks,
    totalDialNumbers,
    dialSteps,
    createdAt
  ]);

  var savedGrinder = {
    id: id,
    name: name,
    nombre: name,
    type: type,
    tipo: type.toLowerCase(),
    total_clicks: totalClicks !== "" ? totalClicks : null,
    total_dial_numbers: totalDialNumbers !== "" ? totalDialNumbers : null,
    total_numeros: totalDialNumbers !== "" ? totalDialNumbers : null,
    dial_steps: dialSteps !== "" ? dialSteps : null,
    pasos_por_numero: dialSteps !== "" ? dialSteps : null,
    created_at: createdAt,
    fecha_creacion: createdAt
  };

  return createJsonResponse({
    success: true,
    grinder: savedGrinder
  });
}

function handleUpdateGrinder(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username);
  var sessionToken = sanitizeInput(data.sessionToken);
  var userSheetId = sanitizeInput(data.userSheetId);
  var grinder = data.grinder;

  var session = validateSession(authSheetId, username, sessionToken, userSheetId);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  if (!grinder || !grinder.id) {
    return createJsonResponse({ success: false, message: "ID de molino requerido." });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMolinosSheet(ss);
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(grinder.id)) {
      var rowNumber = i + 1;
      var name = sanitizeInput(grinder.name || grinder.nombre || values[i][1]);
      var rawType = String(grinder.type || grinder.tipo || values[i][2] || "Clicks").trim();
      var isDial = rawType.toLowerCase() === "dial";
      var type = isDial ? "Dial" : "Clicks";

      var totalClicks = !isDial ? (parseFloat(grinder.total_clicks) || 40) : "";
      var totalDialNumbers = isDial ? (parseFloat(grinder.total_dial_numbers || grinder.total_numeros) || 11) : "";
      var dialSteps = isDial ? (parseFloat(grinder.dial_steps || grinder.pasos_por_numero) || 3) : "";

      sheet.getRange(rowNumber, 2).setValue(name);
      sheet.getRange(rowNumber, 3).setValue(type);
      sheet.getRange(rowNumber, 4).setValue(totalClicks);
      sheet.getRange(rowNumber, 5).setValue(totalDialNumbers);
      sheet.getRange(rowNumber, 6).setValue(dialSteps);

      var updatedGrinder = {
        id: String(grinder.id),
        name: name,
        nombre: name,
        type: type,
        tipo: type.toLowerCase(),
        total_clicks: totalClicks !== "" ? totalClicks : null,
        total_dial_numbers: totalDialNumbers !== "" ? totalDialNumbers : null,
        total_numeros: totalDialNumbers !== "" ? totalDialNumbers : null,
        dial_steps: dialSteps !== "" ? dialSteps : null,
        pasos_por_numero: dialSteps !== "" ? dialSteps : null,
        created_at: String(values[i][6] || ""),
        fecha_creacion: String(values[i][6] || "")
      };

      return createJsonResponse({
        success: true,
        message: "Molino actualizado correctamente.",
        grinder: updatedGrinder
      });
    }
  }

  return createJsonResponse({ success: false, message: "Molino no encontrado." });
}

function handleDeleteGrinder(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username);
  var sessionToken = sanitizeInput(data.sessionToken);
  var userSheetId = sanitizeInput(data.userSheetId);
  var id = sanitizeInput(data.id);

  var session = validateSession(authSheetId, username, sessionToken, userSheetId);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMolinosSheet(ss);
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true, message: "Molino eliminado correctamente." });
    }
  }

  return createJsonResponse({ success: false, message: "Molino no encontrado." });
}

/**
 * =========================================================================
 * 4. MÓDULO: MOLIENDAS (CRUD COMPLETO CON CAMPOS EXTENDIDOS)
 * =========================================================================
 */

function handleGetGrinds(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username);
  var sessionToken = sanitizeInput(data.sessionToken);
  var userSheetId = sanitizeInput(data.userSheetId);

  var session = validateSession(authSheetId, username, sessionToken, userSheetId);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMoliendasSheet(ss);
  var values = sheet.getDataRange().getValues();

  var grinds = [];
  if (values.length > 1) {
    for (var i = values.length - 1; i >= 1; i--) {
      var row = values[i];
      if (row[0]) {
        var coffeeName = String(row[2] || "");
        var roaster = String(row[3] || "");
        var flavorProfile = String(row[8] || "");
        var waterTemp = (row[9] !== "" && row[9] !== null && !isNaN(row[9])) ? parseFloat(row[9]) : null;
        var doseIn = (row[10] !== "" && row[10] !== null && !isNaN(row[10])) ? parseFloat(row[10]) : null;
        var yieldOut = (row[11] !== "" && row[11] !== null && !isNaN(row[11])) ? parseFloat(row[11]) : null;
        var gradoVal = (row[12] !== "" && row[12] !== null) ? (isNaN(row[12]) ? String(row[12]) : parseFloat(row[12])) : 0;

        grinds.push({
          id: String(row[0]),
          molino: String(row[1] || ""),
          coffee_name: coffeeName,
          nombre_cafe: coffeeName,
          roaster: roaster,
          tostadero: roaster,
          metodo: String(row[4] || ""),
          variedad: String(row[5] || ""),
          proceso: String(row[6] || ""),
          pais: String(row[7] || ""),
          flavor_profile: flavorProfile,
          perfil_sabor: flavorProfile,
          water_temp: waterTemp,
          temp_agua: waterTemp,
          dose_in: doseIn,
          cafe_in: doseIn,
          yield_out: yieldOut,
          cafe_out: yieldOut,
          grado: gradoVal,
          comentario: String(row[13] || ""),
          fecha: String(row[14] || "")
        });
      }
    }
  }

  return createJsonResponse({ success: true, grinds: grinds });
}

function handleAddGrind(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username);
  var sessionToken = sanitizeInput(data.sessionToken);
  var userSheetId = sanitizeInput(data.userSheetId);
  var grind = data.grind;

  var session = validateSession(authSheetId, username, sessionToken, userSheetId);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  if (!grind) {
    return createJsonResponse({ success: false, message: "Datos de molienda incompletos." });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMoliendasSheet(ss);

  var id = grind.id || ("grind_" + new Date().getTime());
  var fecha = grind.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  var coffeeName = sanitizeInput(grind.coffee_name || grind.coffeeName || grind.nombre_cafe || grind.nombre || "");
  var roaster = sanitizeInput(grind.roaster || grind.tostadero || "");
  var flavorProfile = sanitizeInput(grind.flavor_profile || grind.flavorProfile || grind.perfil_sabor || "");
  var rawWaterTemp = grind.water_temp !== undefined ? grind.water_temp : (grind.waterTemp !== undefined ? grind.waterTemp : grind.temp_agua);
  var waterTemp = (rawWaterTemp !== null && rawWaterTemp !== undefined && rawWaterTemp !== "") ? parseFloat(rawWaterTemp) : "";
  var rawDoseIn = grind.dose_in !== undefined ? grind.dose_in : (grind.doseIn !== undefined ? grind.doseIn : grind.cafe_in);
  var doseIn = (rawDoseIn !== null && rawDoseIn !== undefined && rawDoseIn !== "") ? parseFloat(rawDoseIn) : "";
  var rawYieldOut = grind.yield_out !== undefined ? grind.yield_out : (grind.yieldOut !== undefined ? grind.yieldOut : grind.cafe_out);
  var yieldOut = (rawYieldOut !== null && rawYieldOut !== undefined && rawYieldOut !== "") ? parseFloat(rawYieldOut) : "";
  var grado = grind.grado !== undefined && grind.grado !== null ? grind.grado : (grind.grind_size !== undefined ? grind.grind_size : 0);

  var newRow = [
    id,
    sanitizeInput(grind.molino),
    coffeeName,
    roaster,
    sanitizeInput(grind.metodo),
    sanitizeInput(grind.variedad || ""),
    sanitizeInput(grind.proceso || ""),
    sanitizeInput(grind.pais),
    flavorProfile,
    waterTemp,
    doseIn,
    yieldOut,
    grado,
    sanitizeInput(grind.comentario || ""),
    fecha
  ];

  sheet.appendRow(newRow);

  return createJsonResponse({
    success: true,
    grind: {
      id: id,
      molino: grind.molino,
      coffee_name: coffeeName,
      nombre_cafe: coffeeName,
      roaster: roaster,
      tostadero: roaster,
      metodo: grind.metodo,
      variedad: grind.variedad || "",
      proceso: grind.proceso || "",
      pais: grind.pais,
      flavor_profile: flavorProfile,
      perfil_sabor: flavorProfile,
      water_temp: waterTemp !== "" ? waterTemp : null,
      temp_agua: waterTemp !== "" ? waterTemp : null,
      dose_in: doseIn !== "" ? doseIn : null,
      cafe_in: doseIn !== "" ? doseIn : null,
      yield_out: yieldOut !== "" ? yieldOut : null,
      cafe_out: yieldOut !== "" ? yieldOut : null,
      grado: grado,
      comentario: grind.comentario || "",
      fecha: fecha
    }
  });
}

function handleUpdateGrind(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username);
  var sessionToken = sanitizeInput(data.sessionToken);
  var userSheetId = sanitizeInput(data.userSheetId);
  var grind = data.grind;

  var session = validateSession(authSheetId, username, sessionToken, userSheetId);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  if (!grind || !grind.id) {
    return createJsonResponse({ success: false, message: "ID de molienda requerido para actualizar." });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMoliendasSheet(ss);
  var values = sheet.getDataRange().getValues();
  var targetId = String(grind.id).trim();

  for (var i = 1; i < values.length; i++) {
    var rowId = String(values[i][0]).trim();
    if (rowId === targetId) {
      var rowNumber = i + 1;

      var molino = sanitizeInput(grind.molino !== undefined ? grind.molino : (grind.grinder !== undefined ? grind.grinder : values[i][1]));
      var coffeeName = sanitizeInput(
        grind.coffee_name !== undefined ? grind.coffee_name :
        (grind.coffeeName !== undefined ? grind.coffeeName :
        (grind.nombre_cafe !== undefined ? grind.nombre_cafe :
        (grind.nombre !== undefined ? grind.nombre : values[i][2])))
      );
      var roaster = sanitizeInput(
        grind.roaster !== undefined ? grind.roaster :
        (grind.tostadero !== undefined ? grind.tostadero : values[i][3])
      );
      var metodo = sanitizeInput(grind.metodo !== undefined ? grind.metodo : (grind.method !== undefined ? grind.method : values[i][4]));
      var variedad = sanitizeInput(grind.variedad !== undefined ? grind.variedad : (grind.variety !== undefined ? grind.variety : values[i][5]));
      var proceso = sanitizeInput(grind.proceso !== undefined ? grind.proceso : (grind.process !== undefined ? grind.process : values[i][6]));
      var pais = sanitizeInput(grind.pais !== undefined ? grind.pais : (grind.country !== undefined ? grind.country : values[i][7]));
      var flavorProfile = sanitizeInput(
        grind.flavor_profile !== undefined ? grind.flavor_profile :
        (grind.flavorProfile !== undefined ? grind.flavorProfile :
        (grind.perfil_sabor !== undefined ? grind.perfil_sabor : values[i][8]))
      );

      var rawWaterTemp = grind.water_temp !== undefined ? grind.water_temp : (grind.waterTemp !== undefined ? grind.waterTemp : grind.temp_agua);
      var waterTemp = (rawWaterTemp !== undefined && rawWaterTemp !== null && rawWaterTemp !== "") ? parseFloat(rawWaterTemp) : values[i][9];

      var rawDoseIn = grind.dose_in !== undefined ? grind.dose_in : (grind.doseIn !== undefined ? grind.doseIn : grind.cafe_in);
      var doseIn = (rawDoseIn !== undefined && rawDoseIn !== null && rawDoseIn !== "") ? parseFloat(rawDoseIn) : values[i][10];

      var rawYieldOut = grind.yield_out !== undefined ? grind.yield_out : (grind.yieldOut !== undefined ? grind.yieldOut : grind.cafe_out);
      var yieldOut = (rawYieldOut !== undefined && rawYieldOut !== null && rawYieldOut !== "") ? parseFloat(rawYieldOut) : values[i][11];

      var grado = grind.grado !== undefined ? grind.grado : (grind.grind_size !== undefined ? grind.grind_size : (grind.grindSetting !== undefined ? grind.grindSetting : values[i][12]));
      var comentario = sanitizeInput(grind.comentario !== undefined ? grind.comentario : (grind.comment !== undefined ? grind.comment : (grind.comments !== undefined ? grind.comments : values[i][13])));
      var fecha = grind.fecha ? String(grind.fecha) : String(values[i][14]);

      var updatedRow = [
        String(values[i][0]),
        molino,
        coffeeName,
        roaster,
        metodo,
        variedad,
        proceso,
        pais,
        flavorProfile,
        waterTemp !== "" && waterTemp !== null && !isNaN(waterTemp) ? parseFloat(waterTemp) : "",
        doseIn !== "" && doseIn !== null && !isNaN(doseIn) ? parseFloat(doseIn) : "",
        yieldOut !== "" && yieldOut !== null && !isNaN(yieldOut) ? parseFloat(yieldOut) : "",
        grado,
        comentario,
        fecha
      ];

      // Single atomic range update for the whole row (prevents partial writes and lag)
      sheet.getRange(rowNumber, 1, 1, GRIND_HEADERS.length).setValues([updatedRow]);

      var returnedGrind = {
        id: String(values[i][0]),
        molino: molino,
        coffee_name: coffeeName,
        nombre_cafe: coffeeName,
        roaster: roaster,
        tostadero: roaster,
        metodo: metodo,
        variedad: variedad,
        proceso: proceso,
        pais: pais,
        flavor_profile: flavorProfile,
        perfil_sabor: flavorProfile,
        water_temp: waterTemp !== "" && waterTemp !== null && !isNaN(waterTemp) ? parseFloat(waterTemp) : null,
        temp_agua: waterTemp !== "" && waterTemp !== null && !isNaN(waterTemp) ? parseFloat(waterTemp) : null,
        dose_in: doseIn !== "" && doseIn !== null && !isNaN(doseIn) ? parseFloat(doseIn) : null,
        cafe_in: doseIn !== "" && doseIn !== null && !isNaN(doseIn) ? parseFloat(doseIn) : null,
        yield_out: yieldOut !== "" && yieldOut !== null && !isNaN(yieldOut) ? parseFloat(yieldOut) : null,
        cafe_out: yieldOut !== "" && yieldOut !== null && !isNaN(yieldOut) ? parseFloat(yieldOut) : null,
        grado: grado,
        comentario: comentario,
        fecha: fecha
      };

      return createJsonResponse({
        success: true,
        message: "Molienda actualizada correctamente.",
        grind: returnedGrind
      });
    }
  }

  return createJsonResponse({ success: false, message: "Molienda no encontrada." });
}

function handleDeleteGrind(data) {
  var authSheetId = sanitizeInput(data.authSheetId);
  var username = sanitizeInput(data.username);
  var sessionToken = sanitizeInput(data.sessionToken);
  var userSheetId = sanitizeInput(data.userSheetId);
  var id = sanitizeInput(data.id);

  var session = validateSession(authSheetId, username, sessionToken, userSheetId);
  if (!session.valid) {
    return createJsonResponse({ success: false, unauthorized: session.unauthorized, message: session.message });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMoliendasSheet(ss);
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true, message: "Molienda eliminada correctamente." });
    }
  }

  return createJsonResponse({ success: false, message: "Molienda no encontrada." });
}

/**
 * =========================================================================
 * 5. AUTO-MIGRACIÓN DE ESQUEMAS, CREACIÓN DE HOJAS Y HELPERS
 * =========================================================================
 */

function getOrCreateAuthSheet(authSheetId) {
  var ss = SpreadsheetApp.openById(authSheetId);
  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, AUTH_HEADERS.length).setValues([AUTH_HEADERS]);
    sheet.getRange(1, 1, 1, AUTH_HEADERS.length).setFontWeight("bold").setBackground("#D5BEB0");
  } else {
    var headerCount = sheet.getLastColumn();
    if (headerCount < AUTH_HEADERS.length) {
      sheet.getRange(1, 1, 1, AUTH_HEADERS.length).setValues([AUTH_HEADERS]);
    }
  }
  return sheet;
}

/**
 * Obtiene o crea la pestaña 'molinos' y garantiza su estructura de cabeceras
 */
function getOrCreateMolinosSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("molinos");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("molinos");
  }
  ensureMolinosSchema(sheet);
  return sheet;
}

/**
 * Migra o inicializa automáticamente la pestaña 'molinos' a la estructura requerida
 * Cabeceras: id | name | type | total_clicks | total_dial_numbers | dial_steps | created_at
 */
function ensureMolinosSchema(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, MOLINOS_HEADERS.length).setValues([MOLINOS_HEADERS]);
    sheet.getRange(1, 1, 1, MOLINOS_HEADERS.length).setFontWeight("bold").setBackground("#D5BEB0");
    return;
  }

  var allValues = sheet.getDataRange().getValues();
  var currentHeaders = allValues[0];

  // Comprobar coincidencia exacta
  var isExactMatch = currentHeaders.length === MOLINOS_HEADERS.length &&
    MOLINOS_HEADERS.every(function(h, idx) {
      return String(currentHeaders[idx]).trim().toLowerCase() === h.toLowerCase();
    });

  if (isExactMatch) {
    return;
  }

  var headerMap = {};
  for (var c = 0; c < currentHeaders.length; c++) {
    var rawH = String(currentHeaders[c]).trim().toLowerCase();
    headerMap[rawH] = c;
  }

  var aliases = {
    "id": ["id"],
    "name": ["name", "nombre"],
    "type": ["type", "tipo"],
    "total_clicks": ["total_clicks", "clicks"],
    "total_dial_numbers": ["total_dial_numbers", "total_numeros", "numeros"],
    "dial_steps": ["dial_steps", "pasos_por_numero", "pasos"],
    "created_at": ["created_at", "fecha_creacion", "fecha"]
  };

  var fieldToColIndex = {};
  for (var f = 0; f < MOLINOS_HEADERS.length; f++) {
    var field = MOLINOS_HEADERS[f];
    var foundIndex = -1;
    var fieldAliases = aliases[field] || [field];

    for (var a = 0; a < fieldAliases.length; a++) {
      if (headerMap.hasOwnProperty(fieldAliases[a])) {
        foundIndex = headerMap[fieldAliases[a]];
        break;
      }
    }
    if (foundIndex === -1 && currentHeaders.length >= 7 && f < currentHeaders.length) {
      foundIndex = f;
    }
    fieldToColIndex[field] = foundIndex;
  }

  var newTable = [];
  newTable.push(MOLINOS_HEADERS);

  for (var r = 1; r < allValues.length; r++) {
    var oldRow = allValues[r];
    var hasContent = oldRow.some(function(cell) {
      return cell !== "" && cell !== null && cell !== undefined;
    });
    if (!hasContent) continue;

    var newRow = [];
    for (var col = 0; col < MOLINOS_HEADERS.length; col++) {
      var colField = MOLINOS_HEADERS[col];
      var srcIdx = fieldToColIndex[colField];
      if (srcIdx >= 0 && oldRow[srcIdx] !== undefined) {
        newRow.push(oldRow[srcIdx]);
      } else {
        newRow.push("");
      }
    }
    newTable.push(newRow);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, newTable.length, MOLINOS_HEADERS.length).setValues(newTable);
  sheet.getRange(1, 1, 1, MOLINOS_HEADERS.length).setFontWeight("bold").setBackground("#D5BEB0");
}

/**
 * Obtiene o crea la pestaña 'moliendas' y garantiza su estructura de cabeceras
 */
function getOrCreateMoliendasSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("moliendas");
  if (!sheet) {
    var firstSheet = spreadsheet.getSheets()[0];
    if (firstSheet && firstSheet.getName() !== "molinos") {
      sheet = firstSheet;
      sheet.setName("moliendas");
    } else {
      sheet = spreadsheet.insertSheet("moliendas");
    }
  }
  ensureMoliendasSchema(sheet);
  return sheet;
}

// Alias de retrocompatibilidad
function getMoliendasSheet(spreadsheet) {
  return getOrCreateMoliendasSheet(spreadsheet);
}

/**
 * Migra o inicializa automáticamente la pestaña 'moliendas' a la estructura requerida
 * Cabeceras: id | molino | coffee_name | roaster | metodo | variedad | proceso | pais | flavor_profile | water_temp | dose_in | yield_out | grado | comentario | fecha
 * Mantiene intactos todos los registros previos de esquemas de 7 columnas o versiones anteriores.
 */
function ensureMoliendasSchema(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, GRIND_HEADERS.length).setValues([GRIND_HEADERS]);
    sheet.getRange(1, 1, 1, GRIND_HEADERS.length).setFontWeight("bold").setBackground("#E8DACF");
    return;
  }

  var allValues = sheet.getDataRange().getValues();
  var currentHeaders = allValues[0];

  // Comprobar coincidencia exacta
  var isExactMatch = currentHeaders.length === GRIND_HEADERS.length &&
    GRIND_HEADERS.every(function(h, idx) {
      return String(currentHeaders[idx]).trim().toLowerCase() === h.toLowerCase();
    });

  if (isExactMatch) {
    return;
  }

  var headerMap = {};
  for (var c = 0; c < currentHeaders.length; c++) {
    var rawH = String(currentHeaders[c]).trim().toLowerCase();
    headerMap[rawH] = c;
  }

  var aliases = {
    "id": ["id"],
    "molino": ["molino", "grinder", "mill"],
    "coffee_name": ["coffee_name", "nombre_cafe", "cafe", "coffee", "nombre"],
    "roaster": ["roaster", "tostadero", "tostador"],
    "metodo": ["metodo", "method"],
    "variedad": ["variedad", "variety"],
    "proceso": ["proceso", "process"],
    "pais": ["pais", "country", "origen", "origin"],
    "flavor_profile": ["flavor_profile", "perfil_sabor", "perfil", "notas", "notes"],
    "water_temp": ["water_temp", "temp_agua", "temp", "temperatura", "temperature"],
    "dose_in": ["dose_in", "cafe_in", "in", "dosis_in", "grams_in"],
    "yield_out": ["yield_out", "cafe_out", "out", "rendimiento", "grams_out"],
    "grado": ["grado", "grind_size", "clicks", "setting", "molienda"],
    "comentario": ["comentario", "comentarios", "comment", "comments", "notes", "notas_adicionales"],
    "fecha": ["fecha", "date", "created_at"]
  };

  // Mapeo posicional para la versión previa de 7 columnas:
  // [0: id, 1: molino, 2: metodo, 3: pais, 4: grado, 5: comentario, 6: fecha]
  var legacy7Positions = {
    "id": 0,
    "molino": 1,
    "metodo": 2,
    "pais": 3,
    "grado": 4,
    "comentario": 5,
    "fecha": 6
  };
  var isLegacy7 = currentHeaders.length === 7;

  var fieldToColIndex = {};
  for (var f = 0; f < GRIND_HEADERS.length; f++) {
    var field = GRIND_HEADERS[f];
    var foundIndex = -1;
    var fieldAliases = aliases[field] || [field];

    for (var a = 0; a < fieldAliases.length; a++) {
      if (headerMap.hasOwnProperty(fieldAliases[a])) {
        foundIndex = headerMap[fieldAliases[a]];
        break;
      }
    }

    if (foundIndex === -1 && isLegacy7 && legacy7Positions.hasOwnProperty(field)) {
      foundIndex = legacy7Positions[field];
    }

    fieldToColIndex[field] = foundIndex;
  }

  var newTable = [];
  newTable.push(GRIND_HEADERS);

  for (var r = 1; r < allValues.length; r++) {
    var oldRow = allValues[r];
    var hasContent = oldRow.some(function(cell) {
      return cell !== "" && cell !== null && cell !== undefined;
    });
    if (!hasContent) continue;

    var newRow = [];
    for (var col = 0; col < GRIND_HEADERS.length; col++) {
      var colField = GRIND_HEADERS[col];
      var srcIdx = fieldToColIndex[colField];
      if (srcIdx >= 0 && oldRow[srcIdx] !== undefined) {
        newRow.push(oldRow[srcIdx]);
      } else {
        newRow.push("");
      }
    }
    newTable.push(newRow);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, newTable.length, GRIND_HEADERS.length).setValues(newTable);
  sheet.getRange(1, 1, 1, GRIND_HEADERS.length).setFontWeight("bold").setBackground("#E8DACF");
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
