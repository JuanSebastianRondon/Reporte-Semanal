import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const run = promisify(execFile);
const CHECK_INTERVAL_MS = 30000;
const IDLE_THRESHOLD_SECONDS = 60;

/**
 * Detecta inactividad del usuario para no contar tiempo frente al PC
 * cuando no hay interacción. Si el mecanismo no está disponible, asume
 * actividad (fail-open) para no perder datos.
 */
@Injectable()
export class IdleDetector {
  private readonly logger = new Logger(IdleDetector.name);
  private lastCheck = 0;
  private cachedIdleSeconds = 0;
  private warned = false;

  async isIdle(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastCheck < CHECK_INTERVAL_MS) {
      return this.cachedIdleSeconds > IDLE_THRESHOLD_SECONDS;
    }
    this.lastCheck = now;

    try {
      this.cachedIdleSeconds =
        process.platform === 'win32'
          ? await this.windowsIdleSeconds()
          : await this.linuxIdleSeconds();
    } catch (err: any) {
      if (!this.warned) {
        this.logger.warn(
          `No se pudo detectar inactividad (${err?.message || err}). Se contará el tiempo igualmente.`,
        );
        this.warned = true;
      }
      this.cachedIdleSeconds = 0;
    }
    return this.cachedIdleSeconds > IDLE_THRESHOLD_SECONDS;
  }

  private async windowsIdleSeconds(): Promise<number> {
    const typeDefinition = [
      'using System;',
      'using System.Runtime.InteropServices;',
      'public static class IdleInfo {',
      ' [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }',
      ' [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);',
      ' public static double Seconds() { var i = new LASTINPUTINFO(); i.cbSize = (uint)Marshal.SizeOf(i); if (!GetLastInputInfo(ref i)) return 0; return (Environment.TickCount - i.dwTime) / 1000.0; }',
      '}',
    ].join(' ');

    const script = `Add-Type -TypeDefinition '${typeDefinition}'; [IdleInfo]::Seconds()`;
    const { stdout } = await run(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', script],
      { windowsHide: true, timeout: 5000 },
    );
    return Number(stdout.trim()) || 0;
  }

  private async linuxIdleSeconds(): Promise<number> {
    const { stdout } = await run('xprintidle', [], { timeout: 5000 });
    return (Number(stdout.trim()) || 0) / 1000;
  }
}
