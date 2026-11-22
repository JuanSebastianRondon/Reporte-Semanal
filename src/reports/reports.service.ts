import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { getAppDir } from '../common/paths';
import { MailService } from '../mail/mail.service';
import { MetricsService } from '../metrics/metrics.service';
import { TrackerService } from '../tracker/tracker.service';
import { getWeekKey, getWeekRangeLabel, isDueForWeeklyReport } from './week';

@Injectable()
export class ReportsService implements OnModuleInit {
  private readonly logger = new Logger(ReportsService.name);
  private readonly appDir: string;
  private readonly FLAG_FILE: string;
  private inFlight: Promise<void> | null = null;

  constructor(
    private readonly mailService: MailService,
    private readonly metricsService: MetricsService,
    private readonly trackerService: TrackerService,
    @Optional() @Inject('APP_DIR') appDirOverride?: string,
  ) {
    this.appDir = appDirOverride || getAppDir();
    this.FLAG_FILE = path.join(this.appDir, '.report-sent');
  }

  onModuleInit(): void {
    if (!this.isDueForWeeklyReport()) return;

    // No se hace await: bloquear bootstrap retrasaría app.listen() y el Tray
    // mostraría "sin conexión" durante 30 segundos cada lunes.
    const timer = setTimeout(() => {
      void this.runExclusive(true, 3).catch((err) =>
        this.logger.error(`Envío automático fallido: ${err?.message || err}`),
      );
    }, 30000);
    timer.unref?.();
  }

  /** Se comprueba cada hora; envía si la semana del flag es anterior. */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCheck(): Promise<void> {
    if (!this.isDueForWeeklyReport()) return;
    this.logger.log('Detectada semana sin reporte enviado. Intentando envío automático...');
    await this.runExclusive(true, 3);
  }

  /** Envío manual (Tray / API): no marca la semana ni reinicia los datos. */
  async sendWeeklyReport(options: { automatic?: boolean } = {}): Promise<void> {
    return this.runExclusive(options.automatic === true, 3);
  }

  getLastSentDate(): string | null {
    return this.readFlag();
  }

  private isDueForWeeklyReport(now: Date = new Date()): boolean {
    return isDueForWeeklyReport(this.readFlag(), now);
  }

  private readFlag(): string | null {
    try {
      if (!fs.existsSync(this.FLAG_FILE)) return null;
      return fs.readFileSync(this.FLAG_FILE, 'utf-8').trim() || null;
    } catch {
      return null;
    }
  }

  /** Evita dos envíos simultáneos (cron + arranque + petición manual). */
  private runExclusive(automatic: boolean, intentos: number): Promise<void> {
    if (this.inFlight) return this.inFlight;

    const task = this.executeWithRetries(automatic, intentos);
    const wrapped = task.finally(() => {
      if (this.inFlight === wrapped) this.inFlight = null;
    });
    this.inFlight = wrapped;
    return wrapped;
  }

  private async executeWithRetries(automatic: boolean, intentos: number): Promise<void> {
    // Revisión tras esperar a otro envío en curso.
    if (automatic && !this.isDueForWeeklyReport()) return;

    for (let i = 0; i < intentos; i++) {
      try {
        await this.performSend(automatic);
        return;
      } catch (err: any) {
        this.logger.error(`Intento ${i + 1} de ${intentos} fallido: ${err?.message || err}`);
        if (i < intentos - 1) await this.delay(5 * 60 * 1000);
      }
    }
    this.logger.error('No se pudo enviar el reporte después de todos los intentos.');
  }

  private async performSend(automatic: boolean): Promise<void> {
    this.logger.log('Generando reporte semanal...');

    this.trackerService.flush();

    const metrics = this.metricsService.getWeeklyMetrics();
    metrics.periodLabel = getWeekRangeLabel(new Date());

    // pdfkit (y fontkit) solo se cargan cuando hay que generar el PDF.
    const { generatePDF } = await import('./templates/pdf.template');
    const pdf = await generatePDF(metrics);
    await this.mailService.sendReportEmail(pdf);

    if (automatic) {
      // Sólo el envío automático cierra la semana y reinicia el acumulado.
      fs.writeFileSync(this.FLAG_FILE, getWeekKey(new Date()), 'utf-8');
      this.trackerService.resetData();
      this.logger.log('Reporte enviado y datos reiniciados exitosamente');
    } else {
      this.logger.log('Reporte manual enviado (acumulado semanal conservado)');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
