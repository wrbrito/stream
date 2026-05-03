import { Router } from 'express';
import { CategoriasController } from '../controllers/categorias.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { permitirPerfis } from '../middlewares/roles.middleware.js';
import { validar } from '../middlewares/validation.middleware.js';
import { criarCategoriaSchema, atualizarCategoriaSchema } from '../schemas/categoria.schema.js';

const categoriasRouter = Router();

categoriasRouter.get('/', autenticar, CategoriasController.listar);
categoriasRouter.post('/', autenticar, permitirPerfis('ADMIN', 'PROFESSOR'), validar(criarCategoriaSchema), CategoriasController.criar);
categoriasRouter.put('/:id', autenticar, permitirPerfis('ADMIN', 'PROFESSOR'), validar(atualizarCategoriaSchema), CategoriasController.atualizar);
categoriasRouter.delete('/:id', autenticar, permitirPerfis('ADMIN'), CategoriasController.deletar);

export { categoriasRouter };
