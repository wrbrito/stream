import { Request, Response } from 'express';
import { CanalService } from '../services/canal.service.js';

export const CanalController = {
  obter: async (req: Request, res: Response) => {
    try {
      const usuarioId = Number(req.params.id);

      if (isNaN(usuarioId)) {
        return res.status(400).json({ sucesso: false, erro: 'ID de usuário inválido' });
      }

      const canal = await CanalService.obterCanal(usuarioId);
      return res.json({ sucesso: true, dados: canal });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao carregar canal';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  listarVideos: async (req: Request, res: Response) => {
    try {
      const usuarioId = Number(req.params.id);
      const pagina = parseInt(req.query.pagina as string) || 1;
      const limite = parseInt(req.query.limite as string) || 12;

      if (isNaN(usuarioId)) {
        return res.status(400).json({ sucesso: false, erro: 'ID de usuário inválido' });
      }

      if (pagina < 1 || limite < 1) {
        return res.status(400).json({ sucesso: false, erro: 'Página e limite devem ser maiores que 0' });
      }

      const videos = await CanalService.listarVideosDoCanal(usuarioId, pagina, limite);
      return res.json({ sucesso: true, dados: videos });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao listar vídeos do canal';
      const statusCode = erro instanceof Error && erro.message === 'Este canal é privado' ? 403 : 400;
      return res.status(statusCode).json({ sucesso: false, erro: mensagem });
    }
  },

  obterEstatisticas: async (req: Request, res: Response) => {
    try {
      const usuarioId = Number(req.params.id);

      if (isNaN(usuarioId)) {
        return res.status(400).json({ sucesso: false, erro: 'ID de usuário inválido' });
      }

      const stats = await CanalService.obterEstatisticasCanal(usuarioId);
      return res.json({ sucesso: true, dados: stats });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao carregar estatísticas';
      const statusCode = erro instanceof Error && erro.message === 'Este canal é privado' ? 403 : 400;
      return res.status(statusCode).json({ sucesso: false, erro: mensagem });
    }
  },

  atualizarDescricao: async (req: Request, res: Response) => {
    try {
      const { descricao } = req.body;

      if (descricao !== null && typeof descricao !== 'string') {
        return res.status(400).json({ sucesso: false, erro: 'Descrição inválida' });
      }

      const canal = await CanalService.atualizarDescricaoCanal(req.usuario!.id, descricao ?? null);
      return res.json({ sucesso: true, dados: canal });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao atualizar descrição do canal';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  atualizarPrivacidade: async (req: Request, res: Response) => {
    try {
      const { canalPublico } = req.body;

      if (typeof canalPublico !== 'boolean') {
        return res.status(400).json({ sucesso: false, erro: 'canalPublico deve ser um booleano' });
      }

      const canal = await CanalService.atualizarPrivacidadeCanal(req.usuario!.id, canalPublico);
      return res.json({ sucesso: true, dados: canal });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao atualizar privacidade do canal';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  obterMeuCanal: async (req: Request, res: Response) => {
    try {
      const canal = await CanalService.obterCanalDoProprio(req.usuario!.id);
      return res.json({ sucesso: true, dados: canal });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao carregar seu canal';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },
};
