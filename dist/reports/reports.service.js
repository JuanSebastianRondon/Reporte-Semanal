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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const mail_service_1 = require("../mail/mail.service");
const metrics_service_1 = require("../metrics/metrics.service");
const pdf_template_1 = require("./templates/pdf.template");
let ReportsService = ReportsService_1 = class ReportsService {
    constructor(mailService, metricsService) {
        this.mailService = mailService;
        this.metricsService = metricsService;
        this.logger = new common_1.Logger(ReportsService_1.name);
        this.FLAG_FILE = path.join(process.cwd(), '.report-sent');
    }
    // Se ejecuta cada vez que la app inicia
    async onModuleInit() {
        const today = new Date();
        const isMonday = today.getDay() === 1; // 0=domingo, 1=lunes
        const alreadySent = this.checkIfAlreadySent();
        if (isMonday && !alreadySent) {
            await this.sendWeeklyReport();
        }
    }
    checkIfAlreadySent() {
        if (!fs.existsSync(this.FLAG_FILE))
            return false;
        const lastSent = fs.readFileSync(this.FLAG_FILE, 'utf-8');
        const today = new Date().toDateString();
        return lastSent === today;
    }
    async sendWeeklyReport() {
        this.logger.log(' Generando reporte semanal...');
        const metrics = this.metricsService.getWeeklyMetrics();
        const pdfPath = await (0, pdf_template_1.generatePDF)(metrics);
        await this.mailService.sendReportEmail(pdfPath);
        fs.unlinkSync(pdfPath);
        // Marca que ya se envió hoy
        fs.writeFileSync(this.FLAG_FILE, new Date().toDateString());
        // Reinicia data.json para la nueva semana
        const dataPath = path.join(process.cwd(), 'data.json');
        fs.writeFileSync(dataPath, JSON.stringify({ apps: {}, totalSeconds: 0 }, null, 2));
        this.logger.log('Reporte enviado y datos reiniciados');
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        metrics_service_1.MetricsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map