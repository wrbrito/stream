import { Router } from 'express';
import { VideosController } from '../controllers/videos.controller.js';
import { autenticar, autenticarOpcional } from '../middlewares/auth.middleware.js';
import { permitirPerfis } from '../middlewares/roles.middleware.js';
import { validar } from '../middlewares/validation.middleware.js';
import { criarVideoSchema, atualizarVideoSchema, videoIdSchema } from '../schemas/video.schema.js';
import { upload } from '../utils/upload.js';

const videosRouter = Router();

videosRouter.post('/metadados-youtube', autenticar, VideosController.buscarMetadadosYoutube);
videosRouter.get('/', VideosController.listar);
videosRouter.get('/favoritos/me', autenticar, VideosController.listarFavoritos);
videosRouter.get('/:id', validar(videoIdSchema), VideosController.buscarPorId);
videosRouter.get('/:id/favorito', autenticar, validar(videoIdSchema), VideosController.verificarFavorito);
videosRouter.post('/:id/favorito', autenticar, validar(videoIdSchema), VideosController.favoritar);
videosRouter.delete('/:id/favorito', autenticar, validar(videoIdSchema), VideosController.desfavoritar);
videosRouter.post('/:id/denunciar', autenticar, validar(videoIdSchema), VideosController.denunciar);
videosRouter.post('/:id/visualizacoes', autenticarOpcional, validar(videoIdSchema), VideosController.registrarVisualizacao);
videosRouter.post(
  '/',
  autenticar,
  upload.fields([
    { name: 'arquivo', maxCount: 1 },
    { name: 'miniatura', maxCount: 1 },
  ]),
  validar(criarVideoSchema),
  VideosController.criar
);
videosRouter.put('/:id', autenticar, permitirPerfis('ADMIN', 'PROFESSOR'), validar(atualizarVideoSchema), VideosController.atualizar);
videosRouter.delete('/:id', autenticar, permitirPerfis('ADMIN'), validar(videoIdSchema), VideosController.deletar);
videosRouter.post('/:id/importar', autenticar, permitirPerfis('ADMIN'), validar(videoIdSchema), VideosController.importar);
videosRouter.get('/:id/processamento', autenticar, validar(videoIdSchema), VideosController.obterProcessamento);
videosRouter.get('/:id/download', autenticar, permitirPerfis('ADMIN'), validar(videoIdSchema), VideosController.download);

export { videosRouter };

