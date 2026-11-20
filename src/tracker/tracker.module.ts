import { Module } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { IdleDetector } from './idle-detector';

@Module({
  providers: [TrackerService, IdleDetector],
  exports: [TrackerService],
})
export class TrackerModule {}
