import bcrypt from 'bcryptjs';
import { UsuarioRepository } from '../repositories/usuario.repository.js';

export const UsuarioService = {
  listar: UsuarioRepository.listar,

  criar: async (dados: { nome: string; email: string; senha: string; perfil: string }) => {
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
    });
  },

  atualizar: async (id: number, dados: Partial<{ nome: string; email: string; senha?: string; perfil: string; ativo: boolean }>) => {
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

  deletar: UsuarioRepository.deletar,
};

