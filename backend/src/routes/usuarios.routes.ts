import { Router } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirPerfis } from '../middlewares/roles.middleware.js';

const usuariosRouter = Router();

usuariosRouter.get('/', autenticar, permitirPerfis('ADMIN'), UsuariosController.listar);
usuariosRouter.post('/', autenticar, permitirPerfis('ADMIN'), UsuariosController.criar);
usuariosRouter.put('/:id', autenticar, permitirPerfis('ADMIN'), UsuariosController.atualizar);
usuariosRouter.patch('/:id/ativar', autenticar, permitirPerfis('ADMIN'), UsuariosController.ativar);
usuariosRouter.patch('/:id/desativar', autenticar, permitirPerfis('ADMIN'), UsuariosController.desativar);
usuariosRouter.patch('/:id/bloquear-comentarios', autenticar, permitirPerfis('ADMIN'), UsuariosController.bloquearComentarios);
usuariosRouter.patch('/:id/desbloquear-comentarios', autenticar, permitirPerfis('ADMIN'), UsuariosController.desbloquearComentarios);
usuariosRouter.delete('/:id', autenticar, permitirPerfis('ADMIN'), UsuariosController.deletar);

export { usuariosRouter };

