import { prisma } from '../lib/prisma.js';

export const ComentarioRepository = {
  listarPorVideo: async (videoId: number) => {
    return prisma.comentario.findMany({
      where: { videoId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            perfil: true,
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  },

  criar: async (dados: { texto: string; videoId: number; usuarioId: number }) => {
    return prisma.comentario.create({
      data: dados,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            perfil: true,
          },
        },
      },
    });
  },

  deletar: async (id: number) => {
    return prisma.comentario.delete({
      where: { id },
    });
  },

  buscarPorId: async (id: number) => {
    return prisma.comentario.findUnique({
      where: { id },
    });
  },
};
