import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validar } from '../middlewares/validation.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

const authRouter = Router();

authRouter.post('/login', validar(loginSchema), AuthController.login);
authRouter.post('/logout', AuthController.logout);

export { authRouter };
