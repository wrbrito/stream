import { Request, Response } from 'express';
import { ComentarioService } from '../services/comentario.service.js';

export const ComentarioController = {
  listar: async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      const comentarios = await ComentarioService.listarPorVideo(Number(videoId));
      return res.json({ sucesso: true, dados: comentarios });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao listar comentários';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  criar: async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      const { texto } = req.body;
      const usuarioId = req.usuario!.id;

      const comentario = await ComentarioService.criar({
        texto,
        videoId: Number(videoId),
        usuarioId,
      });

      return res.status(201).json({ sucesso: true, dados: comentario });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao criar comentário';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  deletar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario!.id;
      const perfil = req.usuario!.perfil;

      await ComentarioService.deletar(Number(id), usuarioId, perfil);
      return res.json({ sucesso: true, mensagem: 'Comentário excluído com sucesso' });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao excluir comentário';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },
};
