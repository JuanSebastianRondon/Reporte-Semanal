import {Module} from '@nestjs/common';

import {StatusController} from './status.controller';
import {StatusService} from './status.service';
import {TrackerModule} from '../tracker/tracker.module';
import {MetricsModule} from '../metrics/metrics.module';
import {ReportsModule} from '../reports/reports.module';

@Module({
    imports: [TrackerModule,
            MetricsModule,
            ReportsModule
    ],
    controllers: [StatusController],
    providers: [StatusService],
})
export class StatusModule {}