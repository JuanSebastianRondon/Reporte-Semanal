import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { TrackerService } from '../tracker/tracker.service';
import { MetricsService } from '../metrics/metrics.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class StatusService {
  private readonly appDir = path.join(__dirname, '..', '..');

  constructor(
    private readonly trackerService: TrackerService,
    private readonly metricsService: MetricsService,
    private readonly reportsService: ReportsService,
  ) {}

  getStatus() {
    const { totalHours } = this.metricsService.getWeeklyMetrics();
    const lastReportSentAt = this.reportsService.getLastSentDate();
    return { weekTotal: totalHours, lastReportSentAt };
  }

  async generateReportNow() {
    await this.reportsService.sendWeeklyReport();
  }

  getDataFolderPath(): string {
    return this.appDir;
  }

  shutdown() {
    process.exit(0);
  }
}