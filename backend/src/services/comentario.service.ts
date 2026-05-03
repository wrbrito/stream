import { ComentarioRepository } from '../repositories/comentario.repository.js';
import { UsuarioRepository } from '../repositories/usuario.repository.js';

export const ComentarioService = {
  listarPorVideo: async (videoId: number) => {
    return ComentarioRepository.listarPorVideo(videoId);
  },

  criar: async (dados: { texto: string; videoId: number; usuarioId: number }) => {
    const usuario = await UsuarioRepository.buscarPorId(dados.usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    if (!usuario.podeComentar) {
      throw new Error('Você está bloqueado para fazer comentários nesta plataforma');
    }

    if (!dados.texto || dados.texto.trim().length === 0) {
      throw new Error('O texto do comentário não pode estar vazio');
    }

    return ComentarioRepository.criar(dados);
  },

  deletar: async (id: number, usuarioId: number, perfil: string) => {
    const comentario = await ComentarioRepository.buscarPorId(id);
    if (!comentario) {
      throw new Error('Comentário não encontrado');
    }

    // Apenas o dono do comentário ou um ADMIN pode deletar
    if (perfil !== 'ADMIN' && comentario.usuarioId !== usuarioId) {
      throw new Error('Você não tem permissão para excluir este comentário');
    }

    return ComentarioRepository.deletar(id);
  },
};
