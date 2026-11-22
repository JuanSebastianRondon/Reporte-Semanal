import PDFDocument from 'pdfkit';
import { WeeklyMetrics } from '../../metrics/metrics.service';
import { getPdfPalette } from './pdf-palettes';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function fitText(value: string, max: number): string {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function extractWeek(label?: string): string {
  const match = String(label || '').match(/\d{4}-W\d{2}/);
  return match ? match[0] : '';
}

/** Genera el PDF en memoria: evita escribir, releer y borrar un archivo temporal. */
export function generatePDF(metrics: WeeklyMetrics): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const colors = getPdfPalette();

    const doc = new PDFDocument({
      margin: MARGIN,
      size: 'LETTER',
      info: {
        Title: 'Reporte Semanal de Productividad',
        Author: 'Reporte Semanal de Productividad',
        Subject: metrics.periodLabel || 'Reporte semanal',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const textRight = (
      value: string,
      x: number,
      y: number,
      width: number,
      fontSize = 9,
      color = colors.ink,
      font = 'Helvetica',
    ) => {
      doc
        .font(font)
        .fontSize(fontSize)
        .fillColor(color)
        .text(value, x, y, { width, align: 'right', lineBreak: false });
    };

    // ── Encabezado ───────────────────────────────────────
    doc.rect(0, 0, PAGE_WIDTH, 112).fill(colors.header);
    doc.rect(0, 108, PAGE_WIDTH, 4).fill(colors.headerDark);

    doc
      .font('Helvetica-Bold')
      .fontSize(23)
      .fillColor(colors.ink)
      .text(
        'Reporte Semanal de Productividad',
        MARGIN,
        25,
        { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
      );

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(colors.tableHead)
      .text(
        `Total frente al PC: ${metrics.totalHours}`,
        MARGIN,
        58,
        { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
      );

    if (metrics.periodLabel) {
      doc
        .fontSize(9)
        .fillColor(colors.muted)
        .text(
          metrics.periodLabel,
          MARGIN,
          80,
          { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
        );
    }

    const topApps = metrics.apps.slice(0, 15);
    const topApp = topApps.length ? topApps[0] : null;

    // ── Resumen ejecutivo ────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(colors.tableHead)
      .text('Resumen ejecutivo', MARGIN, 126, {
        width: CONTENT_WIDTH,
        lineBreak: false,
      });

    const cardGap = 12;
    const cardWidth = (CONTENT_WIDTH - cardGap * 2) / 3;
    const cardTop = 144;
    const cardHeight = 64;

    const cards = [
      {
        label: 'TIEMPO TOTAL',
        value: metrics.totalHours,
        hint: 'registrado esta semana',
      },
      {
        label: 'APP PRINCIPAL',
        value: topApp ? String(topApp.name || '') : '—',
        hint: topApp
          ? `${topApp.minutes} min · ${(topApp.minutes / 60).toFixed(1)}h`
          : 'sin datos',
      },
      {
        label: 'APLICACIONES',
        value: String(metrics.apps.length),
        hint: 'en el top semanal',
      },
    ];

    cards.forEach((card, index) => {
      const x = MARGIN + index * (cardWidth + cardGap);

      doc.roundedRect(x, cardTop, cardWidth, cardHeight, 5).fill(colors.soft);
      doc.rect(x, cardTop, 3, cardHeight).fill(colors.accent);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(colors.muted)
        .text(card.label, x + 12, cardTop + 9, {
          width: cardWidth - 20,
          lineBreak: false,
        });

      // Los nombres largos se ajustan a dos líneas con fuente más pequeña
      // en vez de recortarse con "…".
      const valueWidth = cardWidth - 20;
      doc.font('Helvetica-Bold').fontSize(15);
      const valueFontSize = doc.widthOfString(card.value) > valueWidth ? 11 : 15;
      doc
        .fontSize(valueFontSize)
        .fillColor(colors.ink)
        .text(card.value, x + 12, cardTop + 24, {
          width: valueWidth,
          height: valueFontSize === 11 ? 28 : 18,
          ellipsis: valueFontSize === 11,
          lineBreak: valueFontSize === 11,
        });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.muted)
        .text(card.hint, x + 12, cardTop + 50, {
          width: valueWidth,
          lineBreak: false,
        });
    });

    // ── Tabla de apps ────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(colors.tableHead)
      .text('Top Apps más usadas esta semana', MARGIN, 222, {
        width: CONTENT_WIDTH,
        underline: true,
        lineBreak: false,
      });

    const tableTop = 252;
    const headerHeight = 22;
    const rowHeight = 26;

    doc.rect(MARGIN, tableTop, CONTENT_WIDTH, headerHeight).fill(colors.tableHead);

    const columns = [
      { label: '#', x: MARGIN + 10, width: 20, align: 'left' as const },
      { label: 'APLICACIÓN', x: MARGIN + 34, width: 190, align: 'left' as const },
      { label: 'MIN', x: MARGIN + 232, width: 50, align: 'right' as const },
      { label: 'HORAS', x: MARGIN + 290, width: 55, align: 'right' as const },
      { label: '%', x: MARGIN + 354, width: 40, align: 'right' as const },
      { label: 'USO', x: MARGIN + 404, width: 98, align: 'left' as const },
    ];

    columns.forEach((column) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#ffffff')
        .text(column.label, column.x, tableTop + 7, {
          width: column.width,
          align: column.align,
          lineBreak: false,
        });
    });

    if (!topApps.length) {
      doc
        .roundedRect(MARGIN, tableTop + headerHeight, CONTENT_WIDTH, 60, 5)
        .fill(colors.soft);
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(colors.muted)
        .text(
          'No se registró actividad en este período.',
          MARGIN,
          tableTop + headerHeight + 23,
          { width: CONTENT_WIDTH, align: 'center', lineBreak: false },
        );
    } else {
      const totalMinutes = topApps.reduce(
        (sum, app) => sum + Math.max(0, app.minutes || 0),
        0,
      );
      const maxMinutes = Math.max(
        ...topApps.map((app) => Math.max(0, app.minutes || 0)),
        1,
      );

      topApps.forEach((app, index) => {
        const rowTop = tableTop + headerHeight + index * rowHeight;
        const minutes = Math.max(0, app.minutes || 0);
        const hours = (minutes / 60).toFixed(1);
        const percent = totalMinutes
          ? Math.round((minutes / totalMinutes) * 100)
          : 0;

        if (index % 2 === 1) {
          doc.rect(MARGIN, rowTop, CONTENT_WIDTH, rowHeight).fill(colors.rowAlt);
        }

        doc
          .moveTo(MARGIN, rowTop + rowHeight)
          .lineTo(MARGIN + CONTENT_WIDTH, rowTop + rowHeight)
          .strokeColor(colors.line)
          .lineWidth(0.5)
          .stroke();

        const rank = index + 1 < 10 ? `0${index + 1}` : String(index + 1);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(colors.accent)
          .text(rank, MARGIN + 10, rowTop + 8, {
            width: 20,
            lineBreak: false,
          });

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(colors.ink)
          .text(fitText(app.name, 32), MARGIN + 34, rowTop + 7, {
            width: 190,
            lineBreak: false,
          });

        textRight(String(minutes), MARGIN + 232, rowTop + 8, 50);
        textRight(`${hours}h`, MARGIN + 290, rowTop + 8, 55);
        textRight(`${percent}%`, MARGIN + 354, rowTop + 8, 40, 9, colors.muted);

        const barX = MARGIN + 404;
        const barWidth = 98;
        const filledWidth = Math.max(4, (minutes / maxMinutes) * barWidth);

        doc.roundedRect(barX, rowTop + 9, barWidth, 7, 3.5).fill(colors.barTrack);
        doc
          .roundedRect(
            barX,
            rowTop + 9,
            Math.min(filledWidth, barWidth),
            7,
            3.5,
          )
          .fill(colors.accent);
      });
    }

    // ── Pie y marca ──────────────────────────────────────
    // Dejar margen suficiente para que PDFKit no agregue páginas al pie.
    const footerY = PAGE_HEIGHT - 80;

    doc
      .moveTo(MARGIN, footerY - 12)
      .lineTo(MARGIN + CONTENT_WIDTH, footerY - 12)
      .strokeColor(colors.line)
      .lineWidth(0.7)
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(colors.tableHead)
      .text('REPORTE SEMANAL DE PRODUCTIVIDAD', MARGIN, footerY, {
        width: 250,
        lineBreak: false,
      });

    const week = extractWeek(metrics.periodLabel);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.muted)
      .text(week ? `Semana ${week}` : 'Resumen semanal', MARGIN, footerY + 12, {
        width: 250,
        lineBreak: false,
      });

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.muted)
      .text(
        `Generado: ${new Date().toLocaleString('es-ES')}`,
        MARGIN + 280,
        footerY,
        { width: CONTENT_WIDTH - 280, align: 'right', lineBreak: false },
      );

    const receiver = (process.env.REPORT_RECEIVER || '').trim();
    if (receiver) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.muted)
        .text(
          `Enviado a: ${fitText(receiver, 42)}`,
          MARGIN + 280,
          footerY + 12,
          { width: CONTENT_WIDTH - 280, align: 'right', lineBreak: false },
        );
    }

    doc.end();
  });
}
