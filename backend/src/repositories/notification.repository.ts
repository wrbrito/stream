import { prisma } from '../lib/prisma.js';

export const NotificationRepository = {
  listarPorUsuario: async (usuarioId?: number) => {
    return prisma.notification.findMany({
      where: {
        ...(usuarioId && { usuarioId }),
      },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
  },

  listarNaoLidasPorUsuario: async (usuarioId?: number) => {
    return prisma.notification.findMany({
      where: {
        lida: false,
        ...(usuarioId && { usuarioId }),
      },
      orderBy: { criadoEm: 'desc' },
    });
  },

  contarNaoLidasPorUsuario: async (usuarioId: number) => {
    return prisma.notification.count({
      where: {
        lida: false,
        usuarioId,
      },
    });
  },

  marcarComoLida: async (id: number) => {
    return prisma.notification.update({
      where: { id },
      data: { lida: true },
    });
  },

  marcarTodasLidas: async (usuarioId: number) => {
    return prisma.notification.updateMany({
      where: {
        lida: false,
        usuarioId,
      },
      data: { lida: true },
    });
  },

  criar: async (dados: { titulo: string; mensagem: string; usuarioId?: number }) => {
    return prisma.notification.create({
      data: dados,
    });
  },
};

