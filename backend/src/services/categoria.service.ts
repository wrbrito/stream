import { CategoriaRepository } from '../repositories/categoria.repository.js';

import { prisma } from '../lib/prisma.js';

export const CategoriaService = {
  listar: CategoriaRepository.listar,
  buscarPorId: CategoriaRepository.buscarPorId,
  criar: CategoriaRepository.criar,
  atualizar: CategoriaRepository.atualizar,
  deletar: async (id: number) => {
    // Verifica se existem vídeos nesta categoria
    const videos = await prisma.video.count({ where: { categoriaId: id } });
    if (videos > 0) {
      // Busca a categoria "Outros", cria se não existir
      let categoriaOutros = await prisma.categoria.findUnique({ where: { slug: 'outros' } });
      if (!categoriaOutros) {
        categoriaOutros = await prisma.categoria.create({
          data: { nome: 'Outros', slug: 'outros', descricao: 'Categoria padrão' }
        });
      }
      
      // Move os vídeos para a categoria "Outros"
      if (categoriaOutros.id !== id) {
        await prisma.video.updateMany({
          where: { categoriaId: id },
          data: { categoriaId: categoriaOutros.id }
        });
      }
    }
    
    // Agora exclui com segurança
    return CategoriaRepository.deletar(id);
  },
};
