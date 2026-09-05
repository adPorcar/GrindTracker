/**
 * =========================================================================
 * MoliendaCafé - Backend Google Apps Script (Code.gs)
 * =========================================================================
 * Este script actúa como API REST Serverless para la PWA de MoliendaCafé.
 * 
 * Acciones gestionadas en doPost(e):
 *  - login       : Valida usuario y contraseña contra AUTH_SHEET_ID.
 *  - register    : Crea el registro en Auth y crea un nuevo Sheet en DRIVE_FOLDER_ID.
 *  - getGrinds   : Devuelve el listado de moliendas del Sheet del usuario.
 *  - addGrind    : Agrega una nueva molienda al Sheet del usuario.
 *  - updateGrind : Actualiza una molienda existente.
 *  - deleteGrind : Elimina una molienda por su ID.
 *  - updateUser  : Actualiza el nombre de usuario y/o contraseña en Auth.
 */

// Cabeceras estándar para la hoja de moliendas
var GRIND_HEADERS = ["id", "molino", "metodo", "pais", "grado", "comentario", "fecha"];

// Cabeceras estándar para la hoja de autenticación global
var AUTH_HEADERS = ["username", "password", "user_sheet_id", "created_at"];

/**
 * Petición GET para comprobar estado del servicio
 */
function doGet(e) {
  return createJsonResponse({
    status: "online",
    message: "Servicio Google Apps Script de MoliendaCafé activo y funcionando correctamente.",
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
 * 1. LOGIN
 */
function handleLogin(data) {
  var authSheetId = data.authSheetId;
  var username = (data.username || "").toLowerCase().trim();
  var password = (data.password || "").trim();

  if (!authSheetId || !username || !password) {
    return createJsonResponse({ success: false, message: "Faltan parámetros de autenticación requeridos." });
  }

  var authSheet = getOrCreateAuthSheet(authSheetId);
  var values = authSheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    var rowUser = String(values[i][0]).toLowerCase().trim();
    var rowPass = String(values[i][1]).trim();
    var rowSheetId = String(values[i][2]).trim();

    if (rowUser === username) {
      if (rowPass === password) {
        return createJsonResponse({
          success: true,
          user: {
            username: values[i][0],
            user_sheet_id: rowSheetId
          }
        });
      } else {
        return createJsonResponse({ success: false, message: "Contraseña incorrecta." });
      }
    }
  }

  return createJsonResponse({ success: false, message: "Usuario no encontrado." });
}

/**
 * 2. REGISTRO
 */
function handleRegister(data) {
  var authSheetId = data.authSheetId;
  var driveFolderId = data.driveFolderId;
  var username = (data.username || "").trim();
  var password = (data.password || "").trim();

  if (!authSheetId || !driveFolderId || !username || !password) {
    return createJsonResponse({ success: false, message: "Faltan datos para completar el registro." });
  }

  var authSheet = getOrCreateAuthSheet(authSheetId);
  var values = authSheet.getDataRange().getValues();

  // Verificar si el usuario ya existe
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === username.toLowerCase()) {
      return createJsonResponse({ success: false, message: "El nombre de usuario '" + username + "' ya está registrado." });
    }
  }

  // 1. Obtener la carpeta de Drive
  var folder;
  try {
    folder = DriveApp.getFolderById(driveFolderId);
  } catch (err) {
    return createJsonResponse({
      success: false,
      message: "No se encontró la carpeta en Google Drive con ID: " + driveFolderId + ". Verifica los permisos y el ID."
    });
  }

  // 2. Crear nuevo Google Sheet individual para el usuario
  var sheetTitle = username + "_moliendas";
  var newSpreadsheet = SpreadsheetApp.create(sheetTitle);
  var newUserSheetId = newSpreadsheet.getId();

  // Mover el archivo a la carpeta destino
  var file = DriveApp.getFileById(newUserSheetId);
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  // Inicializar pestaña 'moliendas' con cabeceras y formato
  var moliendasSheet = newSpreadsheet.getSheets()[0];
  moliendasSheet.setName("moliendas");
  moliendasSheet.getRange(1, 1, 1, GRIND_HEADERS.length).setValues([GRIND_HEADERS]);
  moliendasSheet.getRange(1, 1, 1, GRIND_HEADERS.length).setFontWeight("bold").setBackground("#E8DACF");

  // Añadir un registro de bienvenida / ejemplo
  moliendasSheet.appendRow([
    "grind_init_" + new Date().getTime(),
    "Comandante C40",
    "Espresso",
    "Colombia Huila",
    3.5,
    "Molienda de bienvenida calibrada. ¡Disfruta de tu café!",
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy")
  ]);

  // 3. Guardar credenciales en Auth Sheet
  authSheet.appendRow([
    username,
    password,
    newUserSheetId,
    new Date().toISOString()
  ]);

  return createJsonResponse({
    success: true,
    user: {
      username: username,
      user_sheet_id: newUserSheetId
    }
  });
}

/**
 * 3. OBTENER MOLIENDAS
 */
function handleGetGrinds(data) {
  var userSheetId = data.userSheetId;
  if (!userSheetId) {
    return createJsonResponse({ success: false, message: "ID de hoja de usuario no proporcionado." });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getMoliendasSheet(ss);
  var values = sheet.getDataRange().getValues();

  var grinds = [];
  if (values.length > 1) {
    // Desde fila 2 (índice 1) en orden cronológico inverso (más recientes primero)
    for (var i = values.length - 1; i >= 1; i--) {
      var row = values[i];
      if (row[0]) { // Si tiene ID
        grinds.push({
          id: String(row[0]),
          molino: String(row[1] || ""),
          metodo: String(row[2] || ""),
          pais: String(row[3] || ""),
          grado: parseFloat(row[4]) || 0,
          comentario: String(row[5] || ""),
          fecha: String(row[6] || "")
        });
      }
    }
  }

  return createJsonResponse({ success: true, grinds: grinds });
}

/**
 * 4. AGREGAR MOLIENDA
 */
function handleAddGrind(data) {
  var userSheetId = data.userSheetId;
  var grind = data.grind;

  if (!userSheetId || !grind) {
    return createJsonResponse({ success: false, message: "Datos de molienda incompletos." });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getMoliendasSheet(ss);

  var id = "grind_" + new Date().getTime();
  var fecha = grind.fecha || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  sheet.appendRow([
    id,
    grind.molino,
    grind.metodo,
    grind.pais,
    grind.grado,
    grind.comentario || "",
    fecha
  ]);

  return createJsonResponse({
    success: true,
    grind: {
      id: id,
      molino: grind.molino,
      metodo: grind.metodo,
      pais: grind.pais,
      grado: grind.grado,
      comentario: grind.comentario || "",
      fecha: fecha
    }
  });
}

/**
 * 5. ACTUALIZAR MOLIENDA
 */
function handleUpdateGrind(data) {
  var userSheetId = data.userSheetId;
  var grind = data.grind;

  if (!userSheetId || !grind || !grind.id) {
    return createJsonResponse({ success: false, message: "ID de molienda requerido para actualizar." });
  }

  var ss = SpreadsheetApp.openById(userSheetId);
  var sheet = getMoliendasSheet(ss);
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(grind.id)) {
      var rowNumber = i + 1;
      sheet.getRange(rowNumber, 2).setValue(grind.molino);
      sheet.getRange(rowNumber, 3).setValue(grind.metodo);
      sheet.getRange(rowNumber, 4).setValue(grind.pais);
      sheet.getRange(rowNumber, 5).setValue(grind.grado);
      sheet.getRange(rowNumber, 6).setValue(grind.comentario || "");
      if (grind.fecha) sheet.getRange(rowNumber, 7).setValue(grind.fecha);

      return createJsonResponse({ success: true, message: "Molienda actualizada correctamente." });
    }
  }

  return createJsonResponse({ success: false, message: "Molienda con ID '" + grind.id + "' no encontrada." });
}

/**
 * 6. ELIMINAR MOLIENDA
 */
function handleDeleteGrind(data) {
  var userSheetId = data.userSheetId;
  var id = data.id;

  if (!userSheetId || !id) {
    return createJsonResponse({ success: false, message: "ID requerido para eliminar." });
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
 * 7. ACTUALIZAR USUARIO Y CONTRASEÑA EN AUTH
 */
function handleUpdateUser(data) {
  var authSheetId = data.authSheetId;
  var currentUsername = (data.currentUsername || "").trim();
  var newUsername = data.newUsername ? data.newUsername.trim() : null;
  var newPassword = data.newPassword ? data.newPassword.trim() : null;

  if (!authSheetId || !currentUsername) {
    return createJsonResponse({ success: false, message: "Datos de usuario insuficientes." });
  }

  var authSheet = getOrCreateAuthSheet(authSheetId);
  var values = authSheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === currentUsername.toLowerCase()) {
      var rowNumber = i + 1;
      if (newUsername) authSheet.getRange(rowNumber, 1).setValue(newUsername);
      if (newPassword) authSheet.getRange(rowNumber, 2).setValue(newPassword);

      return createJsonResponse({
        success: true,
        message: "Credenciales actualizadas en la hoja de autenticación.",
        user: { username: newUsername || currentUsername }
      });
    }
  }

  return createJsonResponse({ success: false, message: "Usuario actual no encontrado en Auth." });
}

/**
 * Helper para obtener o inicializar la hoja de Auth
 */
function getOrCreateAuthSheet(authSheetId) {
  var ss = SpreadsheetApp.openById(authSheetId);
  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, AUTH_HEADERS.length).setValues([AUTH_HEADERS]);
    sheet.getRange(1, 1, 1, AUTH_HEADERS.length).setFontWeight("bold").setBackground("#D5BEB0");
  }
  return sheet;
}

/**
 * Helper para obtener la pestaña 'moliendas'
 */
function getMoliendasSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("moliendas");
  if (!sheet) {
    sheet = spreadsheet.getSheets()[0];
    sheet.setName("moliendas");
  }
  return sheet;
}

/**
 * Helper para generar respuestas JSON
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
