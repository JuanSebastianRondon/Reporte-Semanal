import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { getAppDir } from '../common/paths';
import { IdleDetector } from './idle-detector';

interface TrackingData {
  apps: Record<string, number>;
  totalSeconds: number;
}

@Injectable()
export class TrackerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackerService.name);
  private readonly appDir = getAppDir();
  private readonly dataFile = path.join(this.appDir, 'data.json');
  public readonly flagFile = path.join(this.appDir, '.report-sent');

  private data: TrackingData = { apps: {}, totalSeconds: 0 };
  private isDirty = false;
  private trackingTimer: NodeJS.Timeout | null = null;
  private saveTimer: NodeJS.Timeout | null = null;
  private activeWindowFn: any = null;
  private lastTickAt: number | null = null;

  constructor(private readonly idleDetector: IdleDetector) {}

  async onModuleInit() {
    this.ensureDataFile();
    this.data = this.loadData();

    try {
      const getWindowsModule = await import('get-windows');
      this.activeWindowFn = getWindowsModule.activeWindow;
    } catch (err: any) {
      this.logger.error(`Error al cargar el módulo get-windows: ${err?.message || err}`);
    }

    this.startTracking();
    this.startPeriodicSave();
  }

  onModuleDestroy() {
    if (this.trackingTimer) clearInterval(this.trackingTimer);
    if (this.saveTimer) clearInterval(this.saveTimer);
    this.flush();
  }

  private ensureDataFile(): void {
    if (!fs.existsSync(this.dataFile)) {
      this.atomicSave({ apps: {}, totalSeconds: 0 });
    }
  }

  private loadData(): TrackingData {
    try {
      if (fs.existsSync(this.dataFile)) {
        const content = fs.readFileSync(this.dataFile, 'utf-8').trim();
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed.apps === 'object' && typeof parsed.totalSeconds === 'number') {
            return parsed;
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`data.json corrupto o ilegible. Reinicializando datos: ${err?.message || err}`);
    }
    return { apps: {}, totalSeconds: 0 };
  }

  private atomicSave(dataToSave: TrackingData): void {
    const tempFile = `${this.dataFile}.tmp`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempFile, this.dataFile);
      this.isDirty = false;
    } catch (err: any) {
      this.logger.error(`Error guardando data.json: ${err?.message || err}`);
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
    }
  }

  public flush(): void {
    if (this.isDirty) {
      this.atomicSave(this.data);
    }
  }

  public resetData(): void {
    this.data = { apps: {}, totalSeconds: 0 };
    this.atomicSave(this.data);
  }

  private startPeriodicSave(): void {
    this.saveTimer = setInterval(() => this.flush(), 60000);
  }

  private startTracking(): void {
    this.trackingTimer = setInterval(async () => {
      const now = Date.now();

      // Primer tick: sólo establece la referencia de tiempo.
      if (this.lastTickAt === null) {
        this.lastTickAt = now;
        return;
      }

      // Medimos el tiempo real entre ticks en lugar de asumir 5 s.
      // Descartamos huecos largos (suspensión del equipo / event loop bloqueado).
      const elapsed = (now - this.lastTickAt) / 1000;
      this.lastTickAt = now;
      if (elapsed <= 0 || elapsed > 60) return;

      const seconds = Math.min(elapsed, 15);

      try {
        if (await this.idleDetector.isIdle()) return;

        if (!this.activeWindowFn) {
          const getWindowsModule = await import('get-windows');
          this.activeWindowFn = getWindowsModule.activeWindow;
        }

        const win = await this.activeWindowFn();
        if (!win || !win.owner || !win.owner.name) return;

        const appName = win.owner.name;
        this.data.apps[appName] = Math.round(((this.data.apps[appName] || 0) + seconds) * 10) / 10;
        this.data.totalSeconds = Math.round((this.data.totalSeconds + seconds) * 10) / 10;
        this.isDirty = true;
      } catch (err: any) {
        this.logger.warn(`Error al detectar ventana activa: ${err?.message || err}`);
      }
    }, 5000);
  }

  getDataPath(): string {
    return this.dataFile;
  }
}
