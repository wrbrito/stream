import { NextFunction, Request, Response } from 'express';

export function permitirPerfis(...perfis: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ sucesso: false, erro: 'Acesso não autorizado' });
    }

    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ sucesso: false, erro: 'Permissão insuficiente' });
    }

    return next();
  };
}
