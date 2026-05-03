import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service.js';

export const UsuariosController = {
  listar: async (_req: Request, res: Response) => {
    const usuarios = await UsuarioService.listar();
    return res.json({ sucesso: true, dados: usuarios });
  },

  criar: async (req: Request, res: Response) => {
    const usuario = await UsuarioService.criar(req.body);
    return res.status(201).json({ sucesso: true, dados: usuario });
  },

  atualizar: async (req: Request, res: Response) => {
    const usuario = await UsuarioService.atualizar(Number(req.params.id), req.body);
    return res.json({ sucesso: true, dados: usuario });
  },

  ativar: async (req: Request, res: Response) => {
    await UsuarioService.ativar(Number(req.params.id));
    return res.json({ sucesso: true, dados: { mensagem: 'Usuário ativado' } });
  },

  desativar: async (req: Request, res: Response) => {
    await UsuarioService.desativar(Number(req.params.id));
    return res.json({ sucesso: true, dados: { mensagem: 'Usuário desativado' } });
  },

  deletar: async (req: Request, res: Response) => {
    await UsuarioService.deletar(Number(req.params.id));
    return res.status(204).send();
  },
};


