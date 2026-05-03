import { ConfiguracaoRepository } from '../repositories/configuracao.repository.js';

export const ConfiguracaoService = {
  obter: async (chave: string, valorPadrao: string = '') => {
    const config = await ConfiguracaoRepository.buscarPorChave(chave);
    return config ? config.valor : valorPadrao;
  },

  listar: async () => {
    const configs = await ConfiguracaoRepository.listar();
    return configs.reduce((acc, curr) => {
      acc[curr.chave] = curr.valor;
      return acc;
    }, {} as Record<string, string>);
  },

  salvar: async (chave: string, valor: string) => {
    return ConfiguracaoRepository.salvar(chave, valor);
  },

  salvarMuitas: async (dados: Record<string, string>) => {
    const promessas = Object.entries(dados).map(([chave, valor]) =>
      ConfiguracaoRepository.salvar(chave, valor)
    );
    return Promise.all(promessas);
  },
};
