import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { MailService } from '../mail/mail.service';
import { MetricsService } from '../metrics/metrics.service';
import { TrackerService } from '../tracker/tracker.service';
import { generatePDF } from './templates/pdf.template';

@Injectable()
export class ReportsService implements OnModuleInit {
  private readonly logger = new Logger(ReportsService.name);
  private readonly appDir = path.join(__dirname, '..', '..');
  private readonly FLAG_FILE = path.join(this.appDir, '.report-sent');

  constructor(
    private readonly mailService: MailService,
    private readonly metricsService: MetricsService,
    private readonly trackerService: TrackerService,
  ) {}

  async onModuleInit() {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    const alreadySent = this.checkIfAlreadySent();

    if (isMonday && !alreadySent) {
      // Espera 30 segundos antes del primer intento para dar tiempo a que
      // la red esté disponible al arrancar con Windows.
      await this.delay(30000);
      await this.trySendWeeklyReport();
    }
  }

  // Comprueba cada hora; si es lunes y no se ha enviado aún el reporte, lo envía automáticamente.
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCheck() {
    const today = new Date();
    const isMonday = today.getDay() === 1;

    if (isMonday && !this.checkIfAlreadySent()) {
      this.logger.log('Detectado lunes sin reporte enviado. Intentando envío automático...');
      await this.trySendWeeklyReport();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async trySendWeeklyReport(intentos = 3): Promise<void> {
    for (let i = 0; i < intentos; i++) {
      try {
        await this.sendWeeklyReport();
        return;
      } catch (err: any) {
        this.logger.error(`Intento ${i + 1} de ${intentos} fallido: ${err?.message || err}`);
        if (i < intentos - 1) {
          // Espera 5 minutos entre reintentos
          await this.delay(5 * 60 * 1000);
        }
      }
    }
    this.logger.error('No se pudo enviar el reporte después de todos los intentos.');
  }

  private checkIfAlreadySent(): boolean {
    if (!fs.existsSync(this.FLAG_FILE)) return false;
    const lastSent = fs.readFileSync(this.FLAG_FILE, 'utf-8').trim();
    const today = new Date().toDateString();
    return lastSent === today;
  }

  getLastSentDate(): string | null {
    if (!fs.existsSync(this.FLAG_FILE)) return null;
    return fs.readFileSync(this.FLAG_FILE, 'utf-8').trim();
  }

  async sendWeeklyReport(): Promise<void> {
    this.logger.log('Generando reporte semanal...');

    // Asegura que las métricas pendientes en memoria se guarden antes de leer
    this.trackerService.flush();

    const metrics = this.metricsService.getWeeklyMetrics();
    const pdfPath = await generatePDF(metrics);

    try {
      await this.mailService.sendReportEmail(pdfPath);
    } finally {
      // Borra el PDF pase lo que pase con el envío
      if (fs.existsSync(pdfPath)) {
        try {
          fs.unlinkSync(pdfPath);
        } catch (err: any) {
          this.logger.warn(`No se pudo eliminar el archivo temporal ${pdfPath}: ${err?.message || err}`);
        }
      }
    }

    fs.writeFileSync(this.FLAG_FILE, new Date().toDateString(), 'utf-8');
    this.trackerService.resetData();

    this.logger.log('Reporte enviado y datos reiniciados exitosamente');
  }
}
