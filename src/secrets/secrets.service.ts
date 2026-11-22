import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const run = promisify(execFile);
const DPAPI_ENTROPY = 'reporte-semanal-v2';

/**
 * Resuelve EMAIL_PASS según cómo fue guardado:
 * - `dpapi:...`  -> DPAPI del usuario (Windows, escrito por configuracion.exe).
 * - `keyring:`   -> libsecret vía `secret-tool` (Linux).
 * - texto plano -> compatibilidad con instalaciones antiguas (se avisa).
 */
@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private warnedPlainText = false;
  private cachedPass: string | null = null;

  /** El secreto no cambia durante la vida del proceso: se descifra una sola vez. */
  async getEmailPass(): Promise<string> {
    if (this.cachedPass !== null) return this.cachedPass;
    const pass = await this.resolveEmailPass();
    this.cachedPass = pass;
    return pass;
  }

  private async resolveEmailPass(): Promise<string> {
    const raw = (process.env.EMAIL_PASS || '').trim();
    if (!raw) {
      throw new Error(
        'EMAIL_PASS no configurado. Ejecuta configuracion.exe (Windows) o clients/linux/cmd/config (Linux).',
      );
    }

    if (raw.startsWith('dpapi:')) {
      return this.unprotectWindows(raw.slice('dpapi:'.length));
    }
    if (raw.startsWith('keyring:')) {
      return this.lookupKeyring();
    }

    if (!this.warnedPlainText) {
      this.logger.warn(
        'EMAIL_PASS está en texto plano. Vuelve a ejecutar el configurador para guardarlo en el almacén seguro del sistema.',
      );
      this.warnedPlainText = true;
    }
    return raw;
  }

  private async unprotectWindows(payload: string): Promise<string> {
    if (!/^[A-Za-z0-9+/=]+$/.test(payload)) {
      throw new Error('Payload DPAPI inválido en EMAIL_PASS.');
    }

    const script = [
      `$b = [Convert]::FromBase64String('${payload}');`,
      'Add-Type -AssemblyName System.Security;',
      '[Text.Encoding]::UTF8.GetString(',
      '[Security.Cryptography.ProtectedData]::Unprotect(',
      `$b, [Text.Encoding]::UTF8.GetBytes('${DPAPI_ENTROPY}'),`,
      '[Security.Cryptography.DataProtectionScope]::CurrentUser))',
    ].join(' ');

    const { stdout } = await run(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', script],
      { windowsHide: true, timeout: 15000 },
    );
    return stdout.trim();
  }

  private async lookupKeyring(): Promise<string> {
    const { stdout } = await run(
      'secret-tool',
      ['lookup', 'reporte-semanal', 'EMAIL_PASS'],
      { timeout: 10000 },
    );
    const pass = stdout.trim();
    if (!pass) throw new Error('secret-tool no devolvió EMAIL_PASS.');
    return pass;
  }
}
