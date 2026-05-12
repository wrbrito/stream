import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RecommendationService } from '../src/services/recommendation.service.js';
import { RecommendationRepository } from '../src/repositories/recommendation.repository.js';
import { cache } from '../src/utils/cache.js';

// Mock do cache para testes
vi.mock('../src/utils/cache.js', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock do repository
vi.mock('../src/repositories/recommendation.repository.js', () => ({
  RecommendationRepository: {
    buscarAfinidadeUsuario: vi.fn(),
    buscarCandidatosParaRecomendacao: vi.fn(),
    buscarVideoBase: vi.fn(),
    buscarRelacionados: vi.fn(),
    buscarTrending: vi.fn(),
  },
}));

describe('RecommendationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getRecommendedVideos', () => {
    it('deve retornar vídeos recomendados com score híbrido', async () => {
      const mockAfinidade = {
        categorias: { 1: 5, 2: 3 },
        tags: { 10: 4, 20: 2 },
        tempoAssistidoPorTagId: { 10: 300, 20: 150 },
        tempoAssistidoPorCategoriaId: { 1: 600, 2: 400 },
      };

      const mockCandidatos = [
        {
          id: 1,
          titulo: 'Vídeo 1',
          categoriaId: 1,
          tagIds: [10, 20],
          criadoEm: new Date('2024-01-01'),
          viewsCount: 100,
          likesCount: 10,
          tempoAssistidoMedio: 120,
        },
        {
          id: 2,
          titulo: 'Vídeo 2',
          categoriaId: 2,
          tagIds: [20],
          criadoEm: new Date('2024-01-02'),
          viewsCount: 50,
          likesCount: 5,
          tempoAssistidoMedio: 90,
        },
      ];

      (RecommendationRepository.buscarAfinidadeUsuario as any).mockResolvedValue(mockAfinidade);
      (RecommendationRepository.buscarCandidatosParaRecomendacao as any).mockResolvedValue(mockCandidatos);
      (cache.get as any).mockReturnValue(null);

      const result = await RecommendationService.getRecommendedVideos(1, 1, 10);

      expect(result.videos).toHaveLength(2);
      expect(result.videos[0]).toHaveProperty('recommendationScore');
      expect(result.videos[0]).toHaveProperty('scoreBreakdown');
      expect(result.total).toBe(2);
      expect(result.pagina).toBe(1);
      expect(result.limite).toBe(10);
    });

    it('deve usar cache quando disponível', async () => {
      const cachedResult = { videos: [], total: 0, pagina: 1, limite: 10 };
      (cache.get as any).mockReturnValue(cachedResult);

      const result = await RecommendationService.getRecommendedVideos(1, 1, 10);

      expect(result).toBe(cachedResult);
      expect(RecommendationRepository.buscarAfinidadeUsuario).not.toHaveBeenCalled();
    });

    it('deve excluir vídeos já assistidos', async () => {
      const mockAfinidade = { categorias: {}, tags: {}, tempoAssistidoPorTagId: {}, tempoAssistidoPorCategoriaId: {} };
      const mockCandidatos = [{ id: 1, titulo: 'Vídeo 1', categoriaId: 1, tagIds: [], criadoEm: new Date(), viewsCount: 0, likesCount: 0, tempoAssistidoMedio: 0 }];

      (RecommendationRepository.buscarAfinidadeUsuario as any).mockResolvedValue(mockAfinidade);
      (RecommendationRepository.buscarCandidatosParaRecomendacao as any).mockResolvedValue(mockCandidatos);
      (cache.get as any).mockReturnValue(null);

      await RecommendationService.getRecommendedVideos(1, 1, 10);

      expect(RecommendationRepository.buscarCandidatosParaRecomendacao).toHaveBeenCalledWith(1, 200);
    });
  });

  describe('getRelatedVideos', () => {
    it('deve retornar vídeos relacionados', async () => {
      const mockVideoBase = { id: 1, categoriaId: 1, tags: [{ id: 10 }, { id: 20 }] };
      const mockRelacionados = [
        {
          id: 2,
          titulo: 'Vídeo Relacionado',
          categoriaId: 1,
          tagIds: [10],
          criadoEm: new Date(),
          viewsCount: 50,
          likesCount: 5,
          tempoAssistidoMedio: 100,
        },
      ];

      (RecommendationRepository.buscarVideoBase as any).mockResolvedValue(mockVideoBase);
      (RecommendationRepository.buscarRelacionados as any).mockResolvedValue(mockRelacionados);
      (cache.get as any).mockReturnValue(null);

      const result = await RecommendationService.getRelatedVideos(1, 1, 10);

      expect(result.videos).toHaveLength(1);
      expect(result.videos[0]).toHaveProperty('recommendationScore');
      expect(result.total).toBe(1);
    });

    it('deve retornar erro se vídeo base não existir', async () => {
      (RecommendationRepository.buscarVideoBase as any).mockResolvedValue(null);

      const result = await RecommendationService.getRelatedVideos(999, 1, 10);

      expect(result.videos).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getTrendingVideos', () => {
    it('deve retornar vídeos em alta', async () => {
      const mockTrending = [
        {
          id: 1,
          titulo: 'Vídeo Trending',
          criadoEm: new Date(),
          viewsCount: 200,
          likesCount: 20,
          recentViewsCount: 50,
          tempoAssistidoMedio: 150,
        },
      ];

      (RecommendationRepository.buscarTrending as any).mockResolvedValue(mockTrending);
      (cache.get as any).mockReturnValue(null);

      const result = await RecommendationService.getTrendingVideos(1, 10);

      expect(result.videos).toHaveLength(1);
      expect(result.videos[0]).toHaveProperty('trendingScore');
      expect(result.total).toBe(1);
    });
  });
});