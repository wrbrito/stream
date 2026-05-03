import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(status).json({
    sucesso: false,
    erro: message,
    detalhes: err.details || undefined,
  });
}
