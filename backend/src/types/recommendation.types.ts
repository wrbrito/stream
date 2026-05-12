export type RecommendationVideo = {
  id: number;
  titulo: string;
  descricao: string;
  autor: string;
  tipo: string;
  status: string;
  urlOriginal?: string | null;
  caminhoArquivo?: string | null;
  miniatura?: string | null;
  criadoEm: Date;

  categoriaId: number;
  categoria?: {
    id: number;
    nome: string;
  };

  tagIds: number[];

  // Métricas agregadas
  viewsCount: number;
  likesCount: number;
  tempoAssistidoTotal: number; // soma do tempo assistido por usuário (agregado)
  tempoAssistidoMedio: number; // tempo assistido médio (agregado)

  // Score final
  recommendationScore: number;
};

export type UserAffinity = {
  categoriaScoreById: Record<number, number>; // contagem ou peso por categoria
  tagsScoreById: Record<number, number>; // contagem ou peso por tag
  // Para interesse baseado em tempo assistido
  tempoAssistidoPorTagId: Record<number, number>;
  tempoAssistidoPorCategoriaId: Record<number, number>;
};

export type HybridScoreInputs = {
  // Similaridade por tags e categoria (entre vídeo candidato e afinidade do usuário)
  tagsSimilares: number; // quantidade (ou score) de tags que batem
  categoriaId: number;

  // Popularidade agregada
  viewsCount: number;
  likesCount: number;

  // Recência
  criadoEm: Date;

  // Afinidade/interesse
  afinidadeTagsScore: number; // score normalizado/ponderado
  afinidadeCategoriaScore: number; // score normalizado/ponderado
  interesseUsuarioScore: number; // score normalizado baseado em curtidas/tempo
};

export type PaginatedRecommendationResult<T> = {
  videos: T[];
  total: number;
  pagina: number;
  limite: number;
};

export type RecommendationExplain = {
  scoreTags: number;
  scoreCategoria: number;
  scorePopularidade: number;
  scoreRecencia: number;
  scoreInteresseUsuario: number;
};

