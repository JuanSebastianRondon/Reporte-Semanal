import { Controller, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('send')
  async sendReport() {
    await this.reportsService.sendWeeklyReport();
    return { message: ' Reporte enviado correctamente' };
  }
}