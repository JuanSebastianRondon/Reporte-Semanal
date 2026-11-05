import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface TrackingData {
  apps: Record<string, number>;
  totalSeconds: number;
}

@Injectable()
export class TrackerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackerService.name);
  private readonly appDir = path.join(__dirname, '..', '..');
  private readonly dataFile = path.join(this.appDir, 'data.json');
  public readonly flagFile = path.join(this.appDir, '.report-sent');

  private data: TrackingData = { apps: {}, totalSeconds: 0 };
  private isDirty = false;
  private trackingTimer: NodeJS.Timeout | null = null;
  private saveTimer: NodeJS.Timeout | null = null;
  private activeWindowFn: any = null;

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
    // Guarda en disco de forma segura cada 60 segundos si hubo cambios
    this.saveTimer = setInterval(() => {
      this.flush();
    }, 60000);
  }

  private startTracking(): void {
    this.trackingTimer = setInterval(async () => {
      try {
        if (!this.activeWindowFn) {
          const getWindowsModule = await import('get-windows');
          this.activeWindowFn = getWindowsModule.activeWindow;
        }

        const win = await this.activeWindowFn();
        if (!win || !win.owner || !win.owner.name) return;

        const appName = win.owner.name;

        if (!this.data.apps[appName]) {
          this.data.apps[appName] = 0;
        }

        this.data.apps[appName] += 5;
        this.data.totalSeconds += 5;
        this.isDirty = true;
      } catch (err: any) {
        // Evita que un fallo puntual de get-windows tumbe el proceso
        this.logger.warn(`Error al detectar ventana activa: ${err?.message || err}`);
      }
    }, 5000);
  }

  getDataPath(): string {
    return this.dataFile;
  }
}
