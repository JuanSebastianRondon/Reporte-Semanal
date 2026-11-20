import { Injectable, Logger } from '@nestjs/common';
import { getAppDir } from '../common/paths';
import { TrackerService } from '../tracker/tracker.service';
import { MetricsService } from '../metrics/metrics.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);
  private readonly appDir = getAppDir();
  private shutdownHandler: (() => Promise<void> | void) | null = null;

  constructor(
    private readonly trackerService: TrackerService,
    private readonly metricsService: MetricsService,
    private readonly reportsService: ReportsService,
  ) {}

  setShutdownHandler(handler: () => Promise<void> | void): void {
    this.shutdownHandler = handler;
  }

  getStatus() {
    const { totalHours } = this.metricsService.getWeeklyMetrics();
    const lastReportSentAt = this.reportsService.getLastSentDate();
    return { weekTotal: totalHours, lastReportSentAt };
  }

  async generateReportNow(): Promise<void> {
    // Manual: conserva el acumulado y no marca la semana como enviada.
    await this.reportsService.sendWeeklyReport({ automatic: false });
  }

  getDataFolderPath(): string {
    return this.appDir;
  }

  async shutdown(): Promise<void> {
    try {
      if (this.shutdownHandler) {
        await this.shutdownHandler();
      }
    } catch (err: any) {
      this.logger.error(`Error al cerrar la aplicación: ${err?.message || err}`);
    } finally {
      // Margen de seguridad por si queda algún handle pendiente.
      setTimeout(() => process.exit(0), 1000).unref?.();
    }
  }
}
