/**
 * Serviço para extrair informações do YouTube
 */

export const YoutubeService = {
  /**
   * Extrai o ID do vídeo a partir de uma URL do YouTube
   */
  extrairIdVideo: (url: string): string | null => {
    const padroes = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const padrao of padroes) {
      const match = url.match(padrao);
      if (match) return match[1] ?? null;
    }
    return null;
  },

  /**
   * Busca metadados do vídeo do YouTube usando a API YouTube Data v3
   * NOTA: Requer YOUTUBE_API_KEY nas variáveis de ambiente
   */
  buscarMetadados: async (videoId: string) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn('YOUTUBE_API_KEY não configurada. Retornando dados simulados.');
      return {
        titulo: `Vídeo do YouTube`,
        descricao: 'Descrição não disponível',
        miniatura: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('id', videoId);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('part', 'snippet');

      const resposta = await fetch(url.toString());
      if (!resposta.ok) {
        throw new Error(`Erro ao buscar vídeo: ${resposta.statusText}`);
      }

      const dados = (await resposta.json()) as {
        items?: Array<{
          snippet?: {
            title?: string;
            description?: string;
            thumbnails?: {
              high?: { url?: string };
              default?: { url?: string };
            };
          };
        }>;
      };

      const video = dados.items?.[0];
      const snippet = video?.snippet;

      if (!snippet) {
        throw new Error('Vídeo não encontrado no YouTube');
      }

      return {
        titulo: snippet.title || 'Sem título',
        descricao: snippet.description || 'Sem descrição',
        miniatura: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    } catch (erro) {
      console.error('Erro ao buscar metadados do YouTube:', erro);
      // Retorna dados padrão se houver erro
      return {
        titulo: 'Vídeo do YouTube',
        descricao: 'Descrição não disponível',
        miniatura: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
  },
};
