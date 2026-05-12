import path from 'path';
import { env } from '../lib/env.js';
import { VideoRepository } from '../repositories/video.repository.js';
import { CategoriaRepository } from '../repositories/categoria.repository.js';
import { ProcessamentoService } from './processamento.service.js';
import { NotificationService } from './notification.service.js';
import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { cache } from '../utils/cache.js';

export const VideoService = {
  listar: VideoRepository.listar,
  buscarPorId: VideoRepository.buscarPorId,
  registrarVisualizacao: async (id: number, usuarioId?: number, tempoAssistido: number = 0) => {
    const video = await VideoRepository.buscarPorId(id);
    if (!video) {
      throw new Error('Video nao encontrado');
    }

    const visualizacao = await VideoRepository.registrarVisualizacao(id, usuarioId, tempoAssistido);
    cache.clear();
    return visualizacao;
  },

  criar: async (dados: {
    titulo: string;
    descricao: string;
    autor: string;
    tipo: string;
    categoriaId: number;
    urlOriginal?: string;
    caminhoArquivo?: string;
    miniatura?: string;
    posicaoMarcaDagua?: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER';
    uploaderId: number;
  }) => {
    const categoria = await CategoriaRepository.buscarPorId(dados.categoriaId);
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }

    const status = dados.tipo === 'INTERNO' ? 'PROCESSANDO' : 'PENDENTE';
    const caminhoArquivo = dados.caminhoArquivo;

    const video = await VideoRepository.criar({
      ...dados,
      status,
      caminhoArquivo,
    });

    if (dados.tipo === 'INTERNO' && caminhoArquivo) {
      const filename = path.basename(caminhoArquivo);
      const physicalPath = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY, 'videos', filename);
      await ProcessamentoService.processarVideoInterno(video.id, physicalPath, dados.posicaoMarcaDagua);
      return VideoRepository.buscarPorId(video.id);
    }

    return video;
  },

  atualizar: VideoRepository.atualizar,

  listarFavoritosPorUsuario: async (usuarioId: number) => {
    const favoritos = await VideoRepository.listarFavoritosPorUsuario(usuarioId);
    return favoritos.map((item) => item.video);
  },

  favoritar: async (id: number, usuarioId: number) => {
    const video = await VideoRepository.buscarPorId(id);
    if (!video) {
      throw new Error('Vídeo não encontrado');
    }
    await VideoRepository.favoritar(id, usuarioId);
    cache.clear();
  },

  desfavoritar: async (id: number, usuarioId: number) => {
    await VideoRepository.desfavoritar(id, usuarioId);
    cache.clear();
  },

  verificarFavorito: async (id: number, usuarioId: number) => {
    const favorito = await VideoRepository.verificarFavorito(id, usuarioId);
    return Boolean(favorito);
  },

  denunciar: async (id: number, usuarioId: number) => {
    const video = await VideoRepository.buscarPorId(id);
    if (!video) {
      throw new Error('Vídeo não encontrado');
    }

    const admins = await UsuarioRepository.listarAdminsAtivos();
    await Promise.all(
      admins.map((admin) =>
        NotificationService.criar({
          usuarioId: admin.id,
          titulo: 'Nova denúncia de vídeo',
          mensagem: `O vídeo "${video.titulo}" foi denunciado e precisa de revisão. [video:${video.id}]`,
        })
      )
    );
  },
  
  deletar: async (id: number) => {
    const video = await VideoRepository.buscarPorId(id);
    if (!video) throw new Error('Vídeo não encontrado');

    await VideoRepository.deletar(id);

    try {
      if (video.caminhoArquivo) {
        const filename = path.basename(video.caminhoArquivo);
        const filePath = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY, 'videos', filename);
        await import('fs/promises').then(fs => fs.unlink(filePath).catch(() => {}));
      }
      if (video.miniatura && !video.miniatura.startsWith('http')) {
        const filename = path.basename(video.miniatura);
        const filePath = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY, 'thumbnails', filename);
        await import('fs/promises').then(fs => fs.unlink(filePath).catch(() => {}));
      }
    } catch (err) {
      console.error('Erro ao deletar arquivo fisico:', err);
    }
  },

  importarYoutube: async (id: number, posicaoMarcaDagua?: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER', qualidade?: string) => {
    const video = await VideoRepository.buscarPorId(id);
    if (!video) {
      throw new Error('Vídeo não encontrado');
    }
    if (video.tipo !== 'YOUTUBE' || !video.urlOriginal) {
      throw new Error('Apenas vídeos do YouTube podem ser importados');
    }

    return ProcessamentoService.importarYoutube(id, video.urlOriginal, posicaoMarcaDagua, qualidade);
  },
};
