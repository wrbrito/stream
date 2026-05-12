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

  listarPublicas: async () => {
    const todas = await ConfiguracaoService.listar();
    const chavesPublicas = [
      'LOGO_URL',
      'NOME_SITE',
      'COR_PRIMARIA',
      'WATERMARK_TEXT',
      'WATERMARK_POSITION',
      'MARCA_DAGUA_TEXTO',
      'MARCA_DAGUA_POSICAO',
      'EXIBIR_CATEGORIAS',
      'EXIBIR_RODAPE',
      'SUPORTE_EMAIL',
      'RODAPE_GESTOR_NOME',
      'RODAPE_GESTOR_EMAIL',
      'RODAPE_ESCRITO_POR',
      'RODAPE_ESCRITO_POR_EMAIL',
      'QTD_VIDEOS_DESTAQUE',
      'QTD_VIDEOS_RELACIONADOS',
      'ATIVAR_RECOMENDADOS',
      'QTD_VIDEOS_RECOMENDADOS',
      'ATIVAR_EM_ALTA',
      'QTD_VIDEOS_EM_ALTA',
    ];

    return chavesPublicas.reduce((acc, chave) => {
      if (todas[chave] !== undefined) {
        acc[chave] = todas[chave];
      }
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
