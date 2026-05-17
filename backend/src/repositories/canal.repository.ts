import { prisma } from '../lib/prisma.js';

export const CanalRepository = {
  buscarPorId: async (usuarioId: number) => {
    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        fotoPerfil: true,
        descricaoCanal: true,
        canalPublico: true,
        criadoEm: true,
        _count: {
          select: { videos: true },
        },
      },
    });
  },

  listarVideosDoCanal: async (usuarioId: number, pagina: number = 1, limite: number = 12) => {
    const skip = (pagina - 1) * limite;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: {
          uploaderId: usuarioId,
          status: 'ATIVO',
        },
        select: {
          id: true,
          titulo: true,
          descricao: true,
          miniatura: true,
          criadoEm: true,
          categoria: {
            select: { id: true, nome: true },
          },
          uploader: {
            select: { id: true, nome: true },
          },
          _count: {
            select: { visualizacoes: true },
          },
        },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: limite,
      }),
      prisma.video.count({
        where: {
          uploaderId: usuarioId,
          status: 'ATIVO',
        },
      }),
    ]);

    return {
      videos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  },

  atualizarDescricaoCanal: async (usuarioId: number, descricao: string | null) => {
    return prisma.usuario.update({
      where: { id: usuarioId },
      data: { descricaoCanal: descricao },
      select: {
        id: true,
        nome: true,
        email: true,
        fotoPerfil: true,
        descricaoCanal: true,
        canalPublico: true,
        criadoEm: true,
      },
    });
  },

  atualizarPrivacidadeCanal: async (usuarioId: number, canalPublico: boolean) => {
    return prisma.usuario.update({
      where: { id: usuarioId },
      data: { canalPublico },
      select: {
        id: true,
        nome: true,
        email: true,
        fotoPerfil: true,
        descricaoCanal: true,
        canalPublico: true,
        criadoEm: true,
      },
    });
  },

  listarEstatisticasCanal: async (usuarioId: number) => {
    const [usuario, visualizacoes, comentarios, avaliacoes] = await Promise.all([
      prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          _count: { select: { videos: true } },
        },
      }),
      prisma.visualizacao.aggregate({
        where: {
          video: { uploaderId: usuarioId },
        },
        _sum: { tempoAssistido: true },
        _count: true,
      }),
      prisma.comentario.count({
        where: {
          video: { uploaderId: usuarioId },
        },
      }),
      prisma.avaliacao.aggregate({
        where: {
          video: { uploaderId: usuarioId },
        },
        _avg: { nota: true },
        _count: true,
      }),
    ]);

    return {
      totalVideos: usuario?._count.videos ?? 0,
      totalVisualizacoes: visualizacoes._count,
      totalComentarios: comentarios,
      notaMedia: avaliacoes._avg.nota ?? 0,
      totalAvaliacoes: avaliacoes._count,
    };
  },
};
