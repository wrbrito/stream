import { Request, Response } from 'express';
import { AvaliacaoService } from '../services/avaliacao.service.js';

export const AvaliacaoController = {
  obterEstatisticas: async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      const usuarioId = req.usuario?.id;
      const stats = await AvaliacaoService.obterEstatisticas(Number(videoId), usuarioId);
      return res.json({ sucesso: true, dados: stats });
    } catch (erro) {
      return res.status(400).json({ sucesso: false, erro: 'Erro ao obter avaliações' });
    }
  },

  avaliar: async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      const { nota } = req.body;
      const usuarioId = req.usuario!.id;

      await AvaliacaoService.avaliar({
        nota: Number(nota),
        videoId: Number(videoId),
        usuarioId,
      });

      const stats = await AvaliacaoService.obterEstatisticas(Number(videoId), usuarioId);
      return res.json({ sucesso: true, dados: stats, mensagem: 'Avaliação registrada' });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao avaliar';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },
};
