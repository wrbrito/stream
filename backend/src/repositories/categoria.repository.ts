import { prisma } from '../lib/prisma.js';

export const CategoriaRepository = {
  listar: async () => {
    return prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
  },

  buscarPorId: async (id: number) => {
    return prisma.categoria.findUnique({ where: { id } });
  },

  buscarPorSlug: async (slug: string) => {
    return prisma.categoria.findUnique({ where: { slug } });
  },

  criar: async (dados: { nome: string; descricao?: string }) => {
    const slug = dados.nome
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    return prisma.categoria.create({
      data: {
        nome: dados.nome,
        descricao: dados.descricao,
        slug,
      },
    });
  },

  atualizar: async (id: number, dados: { nome?: string; descricao?: string }) => {
    return prisma.categoria.update({
      where: { id },
      data: dados,
    });
  },

  deletar: async (id: number) => {
    return prisma.categoria.delete({ where: { id } });
  },
};
