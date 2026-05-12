import { prisma } from '../lib/prisma.js';

/**
 * Repositório de recomendação.
 *
 * Objetivo: devolver dados já agregados/necessários para cálculo de score no service.
 *
 * Por performance:
 * - evitar carregar arrays grandes (ex.: visualizações completas)
 * - retornar apenas contagens/somas básicas
 */
export const RecommendationRepository = {
  /**
   * Afinidade do usuário baseada no histórico de visualizações.
   *
   * - categoria: contagem de visualizações na categoria
   * - tags: contagem de visualizações por tag
   * - interesse: soma e pesos baseados em tempo assistido
   */
  buscarAfinidadeUsuario: async (userId: number) => {
    const [historico, favoritos] = await Promise.all([
      prisma.visualizacao.findMany({
        where: { usuarioId: userId },
        select: {
          tempoAssistido: true,
          video: {
            select: {
              categoriaId: true,
              tags: { select: { id: true } },
            },
          },
        },
        orderBy: { id: 'desc' },
        take: 500,
      }),
      prisma.favorito.findMany({
        where: { usuarioId: userId },
        select: {
          video: {
            select: {
              categoriaId: true,
              tags: { select: { id: true } },
            },
          },
        },
        orderBy: { criadoEm: 'desc' },
        take: 200,
      }),
    ]);

    const categorias: Record<number, number> = {};
    const tags: Record<number, number> = {};

    const tempoAssistidoPorTagId: Record<number, number> = {};
    const tempoAssistidoPorCategoriaId: Record<number, number> = {};

    for (const h of historico) {
      const categoriaId = h.video.categoriaId;
      categorias[categoriaId] = (categorias[categoriaId] || 0) + 1;
      tempoAssistidoPorCategoriaId[categoriaId] =
        (tempoAssistidoPorCategoriaId[categoriaId] || 0) + (h.tempoAssistido || 0);

      for (const t of h.video.tags) {
        tags[t.id] = (tags[t.id] || 0) + 1;
        tempoAssistidoPorTagId[t.id] = (tempoAssistidoPorTagId[t.id] || 0) + (h.tempoAssistido || 0);
      }
    }

    // Curtidas/favoritos funcionam como um sinal forte de afinidade.
    for (const favorito of favoritos) {
      const categoriaId = favorito.video.categoriaId;
      categorias[categoriaId] = (categorias[categoriaId] || 0) + 3;

      for (const t of favorito.video.tags) {
        tags[t.id] = (tags[t.id] || 0) + 3;
      }
    }

    return {
      categorias,
      tags,
      tempoAssistidoPorTagId,
      tempoAssistidoPorCategoriaId,
    };
  },

  /**
   * Busca vídeo base (categoria e tags) para montar lista de relacionados.
   */
  buscarVideoBase: async (videoId: number) => {
    return prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        categoriaId: true,
        tags: { select: { id: true } },
      },
    });
  },

  /**
   * Busca candidatos para recomendação.
   *
   * Regras:
   * - Filtra vídeos disponíveis
   * - Se userId existir: exclui vídeos já assistidos
   *
   * Retorna agregados:
   * - viewsCount: total de visualizações
   * - likesCount: total de favoritos
   * - tempoAssistidoMedio (aprox): média do tempo assistido entre as últimas visualizações
   *
   * Observação: tempoAssistidoMedio é uma aproximação baseada em um subconjunto para manter performance.
   */
  buscarCandidatosParaRecomendacao: async (userId: number | undefined, limite: number) => {
    const assistidos = userId
      ? await prisma.visualizacao.findMany({
          where: { usuarioId: userId },
          select: { videoId: true },
        }).then((rows) => rows.map((r) => r.videoId))
      : [];

    const candidatos = await prisma.video.findMany({
      where: {
        status: { in: ['ATIVO', 'PUBLICADO'] },
        ...(userId ? { id: { notIn: assistidos } } : {}),
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        autor: true,
        tipo: true,
        status: true,
        urlOriginal: true,
        caminhoArquivo: true,
        miniatura: true,
        criadoEm: true,
        categoriaId: true,
        categoria: { select: { id: true, nome: true } },
        tags: { select: { id: true } },
        _count: { select: { visualizacoes: true, favoritos: true } },
        // recência/tempo: aproximar com últimas visualizações do próprio vídeo
        visualizacoes: {
          select: { tempoAssistido: true, data: true },
          orderBy: { data: 'desc' },
          take: 50,
        },
      },
      take: limite,
      orderBy: { criadoEm: 'desc' },
    });

    return candidatos.map((v) => {
      const tempoAssistidoTotal = (v.visualizacoes || []).reduce((acc, x) => acc + (x.tempoAssistido || 0), 0);
      const tempoAssistidoMedio = tempoAssistidoTotal / Math.max(1, (v.visualizacoes || []).length);

      return {
        ...v,
        tagIds: v.tags.map((t) => t.id),
        viewsCount: v._count.visualizacoes,
        likesCount: v._count.favoritos,
        tempoAssistidoTotal,
        tempoAssistidoMedio,
      };
    });
  },

  /**
   * Busca relacionados por categoria e tags.
   */
  buscarRelacionados: async (videoId: number, categoriaId: number, tagIds: number[], limite: number) => {
    return prisma.video.findMany({
      where: {
        id: { not: videoId },
        status: { in: ['ATIVO', 'PUBLICADO'] },
        OR: [
          { categoriaId },
          ...(tagIds.length
            ? [
                {
                  tags: {
                    some: { id: { in: tagIds } },
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        autor: true,
        tipo: true,
        status: true,
        urlOriginal: true,
        caminhoArquivo: true,
        miniatura: true,
        criadoEm: true,
        categoriaId: true,
        categoria: { select: { id: true, nome: true } },
        tags: { select: { id: true } },
        _count: { select: { visualizacoes: true, favoritos: true } },
        visualizacoes: {
          select: { tempoAssistido: true },
          orderBy: { data: 'desc' },
          take: 50,
        },
      },
      take: limite,
      orderBy: { criadoEm: 'desc' },
    }).then((rows) =>
      rows.map((v) => {
        const tempoAssistidoTotal = (v.visualizacoes || []).reduce((acc, x) => acc + (x.tempoAssistido || 0), 0);
        const tempoAssistidoMedio = tempoAssistidoTotal / Math.max(1, (v.visualizacoes || []).length);

        return {
          ...v,
          tagIds: v.tags.map((t) => t.id),
          viewsCount: v._count.visualizacoes,
          likesCount: v._count.favoritos,
          tempoAssistidoTotal,
          tempoAssistidoMedio,
        };
      })
    );
  },

  /**
   * Busca trending (em alta) em janela de tempo.
   *
   * Ranking final será ajustado no service pelo score híbrido,
   * aqui garantimos janela e métricas.
   */
  buscarTrending: async (limite: number = 10, lookbackDias: number = 7) => {
      const dataMin = new Date();
    dataMin.setDate(dataMin.getDate() - lookbackDias);

    return prisma.video.findMany({
      where: {
        status: { in: ['ATIVO', 'PUBLICADO'] },
        visualizacoes: {
          some: { data: { gte: dataMin } },
        },
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        autor: true,
        tipo: true,
        status: true,
        urlOriginal: true,
        caminhoArquivo: true,
        miniatura: true,
        criadoEm: true,
        categoriaId: true,
        categoria: { select: { id: true, nome: true } },
        tags: { select: { id: true } },
        _count: { select: { visualizacoes: true, favoritos: true } },
        visualizacoes: {
          select: { tempoAssistido: true, data: true },
          orderBy: { data: 'desc' },
          take: 50,
        },
      },
      take: limite,
      orderBy: { criadoEm: 'desc' },
    }).then((rows) =>
      rows.map((v) => {
        const tempoAssistidoTotal = (v.visualizacoes || []).reduce((acc, x) => acc + (x.tempoAssistido || 0), 0);
        const tempoAssistidoMedio = tempoAssistidoTotal / Math.max(1, (v.visualizacoes || []).length);
        const recentViewsCount = (v.visualizacoes || []).filter((x) => x.data >= dataMin).length;

        return {
          ...v,
          tagIds: v.tags.map((t) => t.id),
          viewsCount: v._count.visualizacoes,
          likesCount: v._count.favoritos,
          recentViewsCount,
          tempoAssistidoTotal,
          tempoAssistidoMedio,
        };
      })
    );
  },
};
