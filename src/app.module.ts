import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiTokenMiddleware } from './common/api-token.middleware';
import { MailModule } from './mail/mail.module';
import { MetricsModule } from './metrics/metrics.module';
import { ReportsController } from './reports/reports.controller';
import { ReportsModule } from './reports/reports.module';
import { StatusController } from './status/status.controller';
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ApiTokenMiddleware).forRoutes(StatusController, ReportsController);
  }
}
