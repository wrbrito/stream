import { prisma } from '../lib/prisma.js';

export const RecommendationRepository = {
  /**
   * Busca vídeos candidatos para recomendação.
   * Filtra vídeos já assistidos se o userId for fornecido.
   */
  buscarCandidatos: async (userId?: number, limite: number = 50) => {
    const assistidos = userId 
      ? await prisma.visualizacao.findMany({
          where: { usuarioId: userId },
          select: { videoId: true }
        }).then(v => v.map(i => i.videoId))
      : [];

    return prisma.video.findMany({
      where: {
        status: 'PUBLICADO', // Assumindo que este status existe ou é o objetivo
        id: { notIn: assistidos }
      },
      include: {
        categoria: true,
        tags: true,
        visualizacoes: {
          select: { id: true, tempoAssistido: true }
        },
        favoritos: {
          select: { usuarioId: true }
        }
      },
      take: limite,
      orderBy: { criadoEm: 'desc' }
    });
  },

  /**
   * Busca vídeos relacionados por categoria e tags.
   */
  buscarRelacionados: async (videoId: number, categoriaId: number, tagIds: number[], limite: number = 10) => {
    return prisma.video.findMany({
      where: {
        id: { not: videoId },
        status: 'PUBLICADO',
        OR: [
          { categoriaId },
          { tags: { some: { id: { in: tagIds } } } }
        ]
      },
      include: {
        categoria: true,
        tags: true,
        visualizacoes: { select: { id: true } },
        favoritos: { select: { id: true } }
      },
      take: limite
    });
  },

  /**
   * Busca vídeos em alta (trending) baseados em visualizações recentes.
   */
  buscarTrending: async (limite: number = 10) => {
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

    return prisma.video.findMany({
      where: {
        status: 'PUBLICADO',
        visualizacoes: {
          some: {
            data: { gte: umaSemanaAtras }
          }
        }
      },
      include: {
        categoria: true,
        tags: true,
        _count: {
          select: { visualizacoes: true, favoritos: true }
        }
      },
      orderBy: [
        { visualizacoes: { _count: 'desc' } },
        { criadoEm: 'desc' }
      ],
      take: limite
    });
  },

  /**
   * Busca histórico de afinidade do usuário (categorias e tags que ele mais consome).
   */
  buscarAfinidadeUsuario: async (userId: number) => {
    const historico = await prisma.visualizacao.findMany({
      where: { usuarioId: userId },
      include: {
        video: {
          include: {
            tags: true
          }
        }
      },
      orderBy: { data: 'desc' },
      take: 100
    });

    const categorias: Record<number, number> = {};
    const tags: Record<number, number> = {};

    historico.forEach(h => {
      const vid = h.video;
      categorias[vid.categoriaId] = (categorias[vid.categoriaId] || 0) + 1;
      vid.tags.forEach(t => {
        tags[t.id] = (tags[t.id] || 0) + 1;
      });
    });

    return { categorias, tags };
  }
};
