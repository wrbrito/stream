import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../lib/jwt.js';

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ sucesso: false, erro: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = verificarToken(token);
    req.usuario = {
      id: Number(payload.sub),
      email: String(payload.email),
      perfil: payload.perfil as any,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ sucesso: false, erro: 'Token inválido ou expirado' });
  }
}

export function autenticarOpcional(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = verificarToken(token);
    req.usuario = {
      id: Number(payload.sub),
      email: String(payload.email),
      perfil: payload.perfil as any,
    };
  } catch {
    // Visualizações anônimas continuam válidas; endpoints protegidos usam autenticar.
  }

  return next();
}
