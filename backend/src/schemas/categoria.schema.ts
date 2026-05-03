import { z } from 'zod';

export const criarCategoriaSchema = z.object({
  body: z.object({
    nome: z.string().min(2, { message: 'Nome da categoria obrigatório' }),
    descricao: z.string().optional(),
  }),
});

export const atualizarCategoriaSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    nome: z.string().min(2).optional(),
    descricao: z.string().optional(),
  }),
});
