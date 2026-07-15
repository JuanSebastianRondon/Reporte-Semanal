import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface WeeklyMetrics {
  apps: { name: string; minutes: number }[];
  totalHours: string;
}

@Injectable()
export class MetricsService {
  private readonly dataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'ReporteSemanal', 'data.json');

  getWeeklyMetrics(): WeeklyMetrics {
    const raw = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));

    const apps = Object.entries(raw.apps)
      .map(([name, seconds]) => ({
        name,
        minutes: Math.round((seconds as number) / 60),
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 15);

    const totalHours = (raw.totalSeconds / 3600).toFixed(1) + 'h';

    return { apps, totalHours };
  }
}