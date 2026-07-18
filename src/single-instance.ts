import * as fs from 'fs';
import * as path from 'path';

/**
 * Garantiza que solo haya una instancia del backend corriendo.
 * Si detecta otra instancia viva, termina el proceso actual en silencio
 * (sin abrir el puerto 4577, sin spawnear un segundo tray).
 * Debe llamarse ANTES de crear la app de Nest.
 */
export function ensureSingleInstance(appDir: string): void {
  const lockPath = path.join(appDir, '.lock');

  if (fs.existsSync(lockPath)) {
    const existingPid = parseInt(fs.readFileSync(lockPath, 'utf-8').trim(), 10);

    if (!isNaN(existingPid) && isProcessRunning(existingPid)) {
      process.exit(0);
    }
    // El PID del lock no corresponde a ningún proceso vivo: es un lock
    // huérfano de un crash o apagón anterior. Se sobreescribe y se sigue.
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
    // process.kill con señal 0 no mata nada, solo pregunta si el proceso
    // existe. En Windows funciona igual para este propósito.
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}