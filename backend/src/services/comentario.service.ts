import { ComentarioRepository } from '../repositories/comentario.repository.js';
import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { VideoRepository } from '../repositories/video.repository.js';

export const ComentarioService = {
  listarPorVideo: async (videoId: number) => {
    return ComentarioRepository.listarPorVideo(videoId);
  },

  listarTodos: async () => {
    return ComentarioRepository.listarTodos();
  },

  criar: async (dados: { texto: string; videoId: number; usuarioId: number; parentId?: number | null }) => {
    const usuario = await UsuarioRepository.buscarPorId(dados.usuarioId);
    if (!usuario) {
      throw new Error('Usuario nao encontrado');
    }

    if (!usuario.podeComentar) {
      throw new Error('Voce esta bloqueado para fazer comentarios nesta plataforma');
    }

    if (!dados.texto || dados.texto.trim().length === 0) {
      throw new Error('O texto do comentario nao pode estar vazio');
    }

    const video = await VideoRepository.buscarPorId(dados.videoId);
    if (!video) {
      throw new Error('Video nao encontrado');
    }

    if (dados.parentId) {
      const comentarioPai = await ComentarioRepository.buscarPorId(dados.parentId);
      if (!comentarioPai || comentarioPai.videoId !== dados.videoId) {
        throw new Error('Comentario original nao encontrado para este video');
      }

      if (comentarioPai.parentId) {
        throw new Error('Respostas em cadeia nao sao permitidas');
      }

      if (video.uploaderId !== dados.usuarioId) {
        throw new Error('Apenas o autor do video pode responder comentarios');
      }
    }

    return ComentarioRepository.criar({
      texto: dados.texto.trim(),
      videoId: dados.videoId,
      usuarioId: dados.usuarioId,
      parentId: dados.parentId ?? null,
    });
  },

  atualizar: async (id: number, texto: string, usuarioId: number, perfil: string) => {
    const comentario = await ComentarioRepository.buscarPorId(id);
    if (!comentario) {
      throw new Error('Comentario nao encontrado');
    }

    if (!texto || texto.trim().length === 0) {
      throw new Error('O texto do comentario nao pode estar vazio');
    }

    if (perfil !== 'ADMIN' && comentario.usuarioId !== usuarioId) {
      throw new Error('Voce nao tem permissao para editar este comentario');
    }

    return ComentarioRepository.atualizar(id, texto.trim());
  },

  deletar: async (id: number, usuarioId: number, perfil: string) => {
    const comentario = await ComentarioRepository.buscarPorId(id);
    if (!comentario) {
      throw new Error('Comentario nao encontrado');
    }

    if (perfil !== 'ADMIN' && comentario.usuarioId !== usuarioId) {
      throw new Error('Voce nao tem permissao para excluir este comentario');
    }

    return ComentarioRepository.deletar(id);
  },
};
