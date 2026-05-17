import { Router } from 'express';
import { CanalController } from '../controllers/canal.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const canaisRouter = Router();

// Rotas públicas (para visualizar canais de outros usuários)
canaisRouter.get('/:id', CanalController.obter);
canaisRouter.get('/:id/videos', CanalController.listarVideos);
canaisRouter.get('/:id/estatisticas', CanalController.obterEstatisticas);

// Rotas autenticadas (para gerenciar seu próprio canal)
canaisRouter.get('/me/info', autenticar, CanalController.obterMeuCanal);
canaisRouter.patch('/me/descricao', autenticar, CanalController.atualizarDescricao);
canaisRouter.patch('/me/privacidade', autenticar, CanalController.atualizarPrivacidade);

export { canaisRouter };
