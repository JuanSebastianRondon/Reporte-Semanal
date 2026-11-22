import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export const API_TOKEN_HEADER = 'x-report-token';
const TOKEN_FILE = '.token';
const tokenCache = new Map<string, string>();

/**
 * Devuelve el token local de la API. Se crea una única vez con permisos
 * restringidos (0600 cuando el sistema de archivos lo soporta).
 * Los clientes del mismo usuario lo leen de este archivo.
 */
export function ensureApiToken(appDir: string): string {
  const cached = tokenCache.get(appDir);
  if (cached) return cached;

  const tokenPath = path.join(appDir, TOKEN_FILE);

  try {
    const existing = fs.readFileSync(tokenPath, 'utf-8').trim();
    if (existing) {
      tokenCache.set(appDir, existing);
      return existing;
    }
  } catch {
    // No existe o no es legible: se genera uno nuevo.
  }

  const token = crypto.randomBytes(32).toString('hex');
  try {
    fs.mkdirSync(appDir, { recursive: true });
    fs.writeFileSync(tokenPath, token, {
      encoding: 'utf-8',
      mode: 0o600,
      flag: 'wx',
    });
    tokenCache.set(appDir, token);
    return token;
  } catch (err: any) {
    // Otro proceso pudo crear el archivo en paralelo.
    if (err && err.code === 'EEXIST') {
      const existing = fs.readFileSync(tokenPath, 'utf-8').trim();
      if (existing) {
        tokenCache.set(appDir, existing);
        return existing;
      }
    }
    throw err;
  }
}
