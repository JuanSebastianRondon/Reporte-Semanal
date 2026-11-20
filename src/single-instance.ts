import * as fs from 'fs';
import * as path from 'path';
import { getAppDir } from './common/paths';

/**
 * Garantiza que solo haya una instancia del backend corriendo.
 * Si detecta otra instancia viva, termina el proceso actual en silencio
 * (sin abrir el puerto 4577, sin spawnear un segundo tray).
 * El enlace del puerto se valida además en main.ts (EADDRINUSE).
 */
export function ensureSingleInstance(appDir: string = getAppDir()): void {
  const lockPath = path.join(appDir, '.lock');

  if (fs.existsSync(lockPath)) {
    const existingPid = parseInt(fs.readFileSync(lockPath, 'utf-8').trim(), 10);

    if (!isNaN(existingPid) && isProcessRunning(existingPid)) {
      process.exit(0);
    }
    // Lock huérfano de un crash o apagón anterior: se sobreescribe.
  }

  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }

  fs.writeFileSync(lockPath, String(process.pid));

  const releaseLock = () => {
    try {
      const stillMine =
        fs.existsSync(lockPath) &&
        fs.readFileSync(lockPath, 'utf-8').trim() === String(process.pid);
      if (stillMine) fs.unlinkSync(lockPath);
    } catch {
      // best effort, no vale la pena bloquear el cierre del proceso por esto
    }
  };

  process.on('exit', releaseLock);
  process.on('SIGINT', () => { releaseLock(); process.exit(0); });
  process.on('SIGTERM', () => { releaseLock(); process.exit(0); });
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
