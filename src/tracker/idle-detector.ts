import { Injectable, Logger } from '@nestjs/common';
import { ChildProcess, execFile, spawn } from 'child_process';
import { promisify } from 'util';

const run = promisify(execFile);
const CHECK_INTERVAL_MS = 30000;
const IDLE_THRESHOLD_SECONDS = 60;

interface PowerShellWaiter {
  resolve: (line: string) => void;
  reject: (err: Error) => void;
}

interface PowerShellHelper {
  proc: ChildProcess;
  waiters: PowerShellWaiter[];
  buffer: string;
}

/**
 * Detecta inactividad del usuario para no contar tiempo frente al PC
 * cuando no hay interacción. Si el mecanismo no está disponible, asume
 * actividad (fail-open) para no perder datos.
 *
 * En Windows se mantiene UN único PowerShell con el tipo P/Invoke ya
 * compilado; cada comprobación solo envía una línea por stdin. Antes se
 * compilaba C# con Add-Type cada 30 segundos (~2.880 procesos/día).
 */
@Injectable()
export class IdleDetector {
  private readonly logger = new Logger(IdleDetector.name);
  private lastCheck = 0;
  private cachedIdleSeconds = 0;
  private warned = false;
  private powerShell: PowerShellHelper | null = null;

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

  private windowsTypeDefinition(): string {
    return [
      'using System;',
      'using System.Runtime.InteropServices;',
      'public static class IdleInfo {',
      ' [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }',
      ' [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);',
      ' public static double Seconds() { var i = new LASTINPUTINFO(); i.cbSize = (uint)Marshal.SizeOf(i); if (!GetLastInputInfo(ref i)) return 0; return (Environment.TickCount - i.dwTime) / 1000.0; }',
      '}',
    ].join(' ');
  }

  private async ensurePowerShell(): Promise<PowerShellHelper> {
    if (
      this.powerShell &&
      !this.powerShell.proc.killed &&
      this.powerShell.proc.exitCode === null
    ) {
      return this.powerShell;
    }

    const proc = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', '-'],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] },
    );

    const helper: PowerShellHelper = { proc, waiters: [], buffer: '' };
    proc.stdout?.setEncoding('utf8');
    proc.stdout?.on('data', (chunk: string) => {
      helper.buffer += chunk;
      let index: number;
      while ((index = helper.buffer.indexOf('\n')) >= 0) {
        const line = helper.buffer.slice(0, index).trim();
        helper.buffer = helper.buffer.slice(index + 1);
        const waiter = helper.waiters.shift();
        if (waiter && line) waiter.resolve(line);
      }
    });
    proc.on('error', () => this.disposePowerShell());
    proc.on('exit', () => {
      for (const waiter of helper.waiters.splice(0)) {
        waiter.reject(new Error('PowerShell de inactividad terminado'));
      }
      if (this.powerShell === helper) this.powerShell = null;
    });

    this.powerShell = helper;

    const script =
      `Add-Type -TypeDefinition '${this.windowsTypeDefinition()}'; ` +
      "'READY'; " +
      'while (($line = [Console]::In.ReadLine()) -ne $null) { ' +
      " if ($line -eq 'PING') { 'PONG' } " +
      ' else { try { [IdleInfo]::Seconds() } catch { \'0\' } } ' +
      '}';

    // El propio script avisa cuando Add-Type terminó; así no hay carrera
    // entre escribir el script y enviar la primera consulta.
    const ready = this.expectPowerShellLine(helper, 15000);
    proc.stdin?.write(script + '\n');

    const line = await ready;
    if (line.trim() !== 'READY') {
      throw new Error('El ayudante de inactividad respondió de forma inesperada');
    }
    return helper;
  }

  private queryPowerShell(
    helper: PowerShellHelper,
    command: string,
    timeoutMs: number,
  ): Promise<string> {
    const line = this.expectPowerShellLine(helper, timeoutMs);
    helper.proc.stdin?.write(command + '\n');
    return line;
  }

  private expectPowerShellLine(
    helper: PowerShellHelper,
    timeoutMs: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const waiter: PowerShellWaiter = {
        resolve: (line) => {
          clearTimeout(timer);
          resolve(line);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      };
      const timer = setTimeout(() => {
        const index = helper.waiters.indexOf(waiter);
        if (index >= 0) helper.waiters.splice(index, 1);
        reject(new Error('Timeout consultando inactividad'));
      }, timeoutMs);

      helper.waiters.push(waiter);
    });
  }

  private disposePowerShell(): void {
    const helper = this.powerShell;
    this.powerShell = null;
    if (!helper) return;
    for (const waiter of helper.waiters.splice(0)) {
      waiter.reject(new Error('PowerShell de inactividad terminado'));
    }
    try {
      helper.proc.kill();
    } catch {
      // Ya terminó.
    }
  }

  private async windowsIdleSeconds(): Promise<number> {
    try {
      const helper = await this.ensurePowerShell();
      const line = await this.queryPowerShell(helper, 'IDLE', 5000);
      return Number(line.trim()) || 0;
    } catch (err) {
      this.disposePowerShell();
      throw err;
    }
  }

  private async linuxIdleSeconds(): Promise<number> {
    const { stdout } = await run('xprintidle', [], { timeout: 5000 });
    return (Number(stdout.trim()) || 0) / 1000;
  }
}
