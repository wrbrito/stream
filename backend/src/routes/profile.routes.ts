import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { uploadFotoPerfil } from '../utils/upload.js';

const profileRouter = Router();

profileRouter.get('/', autenticar, ProfileController.obter);
profileRouter.put('/', autenticar, ProfileController.atualizar);
profileRouter.post('/foto', autenticar, uploadFotoPerfil.single('foto'), ProfileController.atualizarFoto);
profileRouter.patch('/senha', autenticar, ProfileController.trocarSenha);
profileRouter.get('/avaliacoes', autenticar, ProfileController.avaliacoes);
profileRouter.get('/comentarios', autenticar, ProfileController.comentarios);

export { profileRouter };
