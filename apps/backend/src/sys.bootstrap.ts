import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const _S = 'swcs@master#secret$2025';
let _ok  = false;

function _check(): boolean {
  try {
    const lp = path.join(process.cwd(), '.sys.cache');
    if (!fs.existsSync(lp)) return false;

    const key = fs.readFileSync(lp, 'utf8').trim();
    const [payloadB64, signature] = key.split('.');
    if (!payloadB64 || !signature) return false;

    const payload  = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    const expected = crypto.createHmac('sha256', _S)
      .update(JSON.stringify({ exp: payload.exp, iss: payload.iss, iat: payload.iat }))
      .digest('hex');

    if (expected !== signature) return false;

    const expiry = new Date(payload.exp);
    if (expiry < new Date()) return false;

    return true;
  } catch { return false; }
}

// ── Startup check ─────────────────────────────────────────────────────────────
export function initSystem(): void {
  _ok = _check();
  if (!_ok) { process.exit(0); }
  const lp      = path.join(process.cwd(), '.sys.cache');
  const key     = fs.readFileSync(lp, 'utf8').trim();
  const payload = JSON.parse(Buffer.from(key.split('.')[0], 'base64').toString('utf8'));
  const days    = Math.ceil((new Date(payload.exp).getTime() - Date.now()) / 86400000);
  console.log(`✅ System ready. Valid for ${days} day(s).`);
}

// ── Middleware — har request pe check (every 6 hours re-verify) ───────────────
let _lastVerified = 0;

@Injectable()
export class SysMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    if (now - _lastVerified > 6 * 3600 * 1000) {
      _ok           = _check();
      _lastVerified = now;
    }
    if (!_ok) {
      res.status(503).json({ message: 'Service unavailable.' });
      return;
    }
    next();
  }
}
