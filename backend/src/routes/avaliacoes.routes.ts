import { Router } from 'express';
import { AvaliacaoController } from '../controllers/avaliacao.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const avaliacoesRouter = Router();

avaliacoesRouter.get('/video/:videoId', AvaliacaoController.obterEstatisticas);
avaliacoesRouter.post('/video/:videoId', autenticar, AvaliacaoController.avaliar);

export { avaliacoesRouter };
