import { Request, Response } from 'express';
import { ConfiguracaoService } from '../services/configuracao.service.js';

export const ConfiguracaoController = {
  listar: async (_req: Request, res: Response) => {
    try {
      const configs = await ConfiguracaoService.listar();
      return res.json({ sucesso: true, dados: configs });
    } catch (erro) {
      return res.status(500).json({ sucesso: false, erro: 'Erro ao listar configurações' });
    }
  },

  salvar: async (req: Request, res: Response) => {
    try {
      const { configs } = req.body;
      if (!configs || typeof configs !== 'object') {
        return res.status(400).json({ sucesso: false, erro: 'Dados de configuração inválidos' });
      }

      await ConfiguracaoService.salvarMuitas(configs);
      return res.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso' });
    } catch (erro) {
      console.error('Erro ao salvar configurações:', erro);
      return res.status(500).json({ sucesso: false, erro: 'Erro ao salvar configurações' });
    }
  },
};
