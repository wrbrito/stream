import jwt from 'jsonwebtoken';
import { env } from './env.js';

export function gerarToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verificarToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
}
