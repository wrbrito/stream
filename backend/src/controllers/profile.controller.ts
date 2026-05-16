import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service.js';

export const ProfileController = {
  obter: async (req: Request, res: Response) => {
    try {
      const perfil = await ProfileService.obter(req.usuario!.id);
      return res.json({ sucesso: true, dados: perfil });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao carregar perfil';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  atualizar: async (req: Request, res: Response) => {
    try {
      const perfil = await ProfileService.atualizarDados(req.usuario!.id, req.body);
      return res.json({ sucesso: true, dados: perfil });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao atualizar perfil';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  atualizarFoto: async (req: Request, res: Response) => {
    try {
      const { fotoPerfil } = req.body as { fotoPerfil?: string };

      if (!fotoPerfil || typeof fotoPerfil !== 'string' || !fotoPerfil.trim()) {
        return res.status(400).json({ sucesso: false, erro: 'Envie uma imagem em base64 ou uma URL válida' });
      }

      // Validação básica: deve ser URL ou base64
      const ehUrl = fotoPerfil.startsWith('http://') || fotoPerfil.startsWith('https://');
      const ehBase64 = fotoPerfil.startsWith('data:image/');

      if (!ehUrl && !ehBase64) {
        return res.status(400).json({ sucesso: false, erro: 'Formato inválido. Use uma URL ou imagem base64.' });
      }

      const perfil = await ProfileService.atualizarFoto(req.usuario!.id, fotoPerfil.trim());
      return res.json({ sucesso: true, dados: perfil });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao atualizar foto';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  trocarSenha: async (req: Request, res: Response) => {
    try {
      const { senhaAtual, novaSenha, confirmarSenha } = req.body;
      await ProfileService.trocarSenha(req.usuario!.id, senhaAtual, novaSenha, confirmarSenha);
      return res.json({ sucesso: true, dados: { mensagem: 'Senha atualizada com sucesso' } });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao trocar senha';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  avaliacoes: async (req: Request, res: Response) => {
    try {
      const avaliacoes = await ProfileService.listarAvaliacoes(req.usuario!.id);
      return res.json({ sucesso: true, dados: avaliacoes });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao listar avaliacoes';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },

  comentarios: async (req: Request, res: Response) => {
    try {
      const comentarios = await ProfileService.listarComentarios(req.usuario!.id);
      return res.json({ sucesso: true, dados: comentarios });
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao listar comentarios';
      return res.status(400).json({ sucesso: false, erro: mensagem });
    }
  },
};
