import { prisma } from '../lib/prisma.js';

export const AvaliacaoRepository = {
  buscarPorVideoEUsuario: async (videoId: number, usuarioId: number) => {
    return prisma.avaliacao.findUnique({
      where: {
        usuarioId_videoId: { usuarioId, videoId },
      },
    });
  },

  salvar: async (dados: { nota: number; videoId: number; usuarioId: number }) => {
    return prisma.avaliacao.upsert({
      where: {
        usuarioId_videoId: {
          usuarioId: dados.usuarioId,
          videoId: dados.videoId,
        },
      },
      update: { nota: dados.nota },
      create: dados,
    });
  },

  obterMedia: async (videoId: number) => {
    const agregacao = await prisma.avaliacao.aggregate({
      where: { videoId },
      _avg: { nota: true },
      _count: { nota: true },
    });

    return {
      media: agregacao._avg.nota || 0,
      total: agregacao._count.nota,
    };
  },
};
