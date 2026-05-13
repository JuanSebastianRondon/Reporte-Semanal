"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDF = generatePDF;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PDFDocument = require('pdfkit');
function generatePDF(metrics) {
    return new Promise((resolve, reject) => {
        var _a;
        const doc = new PDFDocument({ margin: 50 });
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
        const maxMinutes = ((_a = topApps[0]) === null || _a === void 0 ? void 0 : _a.minutes) || 1;
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
//# sourceMappingURL=pdf.template.js.map