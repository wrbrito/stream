import { Router } from 'express';
import { ComentarioController } from '../controllers/comentario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const comentariosRouter = Router();

comentariosRouter.get('/video/:videoId', ComentarioController.listar);
comentariosRouter.post('/video/:videoId', autenticar, ComentarioController.criar);
comentariosRouter.delete('/:id', autenticar, ComentarioController.deletar);

export { comentariosRouter };
