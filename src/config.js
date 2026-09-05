/**
 * Configuración global de la aplicación MoliendaCafé
 * 
 * Reemplaza los siguientes valores con los IDs y URLs de tu entorno de Google Workspace:
 * - SCRIPT_URL: URL de la Web App desplegada en Google Apps Script (terminada en /exec).
 * - AUTH_SHEET_ID: ID de la hoja de cálculo de Google que gestiona los usuarios y contraseñas.
 * - DRIVE_FOLDER_ID: ID de la carpeta de Google Drive donde se crearán las hojas de cada usuario.
 */

export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_TU_EJEMPLO_AQUI/exec";
export const AUTH_SHEET_ID = "1TU_AUTH_SHEET_ID_AQUI";
export const DRIVE_FOLDER_ID = "1TU_DRIVE_FOLDER_ID_AQUI";

/**
 * Determina si las credenciales de Apps Script han sido configuradas
 */
export const isConfigured = () => {
  return (
    SCRIPT_URL &&
    !SCRIPT_URL.includes("TU_EJEMPLO_AQUI") &&
    AUTH_SHEET_ID &&
    !AUTH_SHEET_ID.includes("TU_AUTH_SHEET_ID_AQUI") &&
    DRIVE_FOLDER_ID &&
    !DRIVE_FOLDER_ID.includes("TU_DRIVE_FOLDER_ID_AQUI")
  );
};
