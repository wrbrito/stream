import { prisma } from '../lib/prisma.js';

export const VideoRepository = {
  listar: async (filtros: {
    busca?: string;
    categoriaId?: number;
    pagina?: number;
    limite?: number;
    ordenarPor?: 'recentes' | 'populares';
  }) => {
    const where: any = {};

    if (filtros.busca) {
      where.OR = [
        { titulo: { contains: filtros.busca } },
        { descricao: { contains: filtros.busca } },
        { autor: { contains: filtros.busca } },
      ];
    }

    if (filtros.categoriaId) {
      where.categoriaId = filtros.categoriaId;
    }

    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 10;
    const skip = (pagina - 1) * limite;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: { categoria: true, visualizacoes: true },
        orderBy: filtros.ordenarPor === 'populares' 
          ? { visualizacoes: { _count: 'desc' } }
          : { criadoEm: 'desc' },
        skip,
        take: limite,
      }),
      prisma.video.count({ where }),
    ]);

    return { videos, total };
  },

  buscarPorId: async (id: number) => {
    return prisma.video.findUnique({
      where: { id },
      include: { categoria: true, uploader: true, visualizacoes: true, processamento: true },
    });
  },

  registrarVisualizacao: async (videoId: number, usuarioId?: number, tempoAssistido: number = 0) => {
    if (usuarioId) {
      const visualizacaoAtual = await prisma.visualizacao.findFirst({
        where: { videoId, usuarioId },
        orderBy: { data: 'desc' },
      });

      if (visualizacaoAtual) {
        return prisma.visualizacao.update({
          where: { id: visualizacaoAtual.id },
          data: {
            tempoAssistido: Math.max(visualizacaoAtual.tempoAssistido, tempoAssistido),
            data: new Date(),
          },
        });
      }
    }

    return prisma.visualizacao.create({
      data: {
        videoId,
        usuarioId,
        tempoAssistido,
      },
    });
  },

  listarFavoritosPorUsuario: async (usuarioId: number) => {
    return prisma.favorito.findMany({
      where: { usuarioId },
      include: {
        video: {
          include: {
            categoria: true,
            visualizacoes: true,
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  },

  favoritar: async (videoId: number, usuarioId: number) => {
    return prisma.favorito.upsert({
      where: {
        usuarioId_videoId: { usuarioId, videoId },
      },
      update: {},
      create: { usuarioId, videoId },
    });
  },

  desfavoritar: async (videoId: number, usuarioId: number) => {
    return prisma.favorito.deleteMany({
      where: { videoId, usuarioId },
    });
  },

  verificarFavorito: async (videoId: number, usuarioId: number) => {
    return prisma.favorito.findUnique({
      where: {
        usuarioId_videoId: { usuarioId, videoId },
      },
    });
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
    status?: string;
    uploaderId: number;
  }) => {
    return prisma.video.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        autor: dados.autor,
        tipo: dados.tipo as any,
        status: dados.status as any,
        categoriaId: dados.categoriaId,
        urlOriginal: dados.urlOriginal,
        caminhoArquivo: dados.caminhoArquivo,
        miniatura: dados.miniatura,
        uploaderId: dados.uploaderId,
      },
    });
  },

  atualizar: async (id: number, dados: Partial<Record<string, unknown>>) => {
    return prisma.video.update({ where: { id }, data: dados });
  },

  deletar: async (id: number) => {
    return prisma.$transaction([
      prisma.visualizacao.deleteMany({ where: { videoId: id } }),
      prisma.favorito.deleteMany({ where: { videoId: id } }),
      prisma.avaliacao.deleteMany({ where: { videoId: id } }),
      prisma.processamento.deleteMany({ where: { videoId: id } }),
      prisma.comentario.deleteMany({ where: { videoId: id, parentId: { not: null } } }),
      prisma.comentario.deleteMany({ where: { videoId: id } }),
      prisma.video.delete({ where: { id } }),
    ]);
  },

  contarEstatisticas: async () => {
    const [total, internos, externos, pendentes, visualizacoes] = await Promise.all([
      prisma.video.count(),
      prisma.video.count({ where: { tipo: 'INTERNO' } }),
      prisma.video.count({ where: { tipo: 'YOUTUBE' } }),
      prisma.video.count({ where: { status: 'PENDENTE' } }),
      prisma.visualizacao.count(),
    ]);

    return { total, internos, externos, pendentes, visualizacoes };
  },
};
