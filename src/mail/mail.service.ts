import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendReportEmail(pdfPath: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: ' Tu reporte semanal de productividad',
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