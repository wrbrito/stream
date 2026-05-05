import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { ConfiguracaoController } from '../controllers/configuracao.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirPerfis } from '../middlewares/roles.middleware.js';

const adminRouter = Router();

adminRouter.get('/dashboard', autenticar, permitirPerfis('ADMIN'), AdminController.dashboard);
adminRouter.get('/comentarios', autenticar, permitirPerfis('ADMIN'), AdminController.listarComentarios);
adminRouter.put('/comentarios/:id', autenticar, permitirPerfis('ADMIN'), AdminController.atualizarComentario);
adminRouter.delete('/comentarios/:id', autenticar, permitirPerfis('ADMIN'), AdminController.deletarComentario);
adminRouter.get('/configuracoes', autenticar, permitirPerfis('ADMIN'), ConfiguracaoController.listar);
adminRouter.post('/configuracoes', autenticar, permitirPerfis('ADMIN'), ConfiguracaoController.salvar);

export { adminRouter };
