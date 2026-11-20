import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { getAppDir } from '../common/paths';

export interface WeeklyMetrics {
  apps: { name: string; minutes: number }[];
  totalHours: string;
  periodLabel?: string;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly dataPath: string;

  constructor(
    @Optional()
    @Inject('DATA_FILE_PATH')
    dataPathOverride?: string,
  ) {
    this.dataPath = dataPathOverride || path.join(getAppDir(), 'data.json');
  }

  getWeeklyMetrics(): WeeklyMetrics {
    let raw: { apps?: Record<string, number>; totalSeconds?: number } = { apps: {}, totalSeconds: 0 };

    try {
      if (fs.existsSync(this.dataPath)) {
        const content = fs.readFileSync(this.dataPath, 'utf-8').trim();
        if (content) {
          raw = JSON.parse(content);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error al leer data.json en MetricsService: ${err?.message || err}`);
    }

    const appsDict = raw.apps || {};
    const totalSeconds = raw.totalSeconds || 0;

    const apps = Object.entries(appsDict)
      .map(([name, seconds]) => ({
        name,
        minutes: Math.round((seconds as number) / 60),
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 15);

    const totalHours = (totalSeconds / 3600).toFixed(1) + 'h';

    return { apps, totalHours };
  }
}
