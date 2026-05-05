import bcrypt from 'bcryptjs';
import { UsuarioRepository } from '../repositories/usuario.repository.js';

export const UsuarioService = {
  listar: UsuarioRepository.listar,

  criar: async (dados: { nome: string; email: string; senha: string; perfil: string; fotoPerfil?: string | null; ativo?: boolean; podeComentar?: boolean }) => {
    const usuarioExistente = await UsuarioRepository.buscarPorEmail(dados.email);
    if (usuarioExistente) {
      throw new Error('E-mail já cadastrado');
    }

    const senhaHash = await bcrypt.hash(dados.senha, 12);

    return UsuarioRepository.criar({
      nome: dados.nome,
      email: dados.email,
      senha: senhaHash,
      perfil: dados.perfil,
      fotoPerfil: dados.fotoPerfil,
      ativo: dados.ativo,
      podeComentar: dados.podeComentar,
    });
  },

  atualizar: async (id: number, dados: Partial<{ nome: string; email: string; senha?: string; perfil: string; ativo: boolean; podeComentar: boolean; fotoPerfil: string | null }>) => {
    const updates: any = { ...dados };
    if (dados.senha) {
      updates.senha = await bcrypt.hash(dados.senha, 12);
    }
    return UsuarioRepository.atualizar(id, updates);
  },

  ativar: async (id: number) => {
    return UsuarioRepository.atualizar(id, { ativo: true });
  },

  desativar: async (id: number) => {
    return UsuarioRepository.atualizar(id, { ativo: false });
  },

  bloquearComentarios: async (id: number) => {
    return UsuarioRepository.atualizar(id, { podeComentar: false });
  },

  desbloquearComentarios: async (id: number) => {
    return UsuarioRepository.atualizar(id, { podeComentar: true });
  },

  deletar: UsuarioRepository.deletar,
};

