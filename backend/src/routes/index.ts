import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { categoriasRouter } from './categorias.routes.js';
import { videosRouter } from './videos.routes.js';
import { usuariosRouter } from './usuarios.routes.js';
import { adminRouter } from './admin.routes.js';
import { notificationsRouter } from './notifications.routes.js';
import { comentariosRouter } from './comentarios.routes.js';
import { avaliacoesRouter } from './avaliacoes.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/categorias', categoriasRouter);
apiRouter.use('/videos', videosRouter);
apiRouter.use('/usuarios', usuariosRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/comentarios', comentariosRouter);
apiRouter.use('/avaliacoes', avaliacoesRouter);

export { apiRouter };
