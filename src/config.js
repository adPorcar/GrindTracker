/**
 * Configuración global de la aplicación MoliendaCafé
 * 
 * Los valores se leen desde variables de entorno con prefijo VITE_
 * para ser accesibles en el frontend tanto en local (.env) como en Vercel.
 */

export const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "";
export const AUTH_SHEET_ID = import.meta.env.VITE_AUTH_SHEET_ID || "";
export const DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID || "";

/**
 * Determina si las credenciales de Apps Script han sido configuradas
 */
export const isConfigured = () => {
  return Boolean(
    SCRIPT_URL &&
    !SCRIPT_URL.includes("TU_SCRIPT_ID") &&
    !SCRIPT_URL.includes("TU_EJEMPLO") &&
    AUTH_SHEET_ID &&
    !AUTH_SHEET_ID.includes("TU_AUTH") &&
    DRIVE_FOLDER_ID &&
    !DRIVE_FOLDER_ID.includes("TU_DRIVE")
  );
};
