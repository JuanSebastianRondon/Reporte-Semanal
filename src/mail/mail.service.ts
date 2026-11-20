import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly secretsService: SecretsService) {}

  async sendReportEmail(pdfPath: string): Promise<void> {
    const user = process.env.EMAIL_USER;
    if (!user) {
      throw new Error('EMAIL_USER no configurado.');
    }
    const pass = await this.secretsService.getEmailPass();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });

    await transporter.sendMail({
      from: user,
      to: process.env.REPORT_RECEIVER || user,
      subject: 'Tu reporte semanal de productividad',
      text: '¡Hola! Adjunto está tu reporte de la semana.',
      attachments: [
        {
          filename: 'reporte-semanal.pdf',
          path: pdfPath,
        },
      ],
    });

    this.logger.log('Email enviado correctamente');
  }
}
