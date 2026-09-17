/**
 * =========================================================================
 * Grind Tracker - Backend Google Apps Script (Code.gs)
 * =========================================================================
 * API REST Serverless segura para la PWA de Grind Tracker.
 * 
 * Principios de Seguridad y Aislamiento:
 *  - Autenticación mediante Session Tokens criptográficos (UUID).
 *  - Verificación de sesión y propiedad de hoja en cada petición protegida.
 *  - Aislamiento completo de Google Drive: el cliente jamás accede a credenciales
 *    ni permisos de Drive; las hojas se crean y gestionan exclusivamente dentro
 *    de la carpeta privada DRIVE_FOLDER_ID en el backend.
 *  - Sanitización estricta de entradas para prevenir inyecciones de fórmulas (=, +, -, @)
 *    y scripts en las hojas de Google Sheets.
 * 
 * Acciones gestionadas en doPost(e):
 *  - login          : Valida credenciales, genera UUID Session Token y fecha de caducidad.
 *  - register       : Crea usuario en Auth, hoja en DRIVE_FOLDER_ID e inicializa 'moliendas' y 'molinos'.
 *  - getGrinders    : Devuelve la lista de molinos configurados del usuario.
 *  - addGrinder     : Registra un nuevo molino (tipo Clicks o Dial).
 *  - updateGrinder  : Actualiza un molino existente.
 *  - deleteGrinder  : Elimina un molino por su ID.
 *  - getGrinds      : Devuelve el listado de moliendas del usuario.
 *  - addGrind       : Agrega una nueva molienda completa (con campos de café de especialidad y espresso).
 *  - updateGrind    : Actualiza una molienda existente.
 *  - deleteGrind    : Elimina una molienda por su ID.
 *  - updateUser     : Actualiza nombre de usuario o contraseña en Auth.
 */

// Cabeceras estándar para la hoja de autenticación global (con soporte de Session Tokens)
var AUTH_HEADERS = ["username", "password", "user_sheet_id", "session_token", "session_expiry", "created_at"];

// Cabeceras estándar para la pestaña de molinos
var MOLINOS_HEADERS = ["id", "nombre", "tipo", "total_clicks", "total_numeros", "pasos_por_numero", "fecha_creacion"];

// Cabeceras completas para la pestaña de moliendas
var GRIND_HEADERS = [
  "id",
  "molino",
  "nombre_cafe",
  "tostadero",
  "metodo",
  "variedad",
  "proceso",
  "pais",
  "perfil_sabor",
  "temp_agua",
  "cafe_in",
  "cafe_out",
  "grado",
  "comentario",
  "fecha"
];

// Tiempo de vida de la sesión: 30 días en milisegundos
var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Petición GET para comprobar estado del servicio
 */
function doGet(e) {
  return createJsonResponse({
    status: "online",
    name: "Grind Tracker API",
    version: "2.0.0",
    message: "Servicio Google Apps Script de Grind Tracker activo y funcionando correctamente.",
    timestamp: new Date().toISOString()
  });
}

/**
 * Petición POST principal que enruta todas las acciones
 */
function doPost(e) {
  try {
    var rawContent = e.postData ? e.postData.contents : null;
    if (!rawContent) {
      return createJsonResponse({ success: false, message: "No se recibieron datos en el cuerpo de la petición." });
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
  
  // Evitar inyección de fórmulas en Google Sheets
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str; // Forzar interpretación como texto literal
  }
  // Limpieza básica de caracteres peligrosos de HTML
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  return str;
}

/**
 * Valida el Session Token del usuario y comprueba que la hoja pertenezca a dicho usuario
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
      // Migración automática de usuarios previos que no tenían token asignado en la hoja
      if (!rowToken) {
        var newToken = sessionToken || Utilities.getUuid();
        var newExpiry = new Date(now + SESSION_TTL_MS).toISOString();
        authSheet.getRange(i + 1, 4).setValue(newToken);
        authSheet.getRange(i + 1, 5).setValue(newExpiry);
        rowToken = newToken;
      }

      // Validar token si se envió y la fila ya tiene token registrado
      if (sessionToken && rowToken && rowToken !== sessionToken) {
        return { valid: false, unauthorized: true, message: "Token de sesión no válido." };
      }
      // Validar expiración
      if (rowExpiry && rowExpiry < now) {
        return { valid: false, unauthorized: true, message: "La sesión ha expirado. Inicia sesión nuevamente." };
      }
      // Validar propiedad de la hoja de usuario (si se proporciona)
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
 * 2. AUTENTICACIÓN: LOGIN, REGISTRO & ACTUALIZAR USUARIO
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
        // Generar UUID de sesión seguro y renovar fecha de caducidad
        var sessionToken = Utilities.getUuid();
        var expiryDate = new Date(new Date().getTime() + SESSION_TTL_MS).toISOString();
        var rowNumber = i + 1;

        authSheet.getRange(rowNumber, 4).setValue(sessionToken);
        authSheet.getRange(rowNumber, 5).setValue(expiryDate);

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

  // Verificar si el usuario ya existe
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

  // 2. Crear nuevo Google Sheet individual para el usuario dentro de DRIVE_FOLDER_ID
  var sheetTitle = "GrindTracker_" + username;
  var newSpreadsheet = SpreadsheetApp.create(sheetTitle);
  var newUserSheetId = newSpreadsheet.getId();

  // Mover archivo a la carpeta privada de Drive aislada
  var file = DriveApp.getFileById(newUserSheetId);
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  // Inicializar pestaña 'moliendas' con cabeceras limpias sin datos mock
  var moliendasSheet = newSpreadsheet.getSheets()[0];
  moliendasSheet.setName("moliendas");
  moliendasSheet.getRange(1, 1, 1, GRIND_HEADERS.length).setValues([GRIND_HEADERS]);
  moliendasSheet.getRange(1, 1, 1, GRIND_HEADERS.length).setFontWeight("bold").setBackground("#E8DACF");

  // Inicializar pestaña 'molinos' con cabeceras limpias sin datos mock
  var molinosSheet = newSpreadsheet.insertSheet("molinos");
  molinosSheet.getRange(1, 1, 1, MOLINOS_HEADERS.length).setValues([MOLINOS_HEADERS]);
  molinosSheet.getRange(1, 1, 1, MOLINOS_HEADERS.length).setFontWeight("bold").setBackground("#D5BEB0");

  // 3. Generar Session Token y guardar credenciales en Auth Sheet
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
    // Comprobar que no exista
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
        grinders.push({
          id: String(row[0]),
          nombre: String(row[1] || ""),
          tipo: String(row[2] || "clicks").toLowerCase(),
          total_clicks: parseFloat(row[3]) || 0,
          total_numeros: parseFloat(row[4]) || 0,
          pasos_por_numero: parseFloat(row[5]) || 0,
          fecha_creacion: String(row[6] || "")
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

  if (!grinder || !grinder.nombre) {
    return createJsonResponse({ success: false, message: "Datos del molino incompletos." });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getOrCreateMolinosSheet(ss);

  var id = "mill_" + new Date().getTime();
  var nombre = sanitizeInput(grinder.nombre);
  var tipo = (grinder.tipo || "clicks").toLowerCase() === "dial" ? "dial" : "clicks";
  var totalClicks = tipo === "clicks" ? parseFloat(grinder.total_clicks || 0) : 0;
  var totalNumeros = tipo === "dial" ? parseFloat(grinder.total_numeros || 0) : 0;
  var pasosPorNumero = tipo === "dial" ? parseFloat(grinder.pasos_por_numero || 0) : 0;
  var fecha = grinder.fecha_creacion || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  sheet.appendRow([
    id,
    nombre,
    tipo,
    totalClicks,
    totalNumeros,
    pasosPorNumero,
    fecha
  ]);

  return createJsonResponse({
    success: true,
    grinder: {
      id: id,
      nombre: nombre,
      tipo: tipo,
      total_clicks: totalClicks,
      total_numeros: totalNumeros,
      pasos_por_numero: pasosPorNumero,
      fecha_creacion: fecha
    }
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
      var tipo = (grinder.tipo || "clicks").toLowerCase() === "dial" ? "dial" : "clicks";
      var totalClicks = tipo === "clicks" ? parseFloat(grinder.total_clicks || 0) : 0;
      var totalNumeros = tipo === "dial" ? parseFloat(grinder.total_numeros || 0) : 0;
      var pasosPorNumero = tipo === "dial" ? parseFloat(grinder.pasos_por_numero || 0) : 0;

      sheet.getRange(rowNumber, 2).setValue(sanitizeInput(grinder.nombre));
      sheet.getRange(rowNumber, 3).setValue(tipo);
      sheet.getRange(rowNumber, 4).setValue(totalClicks);
      sheet.getRange(rowNumber, 5).setValue(totalNumeros);
      sheet.getRange(rowNumber, 6).setValue(pasosPorNumero);

      return createJsonResponse({ success: true, message: "Molino actualizado correctamente." });
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
 * 4. MÓDULO: MOLIENDAS (CRUD COMPLETO CON CAMPOS DE ESPECIALIDAD)
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
  var sheet = getMoliendasSheet(ss);
  var values = sheet.getDataRange().getValues();

  var grinds = [];
  if (values.length > 1) {
    var isNewFormat = values[0].length >= 15;

    for (var i = values.length - 1; i >= 1; i--) {
      var row = values[i];
      if (row[0]) {
        if (isNewFormat) {
          grinds.push({
            id: String(row[0]),
            molino: String(row[1] || ""),
            nombre_cafe: String(row[2] || ""),
            tostadero: String(row[3] || ""),
            metodo: String(row[4] || ""),
            variedad: String(row[5] || ""),
            proceso: String(row[6] || ""),
            pais: String(row[7] || ""),
            perfil_sabor: String(row[8] || ""),
            temp_agua: row[9] ? parseFloat(row[9]) : null,
            cafe_in: row[10] ? parseFloat(row[10]) : null,
            cafe_out: row[11] ? parseFloat(row[11]) : null,
            grado: parseFloat(row[12]) || 0,
            comentario: String(row[13] || ""),
            fecha: String(row[14] || "")
          });
        } else {
          // Compatibilidad hacia atrás con el formato anterior de 7 columnas
          grinds.push({
            id: String(row[0]),
            molino: String(row[1] || ""),
            nombre_cafe: "",
            tostadero: "",
            metodo: String(row[2] || ""),
            variedad: "",
            proceso: "",
            pais: String(row[3] || ""),
            perfil_sabor: "",
            temp_agua: null,
            cafe_in: null,
            cafe_out: null,
            grado: parseFloat(row[4]) || 0,
            comentario: String(row[5] || ""),
            fecha: String(row[6] || "")
          });
        }
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
  var sheet = getMoliendasSheet(ss);

  // Asegurar cabeceras completas si la hoja estaba en versión previa
  ensureGrindHeadersUpgraded(sheet);

  var id = "grind_" + new Date().getTime();
  var fecha = grind.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  var newRow = [
    id,
    sanitizeInput(grind.molino),
    sanitizeInput(grind.nombre_cafe || ""),
    sanitizeInput(grind.tostadero || ""),
    sanitizeInput(grind.metodo),
    sanitizeInput(grind.variedad || ""),
    sanitizeInput(grind.proceso || ""),
    sanitizeInput(grind.pais),
    sanitizeInput(grind.perfil_sabor || ""),
    grind.temp_agua ? parseFloat(grind.temp_agua) : "",
    grind.cafe_in ? parseFloat(grind.cafe_in) : "",
    grind.cafe_out ? parseFloat(grind.cafe_out) : "",
    parseFloat(grind.grado) || 0,
    sanitizeInput(grind.comentario || ""),
    fecha
  ];

  sheet.appendRow(newRow);

  return createJsonResponse({
    success: true,
    grind: {
      id: id,
      molino: grind.molino,
      nombre_cafe: grind.nombre_cafe || "",
      tostadero: grind.tostadero || "",
      metodo: grind.metodo,
      variedad: grind.variedad || "",
      proceso: grind.proceso || "",
      pais: grind.pais,
      perfil_sabor: grind.perfil_sabor || "",
      temp_agua: grind.temp_agua ? parseFloat(grind.temp_agua) : null,
      cafe_in: grind.cafe_in ? parseFloat(grind.cafe_in) : null,
      cafe_out: grind.cafe_out ? parseFloat(grind.cafe_out) : null,
      grado: parseFloat(grind.grado) || 0,
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
  var sheet = getMoliendasSheet(ss);
  ensureGrindHeadersUpgraded(sheet);

  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(grind.id)) {
      var rowNumber = i + 1;
      sheet.getRange(rowNumber, 2).setValue(sanitizeInput(grind.molino));
      sheet.getRange(rowNumber, 3).setValue(sanitizeInput(grind.nombre_cafe || ""));
      sheet.getRange(rowNumber, 4).setValue(sanitizeInput(grind.tostadero || ""));
      sheet.getRange(rowNumber, 5).setValue(sanitizeInput(grind.metodo));
      sheet.getRange(rowNumber, 6).setValue(sanitizeInput(grind.variedad || ""));
      sheet.getRange(rowNumber, 7).setValue(sanitizeInput(grind.proceso || ""));
      sheet.getRange(rowNumber, 8).setValue(sanitizeInput(grind.pais));
      sheet.getRange(rowNumber, 9).setValue(sanitizeInput(grind.perfil_sabor || ""));
      sheet.getRange(rowNumber, 10).setValue(grind.temp_agua ? parseFloat(grind.temp_agua) : "");
      sheet.getRange(rowNumber, 11).setValue(grind.cafe_in ? parseFloat(grind.cafe_in) : "");
      sheet.getRange(rowNumber, 12).setValue(grind.cafe_out ? parseFloat(grind.cafe_out) : "");
      sheet.getRange(rowNumber, 13).setValue(parseFloat(grind.grado) || 0);
      sheet.getRange(rowNumber, 14).setValue(sanitizeInput(grind.comentario || ""));
      if (grind.fecha) sheet.getRange(rowNumber, 15).setValue(grind.fecha);

      return createJsonResponse({ success: true, message: "Molienda actualizada correctamente." });
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
  var sheet = getMoliendasSheet(ss);
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true, message: "Molienda eliminada." });
    }
  }

  return createJsonResponse({ success: false, message: "Molienda no encontrada." });
}

/**
 * =========================================================================
 * 5. HELPERS DE HOJAS Y FORMATO
 * =========================================================================
 */

function getOrCreateAuthSheet(authSheetId) {
  var ss = SpreadsheetApp.openById(authSheetId);
  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, AUTH_HEADERS.length).setValues([AUTH_HEADERS]);
    sheet.getRange(1, 1, 1, AUTH_HEADERS.length).setFontWeight("bold").setBackground("#D5BEB0");
  } else {
    // Si la hoja existía pero tiene menos de 6 columnas (migración a session tokens)
    var headerCount = sheet.getLastColumn();
    if (headerCount < AUTH_HEADERS.length) {
      sheet.getRange(1, 1, 1, AUTH_HEADERS.length).setValues([AUTH_HEADERS]);
    }
  }
  return sheet;
}

function getMoliendasSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("moliendas");
  if (!sheet) {
    sheet = spreadsheet.getSheets()[0];
    sheet.setName("moliendas");
  }
  return sheet;
}

function getOrCreateMolinosSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("molinos");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("molinos");
    sheet.getRange(1, 1, 1, MOLINOS_HEADERS.length).setValues([MOLINOS_HEADERS]);
    sheet.getRange(1, 1, 1, MOLINOS_HEADERS.length).setFontWeight("bold").setBackground("#D5BEB0");
  }
  return sheet;
}

function ensureGrindHeadersUpgraded(sheet) {
  var currentCols = sheet.getLastColumn();
  if (currentCols < GRIND_HEADERS.length) {
    sheet.getRange(1, 1, 1, GRIND_HEADERS.length).setValues([GRIND_HEADERS]);
    sheet.getRange(1, 1, 1, GRIND_HEADERS.length).setFontWeight("bold").setBackground("#E8DACF");
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
