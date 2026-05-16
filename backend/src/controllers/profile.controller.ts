import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { ProfileService } from '../services/profile.service.js';
import { env } from '../lib/env.js';

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
      const usuarioId = req.usuario!.id;

      // Monta URL da nova foto (upload de arquivo ou URL externa)
      const fotoUrl = req.file
        ? `/uploads/fotos/usuarios/${usuarioId}/${req.file.filename}`
        : req.body.fotoPerfil;

      if (!fotoUrl) {
        return res.status(400).json({ sucesso: false, erro: 'Envie uma imagem ou URL de foto' });
      }

      // Busca e deleta foto antiga do disco (somente se for arquivo local)
      const perfilAtual = await ProfileService.obter(usuarioId);
      if (perfilAtual.fotoPerfil && perfilAtual.fotoPerfil.startsWith('/uploads/fotos/')) {
        const caminhoAntigo = path.resolve(
          process.cwd(),
          env.UPLOAD_DIRECTORY,
          perfilAtual.fotoPerfil.replace('/uploads/', '')
        );
        await fs.unlink(caminhoAntigo).catch(() => {
          // Ignora erro caso arquivo já tenha sido removido
        });
      }

      const perfil = await ProfileService.atualizarFoto(usuarioId, fotoUrl);
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
