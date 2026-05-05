import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { ComentarioService } from '../services/comentario.service.js';

export const AdminController = {
  dashboard: async (_req: Request, res: Response) => {
    const dados = await AdminService.dashboard();
    return res.json({ sucesso: true, dados });
  },

  listarComentarios: async (_req: Request, res: Response) => {
    try {
      const comentarios = await AdminService.listarComentarios();
      return res.json({ sucesso: true, dados: comentarios });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao listar comentarios';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  atualizarComentario: async (req: Request, res: Response) => {
    try {
      const comentario = await ComentarioService.atualizar(
        Number(req.params.id),
        req.body.texto,
        req.usuario!.id,
        req.usuario!.perfil
      );
      return res.json({ sucesso: true, dados: comentario });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao atualizar comentario';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  deletarComentario: async (req: Request, res: Response) => {
    try {
      await ComentarioService.deletar(Number(req.params.id), req.usuario!.id, req.usuario!.perfil);
      return res.json({ sucesso: true, dados: { mensagem: 'Comentario excluido com sucesso' } });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao excluir comentario';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },
};
