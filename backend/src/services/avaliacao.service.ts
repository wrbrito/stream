import { AvaliacaoRepository } from '../repositories/avaliacao.repository.js';

export const AvaliacaoService = {
  avaliar: async (dados: { nota: number; videoId: number; usuarioId: number }) => {
    if (dados.nota < 1 || dados.nota > 5) {
      throw new Error('A nota deve estar entre 1 e 5');
    }

    return AvaliacaoRepository.salvar(dados);
  },

  obterEstatisticas: async (videoId: number, usuarioId?: number) => {
    const stats = await AvaliacaoRepository.obterMedia(videoId);
    let minhaNota = null;

    if (usuarioId) {
      const avaliacao = await AvaliacaoRepository.buscarPorVideoEUsuario(videoId, usuarioId);
      minhaNota = avaliacao ? avaliacao.nota : null;
    }

    return {
      ...stats,
      minhaNota,
    };
  },
};
