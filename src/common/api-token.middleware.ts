import { Injectable, NestMiddleware } from '@nestjs/common';
import * as crypto from 'crypto';
import { API_TOKEN_HEADER, ensureApiToken } from './api-token';
import { getAppDir } from './paths';

/**
 * La API sólo escucha en localhost, pero cualquier proceso local podía
 * detener el servicio o forzar envíos. Todas las peticiones deben traer
 * el token generado en .token.
 */
@Injectable()
export class ApiTokenMiddleware implements NestMiddleware {
  private readonly expected = Buffer.from(ensureApiToken(getAppDir()));

  use(req: any, res: any, next: () => void): void {
    const provided = String(req.get ? req.get(API_TOKEN_HEADER) : '');

    const received = Buffer.from(provided);
    const valid =
      received.length === this.expected.length &&
      crypto.timingSafeEqual(received, this.expected);

    if (!valid) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }
    next();
  }
}
