import {Injectable} from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';

import {TrackerService} from '../tracker/tracker.service';
import {MetricsService} from '../metrics/metrics.service';
import {ReportsService} from '../reports/reports.service';

@Injectable()
export class StatusService {
    constructor(
        private readonly trackerService: TrackerService,
        private readonly metricsService: MetricsService,
        private readonly reportsService: ReportsService,
    ) {}

    async getStatus() {
       const lastReportSentAt = await this.reportsService.getLastReportSentAt();
       const {totalHours} = this.metricsService.getWeeklyMetrics();
       return { lastReportSentAt, weekTotal: totalHours };
    }

    async generateReportNow() {
        await this.reportsService.sendWeeklyReport();
    }
    
    getDataFolderPath(): string {
        return path.join(os.homedir(), 'AppData', 'Roaming', 'ReporteSemanal');
    }

    shutdown() {
        process.exit(0);
    }

}
