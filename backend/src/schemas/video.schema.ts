import { z } from 'zod';

export const criarVideoSchema = z.object({
  body: z.object({
    titulo: z.string().min(3, { message: 'Título obrigatório' }),
    descricao: z.string().min(10, { message: 'Descrição obrigatória' }),
    categoriaId: z.coerce.number().int().positive({ message: 'Categoria inválida' }),
    autor: z.string().min(3, { message: 'Autor obrigatório' }),
    tipo: z.enum(['INTERNO', 'YOUTUBE']),
    urlOriginal: z.string().url().optional(),
    posicaoMarcaDagua: z.enum(['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER']).optional(),
    status: z.enum(['PENDENTE', 'ATIVO', 'PROCESSANDO', 'ERRO']).optional(),
  }),
});

export const atualizarVideoSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    titulo: z.string().min(3).optional(),
    descricao: z.string().min(10).optional(),
    categoriaId: z.coerce.number().int().positive().optional(),
    autor: z.string().min(3).optional(),
    tipo: z.enum(['INTERNO', 'YOUTUBE']).optional(),
    urlOriginal: z.string().url().optional(),
    status: z.enum(['PENDENTE', 'ATIVO', 'PROCESSANDO', 'ERRO']).optional(),
  }),
});

export const videoIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
