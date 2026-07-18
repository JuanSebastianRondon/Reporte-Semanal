import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { spawn } from 'child_process';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ensureSingleInstance } from './single-instance';

const appDir = path.join(__dirname, '..');

ensureSingleInstance(appDir);

dotenv.config({ path: path.join(appDir, '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  await app.listen(4577, 'localhost');

  const trayPath = path.join(appDir, 'runtime', 'ReporteTray.exe');
  const tray = spawn(trayPath, [], { detached: false, stdio: 'ignore' });
  tray.on('error', (err) => {
    console.error(`[Tray] No se pudo arrancar ReporteTray.exe: ${err.message}`);
  });
}

bootstrap();