import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'E-mail inválido' }),
    senha: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
  }),
});
