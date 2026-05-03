import { prisma } from '../lib/prisma.js';

export const ConfiguracaoRepository = {
  buscarPorChave: async (chave: string) => {
    return prisma.configuracao.findUnique({
      where: { chave },
    });
  },

  listar: async () => {
    return prisma.configuracao.findMany();
  },

  salvar: async (chave: string, valor: string) => {
    return prisma.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: { chave, valor },
    });
  },

  remover: async (chave: string) => {
    return prisma.configuracao.delete({
      where: { chave },
    });
  },
};
