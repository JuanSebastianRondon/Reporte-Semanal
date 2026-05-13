import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MailModule } from '../mail/mail.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [MailModule, MetricsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}