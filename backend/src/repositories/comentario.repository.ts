import { prisma } from '../lib/prisma.js';

export const ComentarioRepository = {
  listarPorVideo: async (videoId: number) => {
    return prisma.comentario.findMany({
      where: { videoId, parentId: null },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            perfil: true,
            fotoPerfil: true,
          },
        },
        respostas: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                perfil: true,
                fotoPerfil: true,
              },
            },
          },
          orderBy: { criadoEm: 'asc' },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  },

  listarTodos: async () => {
    return prisma.comentario.findMany({
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, perfil: true, fotoPerfil: true },
        },
        video: {
          select: { id: true, titulo: true, uploaderId: true },
        },
        parent: {
          select: { id: true, texto: true },
        },
        _count: {
          select: { respostas: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  },

  criar: async (dados: { texto: string; videoId: number; usuarioId: number; parentId?: number | null }) => {
    return prisma.comentario.create({
      data: dados,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            perfil: true,
            fotoPerfil: true,
          },
        },
      },
    });
  },

  atualizar: async (id: number, texto: string) => {
    return prisma.comentario.update({
      where: { id },
      data: { texto },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, perfil: true, fotoPerfil: true },
        },
        video: {
          select: { id: true, titulo: true, uploaderId: true },
        },
      },
    });
  },

  deletar: async (id: number) => {
    return prisma.$transaction(async (tx) => {
      await tx.comentario.deleteMany({ where: { parentId: id } });
      return tx.comentario.delete({ where: { id } });
    });
  },

  buscarPorId: async (id: number) => {
    return prisma.comentario.findUnique({
      where: { id },
      include: {
        video: {
          select: { id: true, uploaderId: true },
        },
      },
    });
  },
};
