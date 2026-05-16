import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { UsuarioRepository } from '../repositories/usuario.repository.js';

export const ProfileService = {
  obter: async (usuarioId: number) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        podeComentar: true,
        fotoPerfil: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      throw new Error('Usuario nao encontrado');
    }

    return usuario;
  },

  atualizarDados: async (usuarioId: number, dados: { nome?: string; fotoPerfil?: string | null }) => {
    const updates: Record<string, unknown> = {};
    if (dados.nome !== undefined) updates.nome = dados.nome;
    if (dados.fotoPerfil !== undefined) updates.fotoPerfil = dados.fotoPerfil;

    return prisma.usuario.update({
      where: { id: usuarioId },
      data: updates,
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        podeComentar: true,
        fotoPerfil: true,
        criadoEm: true,
      },
    });
  },

  atualizarFoto: async (usuarioId: number, fotoPerfil: string) => {
    return prisma.usuario.update({
      where: { id: usuarioId },
      data: { fotoPerfil },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        podeComentar: true,
        fotoPerfil: true,
        criadoEm: true,
      },
    });
  },

  trocarSenha: async (usuarioId: number, senhaAtual: string, novaSenha: string, confirmarSenha: string) => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      throw new Error('Informe a senha atual, a nova senha e a confirmacao');
    }

    if (novaSenha !== confirmarSenha) {
      throw new Error('A confirmacao da senha nao confere');
    }

    if (novaSenha.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres');
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new Error('Usuario nao encontrado');
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaCorreta) {
      throw new Error('Senha atual incorreta');
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);
    await UsuarioRepository.atualizar(usuarioId, { senha: senhaHash });
  },

  listarAvaliacoes: async (usuarioId: number) => {
    return prisma.avaliacao.findMany({
      where: { usuarioId },
      include: {
        video: {
          include: { categoria: true, visualizacoes: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  },

  listarComentarios: async (usuarioId: number) => {
    return prisma.comentario.findMany({
      where: { usuarioId },
      include: {
        video: {
          include: { categoria: true, visualizacoes: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  },
};
