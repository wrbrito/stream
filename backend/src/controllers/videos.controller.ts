import { Request, Response } from 'express';
import { VideoService } from '../services/video.service.js';
import { YoutubeService } from '../services/youtube.service.js';
import { env } from '../lib/env.js';

export const VideosController = {
  listar: async (req: Request, res: Response) => {
    try {
      const { busca, categoriaId, pagina, limite, ordenarPor } = req.query;
      
      const resultado = await VideoService.listar({
        busca: busca as string | undefined,
        categoriaId: categoriaId ? Number(categoriaId) : undefined,
        pagina: pagina ? Number(pagina) : 1,
        limite: limite ? Number(limite) : 10,
        ordenarPor: ordenarPor as 'recentes' | 'populares' | undefined,
      });
      
      return res.json({ sucesso: true, dados: resultado });
    } catch (erro) {
      console.error('Erro ao listar vídeos:', erro);
      return res.status(500).json({ 
        sucesso: false, 
        erro: 'Erro ao listar vídeos' 
      });
    }
  },

  buscarPorId: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const video = await VideoService.buscarPorId(id);
    if (!video) {
      return res.status(404).json({ sucesso: false, erro: 'Vídeo não encontrado' });
    }
    return res.json({ sucesso: true, dados: video });
  },

  registrarVisualizacao: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const tempoAssistido = Number((req.body as { tempoAssistido?: unknown } | undefined)?.tempoAssistido ?? 0);
    await VideoService.registrarVisualizacao(id, req.usuario?.id, Number.isFinite(tempoAssistido) ? Math.max(0, Math.floor(tempoAssistido)) : 0);
    return res.status(201).json({ sucesso: true, dados: { mensagem: 'Visualizacao registrada' } });
  },

  listarFavoritos: async (req: Request, res: Response) => {
    if (!req.usuario?.id) {
      return res.status(401).json({ sucesso: false, erro: 'Usuário não autenticado' });
    }
    const favoritos = await VideoService.listarFavoritosPorUsuario(req.usuario.id);
    return res.json({ sucesso: true, dados: favoritos });
  },

  favoritar: async (req: Request, res: Response) => {
    if (!req.usuario?.id) {
      return res.status(401).json({ sucesso: false, erro: 'Usuário não autenticado' });
    }
    await VideoService.favoritar(Number(req.params.id), req.usuario.id);
    return res.status(201).json({ sucesso: true, dados: { mensagem: 'Vídeo favoritado' } });
  },

  desfavoritar: async (req: Request, res: Response) => {
    if (!req.usuario?.id) {
      return res.status(401).json({ sucesso: false, erro: 'Usuário não autenticado' });
    }
    await VideoService.desfavoritar(Number(req.params.id), req.usuario.id);
    return res.json({ sucesso: true, dados: { mensagem: 'Vídeo removido dos favoritos' } });
  },

  verificarFavorito: async (req: Request, res: Response) => {
    if (!req.usuario?.id) {
      return res.status(401).json({ sucesso: false, erro: 'Usuário não autenticado' });
    }
    const favorito = await VideoService.verificarFavorito(Number(req.params.id), req.usuario.id);
    return res.json({ sucesso: true, dados: { favorito } });
  },

  denunciar: async (req: Request, res: Response) => {
    if (!req.usuario?.id) {
      return res.status(401).json({ sucesso: false, erro: 'Usuário não autenticado' });
    }
    await VideoService.denunciar(Number(req.params.id), req.usuario.id);
    return res.status(201).json({ sucesso: true, dados: { mensagem: 'Denúncia recebida com sucesso' } });
  },

  criar: async (req: Request, res: Response) => {
    const { titulo, descricao, autor, tipo, categoriaId, urlOriginal, posicaoMarcaDagua } = req.body;
    const arquivo = req.files && (req.files as any).arquivo ? (req.files as any).arquivo[0] : undefined;
    const miniatura = req.files && (req.files as any).miniatura ? (req.files as any).miniatura[0] : undefined;

    const caminhoArquivo = arquivo ? `/uploads/videos/${arquivo.filename}` : undefined;
    const caminhoMiniatura = miniatura ? `/uploads/thumbnails/${miniatura.filename}` : undefined;

    const video = await VideoService.criar({
      titulo,
      descricao,
      autor,
      tipo,
      categoriaId: Number(categoriaId),
      urlOriginal,
      caminhoArquivo,
      miniatura: caminhoMiniatura,
      posicaoMarcaDagua,
      uploaderId: req.usuario?.id ?? 0,
    });

    return res.status(201).json({ sucesso: true, dados: video });
  },

  atualizar: async (req: Request, res: Response) => {
    const miniatura = req.files && (req.files as any).miniatura ? (req.files as any).miniatura[0] : undefined;
    const caminhoMiniatura = miniatura ? `/uploads/thumbnails/${miniatura.filename}` : undefined;

    const dadosAtualizacao = {
      ...req.body,
      ...(caminhoMiniatura && { miniatura: caminhoMiniatura }),
    };

    const video = await VideoService.atualizar(Number(req.params.id), dadosAtualizacao);
    return res.json({ sucesso: true, dados: video });
  },

  deletar: async (req: Request, res: Response) => {
    await VideoService.deletar(Number(req.params.id));
    return res.status(204).send();
  },

  importar: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const body = (req.body ?? {}) as {
      posicaoMarcaDagua?: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER';
      qualidade?: string;
    };
    try {
      const video = await VideoService.buscarPorId(id);
      if (!video || video.tipo !== 'YOUTUBE' || !video.urlOriginal) {
        return res.status(400).json({ sucesso: false, erro: 'Apenas vídeos do YouTube com URL válida podem ser importados.' });
      }

      VideoService.importarYoutube(id, body.posicaoMarcaDagua, body.qualidade || 'maxima').catch((erro) => {
        console.error('Erro assíncrono ao importar vídeo do YouTube:', erro);
      });
      return res.json({ sucesso: true, dados: { mensagem: 'Importação iniciada. O vídeo será processado em breve.' } });
    } catch (erro) {
      console.error('Erro ao iniciar importação do vídeo do YouTube:', erro);
      return res.status(500).json({ sucesso: false, erro: 'Erro ao iniciar a importação do vídeo do YouTube.' });
    }
  },

  obterProcessamento: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const video = await VideoService.buscarPorId(id);
    if (!video) {
      return res.status(404).json({ sucesso: false, erro: 'Vídeo não encontrado' });
    }
    
    // Supondo que o VideoService.buscarPorId já traga o processamento se houver relação.
    // Caso contrário, precisaríamos de um ProcessamentoService.buscarPorVideoId.
    // Vamos verificar como o VideoRepository.buscarPorId está implementado.
    return res.json({ sucesso: true, dados: video.processamento || null });
  },

  download: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const video = await VideoService.buscarPorId(id);
    if (!video || !video.caminhoArquivo || video.tipo !== 'INTERNO') {
      return res.status(404).json({ sucesso: false, erro: 'Arquivo não encontrado ou não disponível para download' });
    }

    const fs = await import('fs');
    const path = await import('path');
    const caminhoCompleto = path.join(process.cwd(), env.UPLOAD_DIRECTORY, 'videos', path.basename(video.caminhoArquivo));
    
    if (!fs.existsSync(caminhoCompleto)) {
      return res.status(404).json({ sucesso: false, erro: 'Arquivo não encontrado no servidor' });
    }

    return res.download(caminhoCompleto, `${video.titulo}.mp4`, (err) => {
      if (err) {
        console.error('Erro download:', err);
      }
    });
  },

  buscarMetadadosYoutube: async (req: Request, res: Response) => {
    const { url } = req.body as { url?: string };

    if (!url) {
      return res.status(400).json({ sucesso: false, erro: 'URL do YouTube é obrigatória' });
    }

    try {
      const videoId = YoutubeService.extrairIdVideo(url);
      if (!videoId) {
        return res.status(400).json({ sucesso: false, erro: 'URL do YouTube inválida' });
      }

      const metadados = await YoutubeService.buscarMetadados(videoId);
      return res.json({ sucesso: true, dados: metadados });
    } catch (erro) {
      console.error('Erro ao buscar metadados:', erro);
      return res.status(500).json({ sucesso: false, erro: 'Erro ao buscar informações do vídeo' });
    }
  },
};

