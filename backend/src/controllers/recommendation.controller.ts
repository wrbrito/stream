import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service.js';

export const RecommendationController = {
  getRecommended: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).usuario?.id; // Assumindo middleware de auth popula req.usuario
      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 10;

      if (!userId) {
        return res.status(401).json({ mensagem: 'Usuário não autenticado' });
      }

      const result = await RecommendationService.getRecommendedVideos(userId, pagina, limite);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ mensagem: 'Erro ao buscar recomendações', erro: error.message });
    }
  },

  getRelated: async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.videoId as string);

      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 10;

      if (isNaN(videoId)) {
        return res.status(400).json({ mensagem: 'ID do vídeo inválido' });
      }

      const result = await RecommendationService.getRelatedVideos(videoId, pagina, limite);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ mensagem: 'Erro ao buscar vídeos relacionados', erro: error.message });
    }
  },

  getTrending: async (req: Request, res: Response) => {
    try {
      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 10;

      const result = await RecommendationService.getTrendingVideos(pagina, limite);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ mensagem: 'Erro ao buscar vídeos em alta', erro: error.message });
    }
  }
};
