import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly secretsService: SecretsService) {}

  /** Reutiliza el mismo transporter en los reintentos del envío semanal. */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    const user = process.env.EMAIL_USER;
    if (!user) {
      throw new Error('EMAIL_USER no configurado.');
    }
    const pass = await this.secretsService.getEmailPass();

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });
    return this.transporter;
  }

  async sendReportEmail(pdf: Buffer): Promise<void> {
    const user = process.env.EMAIL_USER;
    if (!user) {
      throw new Error('EMAIL_USER no configurado.');
    }
    const transporter = await this.getTransporter();

    await transporter.sendMail({
      from: user,
      to: process.env.REPORT_RECEIVER || user,
      subject: 'Tu reporte semanal de productividad',
      text: '¡Hola! Adjunto está tu reporte de la semana.',
      attachments: [
        {
          filename: 'reporte-semanal.pdf',
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
    });

    this.logger.log('Email enviado correctamente');
  }
}
