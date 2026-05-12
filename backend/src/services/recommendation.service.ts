import { RecommendationRepository } from '../repositories/recommendation.repository.js';
import { cache } from '../utils/cache.js';

export const RecommendationService = {
  /**
   * Obtém vídeos recomendados personalizados para um usuário.
   */
  getRecommendedVideos: async (userId: number, pagina: number = 1, limite: number = 10) => {
    const cacheKey = `recommended_${userId}_${pagina}_${limite}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // 1. Buscar afinidade do usuário (categorias e tags preferidas)
    const afinidade = await RecommendationRepository.buscarAfinidadeUsuario(userId);
    
    // 2. Buscar candidatos (excluindo os já assistidos)
    const candidatos = await RecommendationRepository.buscarCandidatos(userId, 100);

    // 3. Calcular scores
    const scoredVideos = candidatos.map(video => {
      let score = 0;

      // Categoria (25%)
      if (afinidade.categorias[video.categoriaId]) {
        score += 0.25 * (afinidade.categorias[video.categoriaId] / 10); // Normalizado
      }

      // Tags (35%)
      const matchingTags = video.tags.filter(t => afinidade.tags[t.id]);
      if (matchingTags.length > 0) {
        score += 0.35 * (matchingTags.length / 5); // Ex: 5 tags batendo = bônus máximo
      }

      // Popularidade (20%)
      const viewsCount = video.visualizacoes.length;
      const likesCount = video.favoritos.length;
      const popScore = Math.min((viewsCount * 0.1 + likesCount * 0.5) / 10, 1);
      score += 0.20 * popScore;

      // Recência (10%)
      const diasDesdeCriacao = (Date.now() - video.criadoEm.getTime()) / (1000 * 60 * 60 * 24);
      const recenciaScore = Math.max(0, 1 - (diasDesdeCriacao / 30)); // Decai em 30 dias
      score += 0.10 * recenciaScore;

      // Interesse/Afinidade Extra (10%)
      const favoritouCategoria = video.favoritos.some(f => f.usuarioId === userId);
      if (favoritouCategoria) score += 0.05;
      
      const tempoMedio = video.visualizacoes.reduce((acc, v) => acc + v.tempoAssistido, 0) / (viewsCount || 1);
      if (tempoMedio > 60) score += 0.05;

      return { ...video, recommendationScore: score };
    });

    // 4. Ordenar e paginar
    const sorted = scoredVideos.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const start = (pagina - 1) * limite;
    const paginated = sorted.slice(start, start + limite);

    const result = {
      videos: paginated,
      total: sorted.length,
      pagina,
      limite
    };

    cache.set(cacheKey, result, 300000); // 5 minutos
    return result;
  },

  /**
   * Obtém vídeos relacionados a um vídeo específico.
   */
  getRelatedVideos: async (videoId: number, pagina: number = 1, limite: number = 10) => {
    const cacheKey = `related_${videoId}_${pagina}_${limite}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // 1. Pegar detalhes do vídeo base
    const videoBase = await RecommendationRepository.buscarCandidatos(undefined, 100);
    const currentVideo = videoBase.find(v => v.id === videoId);

    if (!currentVideo) return { videos: [], total: 0 };

    const tagIds = currentVideo.tags.map(t => t.id);
    
    // 2. Buscar candidatos relacionados
    const candidatos = await RecommendationRepository.buscarRelacionados(
      videoId, 
      currentVideo.categoriaId, 
      tagIds, 
      50
    );

    // 3. Score simplificado para relacionados
    const scored = candidatos.map(video => {
      let score = 0;
      if (video.categoriaId === currentVideo.categoriaId) score += 0.4;
      
      const commonTags = video.tags.filter(t => tagIds.includes(t.id)).length;
      score += (commonTags / (tagIds.length || 1)) * 0.6;

      return { ...video, recommendationScore: score };
    });

    const sorted = scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
    const start = (pagina - 1) * limite;
    
    const result = {
      videos: sorted.slice(start, start + limite),
      total: sorted.length,
      pagina,
      limite
    };

    cache.set(cacheKey, result, 900000); // 15 minutos
    return result;
  },

  /**
   * Obtém vídeos em alta.
   */
  getTrendingVideos: async (pagina: number = 1, limite: number = 10) => {
    const cacheKey = `trending_${pagina}_${limite}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const trending = await RecommendationRepository.buscarTrending(50);
    
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
