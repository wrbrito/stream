import { RecommendationRepository } from '../repositories/recommendation.repository.js';
import { ConfiguracaoService } from './configuracao.service.js';
import { cache } from '../utils/cache.js';

const normalize01 = (value: number, min: number, max: number) => {
  if (max <= min) return 0;
  const v = Math.min(max, Math.max(min, value));
  return (v - min) / (max - min);
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const daysSince = (date: Date) => (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);

const normalizarPaginacao = (pagina: number, limite: number) => ({
  pagina: Math.max(1, Number.isFinite(pagina) ? Math.floor(pagina) : 1),
  limite: Math.min(50, Math.max(1, Number.isFinite(limite) ? Math.floor(limite) : 10)),
});

const hybridScore = (args: {
  tagsScore: number;
  categoriaScore: number;
  popularidadeScore: number;
  recenciaScore: number;
  interesseUsuarioScore: number;
}) => {
  // Pesos conforme solicitado:
  // 0.35 tags + 0.25 categoria + 0.20 popularidade + 0.10 recência + 0.10 interesse
  return (
    0.35 * args.tagsScore +
    0.25 * args.categoriaScore +
    0.20 * args.popularidadeScore +
    0.10 * args.recenciaScore +
    0.10 * args.interesseUsuarioScore
  );
};

export const RecommendationService = {
  /**
   * Obtém vídeos recomendados personalizados para um usuário.
   */
  getRecommendedVideos: async (userId: number, pagina: number = 1, limite: number = 10) => {
    // Verificar se recomendados estão ativados
    const ativarRecomendados = await ConfiguracaoService.obter('ATIVAR_RECOMENDADOS', 'true');
    if (ativarRecomendados === 'false') {
      return { videos: [], total: 0, pagina, limite };
    }

    // Obter quantidade configurada de vídeos recomendados
    const qtdConfigurada = parseInt(await ConfiguracaoService.obter('QTD_VIDEOS_RECOMENDADOS', '10'));
    const qtdFinal = Number.isNaN(qtdConfigurada) ? 10 : qtdConfigurada;
    
    ({ pagina, limite } = normalizarPaginacao(pagina, Math.min(limite, qtdFinal)));
    const cacheKey = `recommended_${userId}_${pagina}_${limite}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const afinidade = await RecommendationRepository.buscarAfinidadeUsuario(userId);

    // pool inicial maior para permitir ranking; paginamos no service
    const candidatos = await RecommendationRepository.buscarCandidatosParaRecomendacao(userId, 200);

    const allScores = candidatos.map((video) => {
      // 1) tags: similaridade por interseção
      const matchingTags = video.tagIds.filter(
        (id: number) => (afinidade.tags || {})[id] !== undefined
      );
      // normaliza por quantidade de tags do vídeo (heurística simples)
      const tagsScore = clamp01(
        matchingTags.length / Math.max(1, video.tagIds.length)
      );


      // 2) categoria: mesma categoria no histórico
      const categoriaCount = (afinidade.categorias || {})[video.categoriaId] || 0;
      // normaliza por faixa (heurística simples)
      const categoriaScore = clamp01(normalize01(categoriaCount, 0, 50));

      // 3) popularidade: views e likes agregados
      const viewsCount = video.viewsCount || 0;
      const likesCount = video.likesCount || 0;
      // normalização por faixas típicas
      const viewsScore = normalize01(viewsCount, 0, 1000);
      const likesScore = normalize01(likesCount, 0, 200);
      const popularidadeScore = clamp01(0.7 * viewsScore + 0.3 * likesScore);

      // 4) recência: bônus para vídeos mais recentes
      const d = daysSince(video.criadoEm);
      // decai até 30 dias
      const recenciaScore = clamp01(1 - d / 30);

      // 5) interesse do usuário: baseado em tempo assistido (tags e categoria)
      const tempoCategoria = (afinidade.tempoAssistidoPorCategoriaId || {})[video.categoriaId] || 0;
      const tempoTagsSoma = matchingTags.reduce((acc: number, tagId: number) => {
        return acc + ((afinidade.tempoAssistidoPorTagId || {})[tagId] || 0);
      }, 0);
      const tempoInteresse = tempoCategoria * 0.6 + tempoTagsSoma * 0.4;
      const interesseUsuarioScore = clamp01(normalize01(tempoInteresse, 0, 5000));

      const recommendationScore = hybridScore({
        tagsScore,
        categoriaScore,
        popularidadeScore,
        recenciaScore,
        interesseUsuarioScore,
      });

      return { ...video, recommendationScore, scoreBreakdown: {
        tagsScore,
        categoriaScore,
        popularidadeScore,
        recenciaScore,
        interesseUsuarioScore,
      }};
    });

    const sorted = allScores.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const start = (pagina - 1) * limite;
    const paginated = sorted.slice(start, start + limite);

    const result = {
      videos: paginated,
      total: sorted.length,
      pagina,
      limite,
    };

    cache.set(cacheKey, result, 300000); // 5 min
    return result;
  },


  /**
   * Obtém vídeos relacionados a um vídeo específico.
   */
  getRelatedVideos: async (videoId: number, pagina: number = 1, limite: number = 10) => {
    ({ pagina, limite } = normalizarPaginacao(pagina, limite));
    const cacheKey = `related_${videoId}_${pagina}_${limite}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // 1. Pegar detalhes do vídeo base (categoria + tags)
    const currentVideo = await RecommendationRepository.buscarVideoBase(videoId);
    if (!currentVideo) return { videos: [], total: 0, pagina, limite };

    const tagIds = currentVideo.tags.map((t: { id: number }) => t.id);

    // 2. Buscar candidatos relacionados
    const candidatos = await RecommendationRepository.buscarRelacionados(
      videoId,
      currentVideo.categoriaId,
      tagIds,
      100
    );

    // 3. Score híbrido simplificado para relacionados (mantém regras principais)
    const scored = candidatos.map((video: any) => {
      const tagsSimilares = video.tagIds.filter((id: number) => tagIds.includes(id)).length;
      const tagsScore = clamp01(tagsSimilares / Math.max(1, tagIds.length));

      const categoriaScore = video.categoriaId === currentVideo.categoriaId ? 1 : 0;

      const viewsScore = normalize01(video.viewsCount || 0, 0, 1000);
      const likesScore = normalize01(video.likesCount || 0, 0, 200);
      const popularidadeScore = clamp01(0.7 * viewsScore + 0.3 * likesScore);

      const d = daysSince(video.criadoEm);
      const recenciaScore = clamp01(1 - d / 30);

      // relacionado não tem afinidade de usuário -> interesse neutro baseado em tempo assistido do vídeo
      const interesseUsuarioScore = clamp01(normalize01(video.tempoAssistidoMedio || 0, 0, 300));

      const recommendationScore = hybridScore({
        tagsScore,
        categoriaScore,
        popularidadeScore,
        recenciaScore,
        interesseUsuarioScore,
      });

      return { ...video, recommendationScore, scoreBreakdown: {
        tagsScore,
        categoriaScore,
        popularidadeScore,
        recenciaScore,
        interesseUsuarioScore,
      }};
    });

    const sorted = scored.sort((a: any, b: any) => b.recommendationScore - a.recommendationScore);
    const start = (pagina - 1) * limite;

    const result = {
      videos: sorted.slice(start, start + limite),
      total: sorted.length,
      pagina,
      limite,
    };


    cache.set(cacheKey, result, 900000); // 15 minutos
    return result;
  },

  /**
   * Obtém vídeos em alta.
   */
  getTrendingVideos: async (pagina: number = 1, limite: number = 10) => {
    // Verificar se "em alta" estão ativados
    const ativarEmAlta = await ConfiguracaoService.obter('ATIVAR_EM_ALTA', 'true');
    if (ativarEmAlta === 'false') {
      return { videos: [], total: 0, pagina, limite };
    }

    // Obter quantidade configurada de vídeos em alta
    const qtdConfigurada = parseInt(await ConfiguracaoService.obter('QTD_VIDEOS_EM_ALTA', '10'));
    const qtdFinal = Number.isNaN(qtdConfigurada) ? 10 : qtdConfigurada;
    
    ({ pagina, limite } = normalizarPaginacao(pagina, Math.min(limite, qtdFinal)));
    const cacheKey = `trending_${pagina}_${limite}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const candidatos = await RecommendationRepository.buscarTrending(100);

    const trending = candidatos
      .map((video: any) => {
        const viewsScore = normalize01(video.recentViewsCount || video.viewsCount || 0, 0, 500);
        const likesScore = normalize01(video.likesCount || 0, 0, 200);
        const popularidadeScore = clamp01(0.75 * viewsScore + 0.25 * likesScore);

        const d = daysSince(video.criadoEm);
        const recenciaScore = clamp01(1 - d / 30);

        const retentionScore = clamp01(normalize01(video.tempoAssistidoMedio || 0, 0, 300));
        const trendingScore = clamp01(0.65 * popularidadeScore + 0.25 * recenciaScore + 0.10 * retentionScore);

        return {
          ...video,
          trendingScore,
          recommendationScore: trendingScore,
          scoreBreakdown: {
            popularidadeScore,
            recenciaScore,
            tempoAssistidoScore: retentionScore,
          },
        };
      })
      .sort((a: any, b: any) => b.trendingScore - a.trendingScore);
    
    const start = (pagina - 1) * limite;
    const result = {
      videos: trending.slice(start, start + limite),
      total: trending.length,
      pagina,
      limite
    };

    cache.set(cacheKey, result, 600000); // 10 minutos
    return result;
  }
};
