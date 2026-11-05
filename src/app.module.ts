import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import { MetricsModule } from './metrics/metrics.module';
import { ReportsModule } from './reports/reports.module';
import { StatusModule } from './status/status.module';
import { TrackerModule } from './tracker/tracker.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TrackerModule,
    MailModule,
    MetricsModule,
    ReportsModule,
    StatusModule,
  ],
})
export class AppModule {}
