import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { spawn } from 'child_process';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ensureApiToken } from './common/api-token';
import { getAppDir } from './common/paths';
import { ensureSingleInstance } from './single-instance';
import { StatusService } from './status/status.service';

const appDir = getAppDir();

ensureSingleInstance(appDir);
ensureApiToken(appDir);
dotenv.config({ path: path.join(appDir, '.env') });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  try {
    await app.listen(4577, 'localhost');
  } catch (err: any) {
    new Logger('Bootstrap').error(
      `No se pudo abrir el puerto 4577: ${err?.message || err}`,
    );
    await app.close();
    process.exit(1);
    return;
  }

  const trayPath = path.join(appDir, 'runtime', 'ReporteTray.exe');
  const tray = spawn(trayPath, [], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  tray.unref();
  tray.on('error', (err) => {
    new Logger('Tray').error(`No se pudo arrancar ReporteTray.exe: ${err.message}`);
  });

  app.get(StatusService).setShutdownHandler(async () => {
    try {
      tray.kill();
    } catch {
      // El Tray pudo haber cerrado por sí solo.
    }
    await app.close();
  });
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error(`Error fatal: ${err?.message || err}`);
  process.exit(1);
});
