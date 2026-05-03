import { Request, Response } from 'express';
import { CategoriaService } from '../services/categoria.service.js';

export const CategoriasController = {
  listar: async (_req: Request, res: Response) => {
    const categorias = await CategoriaService.listar();
    return res.json({ sucesso: true, dados: categorias });
  },

  criar: async (req: Request, res: Response) => {
    const categoria = await CategoriaService.criar(req.body);
    return res.status(201).json({ sucesso: true, dados: categoria });
  },

  atualizar: async (req: Request, res: Response) => {
    const categoria = await CategoriaService.atualizar(Number(req.params.id), req.body);
    return res.json({ sucesso: true, dados: categoria });
  },

  deletar: async (req: Request, res: Response) => {
    await CategoriaService.deletar(Number(req.params.id));
    return res.status(204).send();
  },
};
