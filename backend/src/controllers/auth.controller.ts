import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';

export const AuthController = {
  login: async (req: Request, res: Response) => {
    const { email, senha } = req.body;
    const resultado = await AuthService.autenticar(email, senha);

    if (!resultado) {
      return res.status(401).json({ sucesso: false, erro: 'E-mail ou senha inválidos' });
    }

    return res.json({ sucesso: true, dados: resultado });
  },

  logout: async (_req: Request, res: Response) => {
    return res.json({ sucesso: true, dados: { mensagem: 'Logout realizado com sucesso' } });
  },
};
