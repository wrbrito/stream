import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

export function validar(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parseResult = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Requisição inválida',
        detalhes: parseResult.error.format(),
      });
    }

    req.body = parseResult.data.body;
    req.params = parseResult.data.params;
    req.query = parseResult.data.query;

    return next();
  };
}
