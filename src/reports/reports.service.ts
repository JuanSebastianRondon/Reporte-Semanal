import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { MailService } from '../mail/mail.service';
import { MetricsService } from '../metrics/metrics.service';
import { generatePDF } from './templates/pdf.template';

@Injectable()
export class ReportsService implements OnModuleInit {
  private readonly logger = new Logger(ReportsService.name);
  private readonly FLAG_FILE = path.join(process.cwd(), '.report-sent');

  constructor(
    private readonly mailService: MailService,
    private readonly metricsService: MetricsService,
  ) {}

  // Se ejecuta cada vez que la app inicia
  async onModuleInit() {
    const today = new Date();
    const isMonday = today.getDay() === 1; // 0=domingo, 1=lunes
    const alreadySent = this.checkIfAlreadySent();

    if (isMonday && !alreadySent) {
      await this.sendWeeklyReport();
    }
  }

  private checkIfAlreadySent(): boolean {
    if (!fs.existsSync(this.FLAG_FILE)) return false;
    const lastSent = fs.readFileSync(this.FLAG_FILE, 'utf-8');
    const today = new Date().toDateString();
    return lastSent === today;
  }

  async sendWeeklyReport(): Promise<void> {
    this.logger.log(' Generando reporte semanal...');

    const metrics = this.metricsService.getWeeklyMetrics();
    const pdfPath = await generatePDF(metrics);
    await this.mailService.sendReportEmail(pdfPath);

    fs.unlinkSync(pdfPath);

    // Marca que ya se envió hoy
    fs.writeFileSync(this.FLAG_FILE, new Date().toDateString());

    // Reinicia data.json para la nueva semana
    const dataPath = path.join(process.cwd(), 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify({ apps: {}, totalSeconds: 0 }, null, 2));

    this.logger.log('Reporte enviado y datos reiniciados');
  }
}