import * as path from 'path';

/**
 * Directorio raíz de la aplicación.
 * - Desarrollo: raíz del repositorio (src/... -> ../..).
 * - Instalación: carpeta {app} (dist/... -> ../..).
 */
export function getAppDir(): string {
  return path.resolve(__dirname, '..', '..');
}
