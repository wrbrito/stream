import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const recommendationsRouter = Router();

/**
 * @route GET /api/recommendations/recommended
 * @desc Retorna vídeos recomendados para o usuário logado
 */
recommendationsRouter.get('/recommended', autenticar, RecommendationController.getRecommended);

/**
 * @route GET /api/recommendations/related/:videoId
 * @desc Retorna vídeos relacionados a um vídeo específico
 */
recommendationsRouter.get('/related/:videoId', RecommendationController.getRelated);

/**
 * @route GET /api/recommendations/trending
 * @desc Retorna vídeos em alta na plataforma
 */
recommendationsRouter.get('/trending', RecommendationController.getTrending);

export { recommendationsRouter };
