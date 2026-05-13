import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface WeeklyMetrics {
  apps: { name: string; minutes: number }[];
  totalHours: string;
}

@Injectable()
export class MetricsService {

  getWeeklyMetrics(): WeeklyMetrics {
    const dataPath = path.join(process.cwd(), 'data.json');
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Convierte segundos a minutos y ordena de mayor a menor
    const apps = Object.entries(raw.apps)
      .map(([name, seconds]) => ({
        name,
        minutes: Math.round((seconds as number) / 60),
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 15); // top 15 apps

    const totalHours = (raw.totalSeconds / 3600).toFixed(1) + 'h';

    return { apps, totalHours };
  }
}