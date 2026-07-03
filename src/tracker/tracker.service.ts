import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class TrackerService implements OnModuleInit {
  private readonly dataDir = path.join(os.homedir(), 'AppData', 'Roaming', 'ReporteSemanal');
  private readonly dataFile = path.join(this.dataDir, 'data.json');
  public readonly flagfile = path.join(this.dataDir, '.report-sent');
  
  onModuleInit() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.dataFile)) {
      fs.writeFileSync(this.dataFile, JSON.stringify({ apps: {}, totalSeconds: 0 }));
    }
    this.startTracking();
  }

  private loadData() {
    return JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
  }

  private saveData(data: object) {
    fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
  }

  private startTracking() {
    setInterval(async () => {
      const { activeWindow } = await import('get-windows');
      const win = await activeWindow();
      if (!win) return;

      const data = this.loadData();
      const appName = win.owner.name;

      if (!data.apps[appName]) data.apps[appName] = 0;
      data.apps[appName] += 5;
      data.totalSeconds += 5;

      this.saveData(data);
    }, 5000);
  }

  getDataPath(): string {
    return this.dataFile;
  }
}