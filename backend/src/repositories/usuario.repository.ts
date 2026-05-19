import { prisma } from '../lib/prisma.js';

export const UsuarioRepository = {
  buscarPorEmail: async (email: string) => {
    const emailNormalizado = email.trim().toLowerCase();
    return prisma.usuario.findUnique({ where: { email: emailNormalizado } });
  },


  buscarPorId: async (id: number) => {
    return prisma.usuario.findUnique({ where: { id } });
  },

  listar: async () => {
    return prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        podeComentar: true,
        fotoPerfil: true,
        criadoEm: true,
      },
    });
  },

  listarAdminsAtivos: async () => {
    return prisma.usuario.findMany({
      where: { perfil: 'ADMIN', ativo: true },
      select: { id: true, nome: true, email: true },
    });
  },

  criar: async (dados: {
    nome: string;
    email: string;
    senha: string;
    perfil: string;
    fotoPerfil?: string | null;
    ativo?: boolean;
    podeComentar?: boolean;
  }) => {
    const emailNormalizado = dados.email.trim().toLowerCase();
    return prisma.usuario.create({
      data: {
        ...dados,
        email: emailNormalizado,
      },
    });
  },


  atualizar: async (id: number, dados: Partial<Record<string, unknown>>) => {
    const dadosAtualizados: Partial<Record<string, unknown>> = { ...dados };

    if (typeof dadosAtualizados.email === 'string') {
      dadosAtualizados.email = dadosAtualizados.email.trim().toLowerCase();
    }

    return prisma.usuario.update({
      where: { id },
      data: dadosAtualizados,
    });
  },


  deletar: async (id: number) => {
    const admin = await prisma.usuario.findFirst({
      where: { perfil: 'ADMIN', id: { not: id } },
      orderBy: { id: 'asc' },
    });

    return prisma.$transaction(async (tx) => {
      const comentarios = await tx.comentario.findMany({
        where: { usuarioId: id },
        select: { id: true },
      });
      const comentarioIds = comentarios.map((comentario) => comentario.id);

      await tx.visualizacao.deleteMany({ where: { usuarioId: id } });
      await tx.favorito.deleteMany({ where: { usuarioId: id } });
      await tx.notification.deleteMany({ where: { usuarioId: id } });
      await tx.avaliacao.deleteMany({ where: { usuarioId: id } });

      if (comentarioIds.length > 0) {
        await tx.comentario.deleteMany({ where: { parentId: { in: comentarioIds } } });
        await tx.comentario.deleteMany({ where: { id: { in: comentarioIds } } });
      }

      if (admin) {
        await tx.video.updateMany({ where: { uploaderId: id }, data: { uploaderId: admin.id } });
      }

      return tx.usuario.delete({ where: { id } });
    });
  },
};
