import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { MailService } from '../mail/mail.service';
import { MetricsService } from '../metrics/metrics.service';
import { generatePDF } from './templates/pdf.template';

@Injectable()
export class ReportsService implements OnModuleInit {
  private readonly logger = new Logger(ReportsService.name);
  private readonly appDir = path.join(__dirname, '..', '..');
  private readonly FLAG_FILE = path.join(this.appDir, '.report-sent');
  private readonly dataPath = path.join(this.appDir, 'data.json');

  constructor(
    private readonly mailService: MailService,
    private readonly metricsService: MetricsService,
  ) {}

  async onModuleInit() {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    const alreadySent = this.checkIfAlreadySent();

    if (isMonday && !alreadySent) {
      // Espera 30 segundos antes del primer intento para dar tiempo a que
      // la red esté disponible al arrancar con Windows.
      await this.delay(30000);
      await this.trysenWeeklyReport();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async trysenWeeklyReport(intentos = 3): Promise<void> {
    for (let i = 0; i < intentos; i++) {
      try {
        await this.sendWeeklyReport();
        return;
      } catch (err) {
        this.logger.error(`Intento ${i + 1} de ${intentos} fallido: ${err.message}`);
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
    const lastSent = fs.readFileSync(this.FLAG_FILE, 'utf-8');
    const today = new Date().toDateString();
    return lastSent === today;
  }

  getLastSentDate(): string | null {
    if (!fs.existsSync(this.FLAG_FILE)) return null;
    return fs.readFileSync(this.FLAG_FILE, 'utf-8');
  }

  async sendWeeklyReport(): Promise<void> {
    this.logger.log('Generando reporte semanal...');

    const metrics = this.metricsService.getWeeklyMetrics();
    const pdfPath = await generatePDF(metrics);

    try {
      await this.mailService.sendReportEmail(pdfPath);
    } finally {
      // Borra el PDF pase lo que pase con el envío
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }

    fs.writeFileSync(this.FLAG_FILE, new Date().toDateString());
    fs.writeFileSync(this.dataPath, JSON.stringify({ apps: {}, totalSeconds: 0 }, null, 2));

    this.logger.log('Reporte enviado y datos reiniciados');
  }
}