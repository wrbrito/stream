import { prisma } from '../lib/prisma.js';

export const UsuarioRepository = {
  buscarPorEmail: async (email: string) => {
    return prisma.usuario.findUnique({ where: { email } });
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

  criar: async (dados: { nome: string; email: string; senha: string; perfil: string }) => {
    return prisma.usuario.create({
      data: dados,
    });
  },

  atualizar: async (id: number, dados: Partial<Record<string, unknown>>) => {
    return prisma.usuario.update({
      where: { id },
      data: dados,
    });
  },

  deletar: async (id: number) => {
    // Buscar o primeiro ADMIN que não seja o usuário a ser deletado para herdar os vídeos
    const admin = await prisma.usuario.findFirst({
      where: { perfil: 'ADMIN', id: { not: id } },
      orderBy: { id: 'asc' }
    });

    return prisma.$transaction([
      prisma.visualizacao.deleteMany({ where: { usuarioId: id } }),
      prisma.favorito.deleteMany({ where: { usuarioId: id } }),
      prisma.notification.deleteMany({ where: { usuarioId: id } }),
      prisma.comentario.deleteMany({ where: { usuarioId: id } }),
      prisma.avaliacao.deleteMany({ where: { usuarioId: id } }),
      // Reatribui os vídeos do usuário para o admin (ou mantém se for o último, mas isso não deve acontecer)
      ...(admin ? [prisma.video.updateMany({ where: { uploaderId: id }, data: { uploaderId: admin.id } })] : []),
      prisma.usuario.delete({ where: { id } })
    ]);
  },
};

