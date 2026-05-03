import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { VideoRepository } from '../repositories/video.repository.js';
import { CategoriaRepository } from '../repositories/categoria.repository.js';
import { prisma } from '../lib/prisma.js';

export const AdminService = {
  listarUsuarios: UsuarioRepository.listar,
  dashboard: async () => {
    const [estatisticas, usuarios, categorias, recentes, categoriasResumo] = await Promise.all([
      VideoRepository.contarEstatisticas(),
      UsuarioRepository.listar(),
      CategoriaRepository.listar(),
      prisma.video.findMany({
        take: 5,
        orderBy: { criadoEm: 'desc' },
        include: { categoria: true, visualizacoes: true },
      }),
      prisma.categoria.findMany({
        orderBy: { nome: 'asc' },
        include: {
          _count: {
            select: { videos: true },
          },
        },
      }),
    ]);

    return {
      totalUsuarios: usuarios.length,
      totalCategorias: categorias.length,
      ...estatisticas,
      recentes,
      categorias: categoriasResumo.map((categoria) => ({
        id: categoria.id,
        nome: categoria.nome,
        descricao: categoria.descricao,
        slug: categoria.slug,
        totalVideos: categoria._count.videos,
      })),
    };
  },
};
