import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const notificationsRouter = Router();

notificationsRouter.get('/', autenticar, NotificationsController.listar);
notificationsRouter.get('/contar', autenticar, NotificationsController.contar);
notificationsRouter.patch('/:id/lida', autenticar, NotificationsController.marcarLida);
notificationsRouter.patch('/todas/lidas', autenticar, NotificationsController.marcarTodasLidas);

export { notificationsRouter };

