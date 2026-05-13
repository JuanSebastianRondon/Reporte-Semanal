import * as fs from 'fs';
import * as path from 'path';
import { WeeklyMetrics } from '../../metrics/metrics.service';
const PDFDocument = require('pdfkit');

export function generatePDF(metrics: WeeklyMetrics): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc: typeof PDFDocument = new PDFDocument({ margin: 50 });
    const filePath = path.join(process.cwd(), `report-${Date.now()}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // ── Encabezado ───────────────────────────────────────
    doc.rect(0, 0, 612, 100).fill('#90adec');

    doc
      .fontSize(24)
      .fillColor('#000000')
      .text('Reporte Semanal de Productividad', 50, 30, { align: 'center' });

    doc
      .fontSize(11)
      .fillColor('#7890ad')
      .text(`Total frente al PC: ${metrics.totalHours}`, 50, 65, { align: 'center' });

    doc.moveDown(3);

    // ── Lista de apps ────────────────────────────────────
    doc
      .fontSize(14)
      .fillColor('#1e3a5f')
      .text('Top Apps mas usadas esta semana', { underline: true });

    doc.moveDown(0.8);

    const colors = [
      '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
      '#bfdbfe', '#dbeafe', '#1e40af', '#1d4ed8', '#2563eb',
      '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe',
    ];

    const topApps = metrics.apps.slice(0, 15);
    const maxMinutes = topApps[0]?.minutes || 1;

    topApps.forEach((app, i) => {
      const rowY = doc.y;

      // Nombre
      doc
        .fontSize(11)
        .fillColor('#111827')
        .text(`${i + 1}. ${app.name}`, 50, rowY, { lineBreak: false });

      // tiempo en horas y minutos
      const horas = (app.minutes / 60).toFixed(1);

      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text(`${app.minutes} min (${horas}h)`, 420, rowY, { lineBreak: false });
        // Barra solo si tiene minutos
        if (app.minutes > 0) {
          const barWidth = (app.minutes / maxMinutes) * 280;
          doc.rect(50, rowY + 16, barWidth, 8).fill(colors[i]);
      }

      // Avance al siguiente row con espacio suficiente
      doc.y = rowY + 32;
    });

    // ── Footer ───────────────────────────────────────────
    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor('#9ca3af')
      .text('Generado automaticamente con NestJS', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}