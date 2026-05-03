import { UsuarioPerfil } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        email: string;
        perfil: UsuarioPerfil;
      };
    }
  }
}
