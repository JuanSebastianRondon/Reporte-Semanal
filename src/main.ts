import * as dotenv from 'dotenv';
import {spawn} from 'child_process';
import * as path from 'path'; 
import * as os from 'os';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ensureSingleInstance } from './single-instance';

dotenv.config();
async function bootstrap() {
  const appDir = path.join(os.homedir(), 'AppData', 'Roaming', 'ReporteSemanal');
  ensureSingleInstance(appDir);

  dotenv.config({ path: path.join(appDir, '.env') });
}
const trayPath = path.join(path.dirname(process.execPath), 'tray.exe');
spawn(trayPath, [], {
  detached: false,
  stdio: 'ignore',
});
bootstrap();


