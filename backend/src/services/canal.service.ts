import { CanalRepository } from '../repositories/canal.repository.js';
import { prisma } from '../lib/prisma.js';

export const CanalService = {
  obterCanal: async (usuarioId: number) => {
    const canal = await CanalRepository.buscarPorId(usuarioId);

    if (!canal) {
      throw new Error('Canal não encontrado');
    }

    return canal;
  },

  listarVideosDoCanal: async (usuarioId: number, pagina: number = 1, limite: number = 12) => {
    // Verificar se o canal existe e está público
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { canalPublico: true, ativo: true },
    });

    if (!usuario || !usuario.ativo) {
      throw new Error('Canal não encontrado ou inativo');
    }

    if (!usuario.canalPublico) {
      throw new Error('Este canal é privado');
    }

    return CanalRepository.listarVideosDoCanal(usuarioId, pagina, limite);
  },

  obterEstatisticasCanal: async (usuarioId: number) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { canalPublico: true, ativo: true },
    });

    if (!usuario || !usuario.ativo) {
      throw new Error('Canal não encontrado ou inativo');
    }

    if (!usuario.canalPublico) {
      throw new Error('Este canal é privado');
    }

    return CanalRepository.listarEstatisticasCanal(usuarioId);
  },

  atualizarDescricaoCanal: async (usuarioId: number, descricao: string | null) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    if (descricao !== null && descricao.length > 500) {
      throw new Error('A descrição do canal não pode ter mais de 500 caracteres');
    }

    return CanalRepository.atualizarDescricaoCanal(usuarioId, descricao);
  },

  atualizarPrivacidadeCanal: async (usuarioId: number, canalPublico: boolean) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    return CanalRepository.atualizarPrivacidadeCanal(usuarioId, canalPublico);
  },

  obterCanalDoProprio: async (usuarioId: number) => {
    return CanalRepository.buscarPorId(usuarioId);
  },
};
