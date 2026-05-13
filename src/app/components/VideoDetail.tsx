import { useEffect, useMemo, useRef, useState } from 'react';

import { ArrowLeft, Calendar, Eye, Flag, Heart, Share2, Video as VideoIcon, Star, MessageSquare, Trash2, Send } from 'lucide-react';
import { Button } from './Button';
import { api, tratarErroApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface VideoDetailProps {
  onBack: () => void;
  videoId: number;
  onVideoClick?: (videoId: number) => void;
  relatedCount?: number;
}

interface ApiVideo {
  id: number;
  titulo: string;
  descricao: string;
  autor: string;
  tipo: 'INTERNO' | 'YOUTUBE' | string;
  status: string;
  urlOriginal?: string | null;
  caminhoArquivo?: string | null;
  miniatura?: string | null;
  criadoEm: string;
  categoria?: {
    id?: number;
    nome?: string;
  };
  visualizacoes?: unknown[] | number;
  uploaderId?: number;
  uploader?: {
    id: number;
  };
}

interface Comentario {
  id: number;
  texto: string;
  usuarioId: number;
  criadoEm: string;
  usuario: {
    id: number;
    nome: string;
    perfil: string;
    fotoPerfil?: string | null;
  };
  respostas?: Comentario[];
}

function extrairYoutubeId(url?: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    }
    if (parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.split('/').filter(Boolean)[1] ?? null;
    }
    if (parsed.pathname.startsWith('/embed/')) {
      return parsed.pathname.split('/').filter(Boolean)[1] ?? null;
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(data));
}

function contarVisualizacoes(valor: ApiVideo['visualizacoes']) {
  return Array.isArray(valor) ? valor.length : Number(valor ?? 0);
}

function obterThumbnailUrl(video: ApiVideo): string | null {
  if (video.miniatura) {
    const path = video.miniatura;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    if (path.startsWith('/')) {
      return `${BASE_URL}${path}`;
    }
    return `${BASE_URL}/uploads/thumbnails/${path}`;
  }

  if (video.tipo === 'YOUTUBE' && video.urlOriginal) {
    const youtubeId = extrairYoutubeId(video.urlOriginal);
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
  }

  return null;
}

// Construir URL base dinamicamente baseada no host atual
const getBaseUrl = (): string => {
  // Se houver variável de ambiente definida, usar ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }

  // Caso contrário, usar o host/porta do navegador
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = 4000; // Porta padrão do backend

  return `${protocol}//${hostname}:${port}`;
};

const BASE_URL = getBaseUrl();

export function VideoDetail({ onBack, videoId, onVideoClick, relatedCount = 4 }: VideoDetailProps) {
  const { usuario } = useAuth();
  const [video, setVideo] = useState<ApiVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorito, setIsFavorito] = useState(false);
  const [favoritoLoading, setFavoritoLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [globalConfigs, setGlobalConfigs] = useState<Record<string, string>>({});
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<ApiVideo[]>([]);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [respostaTexto, setRespostaTexto] = useState<Record<number, string>>({});
  const [respondendoId, setRespondendoId] = useState<number | null>(null);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [statsAvaliacao, setStatsAvaliacao] = useState({ media: 0, total: 0, minhaNota: null as number | null });
  const [avaliando, setAvaliando] = useState(false);
  const visualizacoesRegistradas = useRef(new Set<number>());
  const ultimoTempoRegistrado = useRef(0);

  useEffect(() => {
    let ativo = true;
    ultimoTempoRegistrado.current = 0;

    async function carregarVideo() {
      try {
        setLoading(true);
        setError('');

        const response = await api.videos.obterPorId(videoId);
        const dados = response.dados as ApiVideo;
        if (!dados) {
          throw new Error('Video nao encontrado');
        }

        if (ativo) {
          setVideo(dados);
          setFormTitulo(dados.titulo);
          setFormDescricao(dados.descricao);
        }

        // Só verificar favorito se usuário estiver logado
        if (usuario) {
          const favoritoResponse = await api.videos.verificarFavorito(videoId);
          if (ativo) {
            setIsFavorito(Boolean((favoritoResponse.dados as { favorito?: boolean } | undefined)?.favorito));
          }
        }

        if (!visualizacoesRegistradas.current.has(videoId)) {
          visualizacoesRegistradas.current.add(videoId);
          await api.videos.registrarVisualizacao(videoId).catch(() => null);
          if (ativo) {
            setVideo((atual) => {
              if (!atual) {
                return atual;
              }

              const totalAtual = contarVisualizacoes(atual.visualizacoes);
              return { ...atual, visualizacoes: totalAtual + 1 };
            });
          }
        }

        const configResponse = await api.configuracoes.publicas().catch(() => null);
        if (ativo && configResponse?.sucesso && configResponse.dados) {
          setGlobalConfigs(configResponse.dados as Record<string, string>);
        }

        // Carregar comentários, avaliações e relacionados em paralelo, mas não falhar o vídeo se algum destes endpoints falhar.
        const maxRelated = relatedCount ?? 4;
        const [comentariosResp, avaliacoesResp, relatedResp] = await Promise.allSettled([
          api.comentarios.listar(videoId),
          api.avaliacoes.obter(videoId),
          api.recommendations.related(videoId, 1, maxRelated),
        ]);

        if (ativo) {
          if (comentariosResp.status === 'fulfilled') {
            setComentarios((comentariosResp.value.dados as Comentario[]) || []);
          }
          if (avaliacoesResp.status === 'fulfilled') {
            setStatsAvaliacao((avaliacoesResp.value.dados as any) || { media: 0, total: 0, minhaNota: null });
          }
          if (relatedResp.status === 'fulfilled') {
            const relatedDados = relatedResp.value.dados as { videos: ApiVideo[]; total?: number } | { videos: ApiVideo[] } | any;
            const relatedLista = relatedDados?.videos ?? [];
            setRelatedVideos(relatedLista.filter((item: ApiVideo) => item.id !== videoId));
          }
        }
      } catch (erro) {
        if (ativo) {
          setError(tratarErroApi(erro));
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarVideo();

    return () => {
      ativo = false;
    };
  }, [videoId, relatedCount, usuario]);

  const youtubeId = useMemo(() => extrairYoutubeId(video?.urlOriginal), [video?.urlOriginal]);
  const videoSrc =
    video?.tipo === 'YOUTUBE' && youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&origin=${window.location.origin}`
      : video?.caminhoArquivo
        ? `${BASE_URL}${video.caminhoArquivo}`
        : null;

  const registrarTempoAssistido = (tempoAssistido: number) => {
    const tempoNormalizado = Math.floor(Math.max(0, tempoAssistido));
    if (tempoNormalizado < 5 || tempoNormalizado <= ultimoTempoRegistrado.current + 4) {
      return;
    }

    ultimoTempoRegistrado.current = tempoNormalizado;
    api.videos.registrarVisualizacao(videoId, tempoNormalizado).catch(() => null);
  };

  const handleFavoritar = async () => {
    if (!usuario) {
      alert('Você precisa fazer login para favoritar vídeos.');
      return;
    }
    try {
      setFavoritoLoading(true);
      if (isFavorito) {
        await api.videos.desfavoritar(videoId);
        setIsFavorito(false);
        alert('Vídeo removido dos favoritos.');
        return;
      }
      await api.videos.favoritar(videoId);
      setIsFavorito(true);
      alert('Vídeo adicionado aos favoritos.');
    } catch (erro) {
      alert(tratarErroApi(erro));
    } finally {
      setFavoritoLoading(false);
    }
  };

  const showYouTubeFallback = (container: HTMLElement, youtubeUrl: string) => {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center text-white bg-black">
        <p class="mb-4 text-center px-4">
          Este vídeo do YouTube não pode ser reproduzido diretamente.<br/>
          Clique no botão abaixo para assistir no YouTube.
        </p>
        <a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer"
           class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
          🎥 Assistir no YouTube
        </a>
      </div>
    `;
  };

  const handleDenunciar = async () => {
    if (!usuario) {
      alert('Você precisa fazer login para denunciar vídeos.');
      return;
    }
    try {
      await api.videos.denunciar(videoId);
      alert('Obrigado. Sua denúncia foi enviada para a equipe administrativa.');
    } catch (erro) {
      alert(tratarErroApi(erro));
    }
  };

  const handleCompartilhar = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.titulo,
          text: 'Confira este vídeo na plataforma escolar',
          url: shareUrl,
        });
      } catch {
        // Usuário cancelou
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copiado para a área de transferência.');
    } catch {
      alert('Não foi possível compartilhar este vídeo no momento.');
    }
  };

  const handleSalvarEdicao = async () => {
    if (!video) return;
    try {
      setSalvandoEdicao(true);
      await api.videos.atualizar(video.id, {
        titulo: formTitulo.trim(),
        descricao: formDescricao.trim(),
      });
      setVideo((atual) =>
        atual
          ? {
              ...atual,
              titulo: formTitulo.trim(),
              descricao: formDescricao.trim(),
            }
          : atual
      );
      setEditando(false);
      alert('Vídeo atualizado com sucesso.');
    } catch (erro) {
      alert(tratarErroApi(erro));
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleExcluirVideo = async () => {
    if (!video) return;
    const confirmar = window.confirm('Deseja realmente excluir este vídeo?');
    if (!confirmar) return;
    try {
      setDeletando(true);
      await api.videos.deletar(video.id);
      alert('Vídeo excluído com sucesso.');
      onBack();
    } catch (erro) {
      alert(tratarErroApi(erro));
    } finally {
      setDeletando(false);
    }
  };

  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) {
      alert('Você precisa fazer login para comentar.');
      return;
    }
    if (!comentarioTexto.trim()) return;

    try {
      setEnviandoComentario(true);
      const response = await api.comentarios.criar(videoId, comentarioTexto.trim());
      setComentarios((prev) => [response.dados, ...prev]);
      setComentarioTexto('');
    } catch (erro) {
      alert(tratarErroApi(erro));
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleEnviarResposta = async (comentarioId: number) => {
    const texto = respostaTexto[comentarioId]?.trim();
    if (!texto) return;

    try {
      const response = await api.comentarios.criar(videoId, texto, comentarioId);
      const resposta = response.dados as Comentario;
      setComentarios((prev) =>
        prev.map((comentario) =>
          comentario.id === comentarioId
            ? { ...comentario, respostas: [...(comentario.respostas ?? []), resposta] }
            : comentario
        )
      );
      setRespostaTexto((prev) => ({ ...prev, [comentarioId]: '' }));
      setRespondendoId(null);
    } catch (erro) {
      alert(tratarErroApi(erro));
    }
  };

  const handleEditarComentario = async (id: number, textoAtual: string) => {
    const texto = window.prompt('Editar comentario', textoAtual);
    if (!texto || !texto.trim()) return;

    try {
      const response = await api.comentarios.atualizar(id, texto.trim());
      const atualizado = response.dados as Comentario;
      setComentarios((prev) =>
        prev.map((comentario) => {
          if (comentario.id === id) return { ...comentario, texto: atualizado.texto };
          return {
            ...comentario,
            respostas: comentario.respostas?.map((resposta) =>
              resposta.id === id ? { ...resposta, texto: atualizado.texto } : resposta
            ),
          };
        })
      );
    } catch (erro) {
      alert(tratarErroApi(erro));
    }
  };

  const handleExcluirComentario = async (id: number) => {
    if (!window.confirm('Deseja excluir este comentário?')) return;
    try {
      await api.comentarios.deletar(id);
      setComentarios((prev) =>
        prev
          .filter((c) => c.id !== id)
          .map((c) => ({ ...c, respostas: c.respostas?.filter((resposta) => resposta.id !== id) }))
      );
    } catch (erro) {
      alert(tratarErroApi(erro));
    }
  };

  const handleAvaliar = async (nota: number) => {
    if (!usuario) {
      alert('Você precisa fazer login para avaliar vídeos.');
      return;
    }
    try {
      setAvaliando(true);
      const response = await api.avaliacoes.avaliar(videoId, nota);
      setStatsAvaliacao(response.dados as any);
    } catch (erro) {
      alert(tratarErroApi(erro));
    } finally {
      setAvaliando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <VideoIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Video nao encontrado</h1>
          <p className="text-muted-foreground">{error || 'Nao foi possivel carregar este video.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl overflow-hidden border border-border shadow-lg mb-6">
              <div className="relative aspect-video bg-black">
                {video.tipo === 'YOUTUBE' && videoSrc ? (
                  <div className="w-full h-full">
                    <iframe
                      src={videoSrc}
                      title={video.titulo}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={(e) => {
                        // Verificar se o iframe carregou corretamente
                        try {
                          const iframe = e.currentTarget;
                          // Se o conteúdo do iframe for muito pequeno, provavelmente foi bloqueado
                          if (iframe.contentWindow && iframe.contentDocument) {
                            const contentHeight = iframe.contentDocument.body?.scrollHeight || 0;
                            if (contentHeight < 100) {
                              console.warn('YouTube embed parece ter sido bloqueado, mostrando fallback');
                              showYouTubeFallback(iframe.parentElement!, video.urlOriginal!);
                            }
                          }
                        } catch (error) {
                          console.warn('Erro ao verificar iframe do YouTube:', error);
                          showYouTubeFallback(e.currentTarget.parentElement!, video.urlOriginal!);
                        }
                      }}
                      onError={(e) => {
                        console.error('Erro ao carregar iframe do YouTube:', e);
                        showYouTubeFallback(e.currentTarget.parentElement!, video.urlOriginal!);
                      }}
                    />
                  </div>
                ) : videoSrc ? (
                  <video
                    src={videoSrc}
                    className="w-full h-full"
                    controls
                    poster={obterThumbnailUrl(video) || undefined}
                    onPause={(event) => registrarTempoAssistido(event.currentTarget.currentTime)}
                    onEnded={(event) => registrarTempoAssistido(event.currentTarget.currentTime)}
                  />
                ) : video?.tipo === 'YOUTUBE' && video?.urlOriginal ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white bg-black">
                    <p className="mb-4 text-center px-4">
                      Este vídeo do YouTube não pode ser reproduzido diretamente.<br/>
                      Clique no botão abaixo para assistir no YouTube.
                    </p>
                    <a
                      href={video.urlOriginal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      🎥 Assistir no YouTube
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    Arquivo de video indisponivel
                  </div>
                )}
                {/* Marca d'água UI */}
                {(() => {
                  const pos = globalConfigs.WATERMARK_POSITION || globalConfigs.MARCA_DAGUA_POSICAO || 'BOTTOM_LEFT';
                  const text = (globalConfigs.WATERMARK_TEXT?.trim() || globalConfigs.MARCA_DAGUA_TEXTO?.trim() || '').toUpperCase();
                  if (!text) {
                    return null;
                  }

                  let positionClasses = 'bottom-4 left-4';
                  if (pos === 'TOP_LEFT') positionClasses = 'top-4 left-4';
                  if (pos === 'TOP_RIGHT') positionClasses = 'top-4 right-4';
                  if (pos === 'BOTTOM_RIGHT') positionClasses = 'bottom-4 right-4';
                  if (pos === 'CENTER') positionClasses = 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

                  return (
                    <div className={`absolute ${positionClasses} pointer-events-none select-none z-10 opacity-60`}>
                      <span className="bg-black/50 text-white px-2 py-1 rounded text-xs font-bold tracking-wider border border-white/20 whitespace-nowrap">
                        {text}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-foreground mb-2">{video.titulo}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{contarVisualizacoes(video.visualizacoes)} visualizacoes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatarData(video.criadoEm)}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        video.tipo === 'YOUTUBE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {video.tipo === 'YOUTUBE' ? 'YouTube' : 'Interno'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border flex-wrap">
                <Button variant="outline" size="sm" onClick={handleFavoritar} disabled={favoritoLoading || !usuario} title={!usuario ? 'Faça login para favoritar' : ''}>
                  <Heart className="w-4 h-4" />
                  {isFavorito ? 'Desfavoritar' : 'Favoritar'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCompartilhar}>
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDenunciar} disabled={!usuario} title={!usuario ? 'Faça login para denunciar' : ''}>
                  <Flag className="w-4 h-4" />
                  Denunciar
                </Button>
                {usuario?.perfil === 'ADMIN' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditando((valor) => !valor)}>
                      {editando ? 'Cancelar edição' : 'Editar vídeo'}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={handleExcluirVideo} disabled={deletando}>
                      {deletando ? 'Excluindo...' : 'Excluir vídeo'}
                    </Button>
                  </>
                )}
              </div>

              {editando && (
                <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
                  <label className="block text-sm font-medium mb-2">Título</label>
                  <input
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-input-background mb-3"
                  />
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-md border border-border bg-input-background mb-3"
                  />
                  <Button onClick={handleSalvarEdicao} disabled={salvandoEdicao}>
                    {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {video.autor
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{video.autor}</h3>
                    <p className="text-sm text-muted-foreground">Autor do video</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Descricao</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{video.descricao}</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="inline-block px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm">
                  {video.categoria?.nome ?? 'Outros'}
                </span>
                
                <div className="flex items-center gap-1 text-sm">
                  <Star className={`w-4 h-4 ${statsAvaliacao.media > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  <span className="font-semibold">{statsAvaliacao.media.toFixed(1)}</span>
                  <span className="text-muted-foreground">({statsAvaliacao.total})</span>
                </div>
              </div>

              {/* Avaliação */}
              <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-border">
                <h3 className="text-sm font-semibold mb-3">O que você achou deste vídeo?</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={avaliando || !usuario}
                      onClick={() => handleAvaliar(star)}
                      className={`p-1 transition-transform hover:scale-110 ${avaliando || !usuario ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={!usuario ? 'Faça login para avaliar' : ''}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (statsAvaliacao.minhaNota || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                  {statsAvaliacao.minhaNota && (
                    <span className="text-xs text-muted-foreground ml-2">Sua nota: {statsAvaliacao.minhaNota}</span>
                  )}
                </div>
              </div>

              {/* Comentários */}
              <div className="mt-12">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comentários ({comentarios.length})
                </h3>

                <form onSubmit={handleEnviarComentario} className="mb-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                      {usuario ? usuario.nome[0] : '?'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={comentarioTexto}
                        onChange={(e) => setComentarioTexto(e.target.value)}
                        placeholder={usuario ? "Escreva um comentário..." : "Faça login para comentar"}
                        disabled={!usuario}
                        className="w-full bg-input-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="mt-2 flex justify-end">
                        <Button type="submit" size="sm" disabled={enviandoComentario || !comentarioTexto.trim() || !usuario}>
                          <Send className="w-4 h-4" />
                          {enviandoComentario ? 'Enviando...' : 'Comentar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="space-y-6">
                  {comentarios.map((comentario) => (
                    <div key={comentario.id} className="flex gap-4 group">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold shrink-0">
                        {comentario.usuario.nome[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{comentario.usuario.nome}</span>
                            {comentario.usuario.perfil === 'ADMIN' && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Admin
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(comentario.criadoEm).toLocaleDateString()}
                            </span>
                          </div>
                          {(usuario?.perfil === 'ADMIN' || usuario?.id === comentario.usuarioId) && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditarComentario(comentario.id, comentario.texto)}
                                className="text-xs text-muted-foreground hover:text-primary"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleExcluirComentario(comentario.id)}
                                className="text-muted-foreground hover:text-destructive"
                                title="Excluir comentário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {comentario.texto}
                        </p>
                        {usuario?.id === (video.uploaderId ?? video.uploader?.id) && (
                          <div className="mt-2">
                            <button
                              onClick={() => setRespondendoId(respondendoId === comentario.id ? null : comentario.id)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Responder
                            </button>
                          </div>
                        )}
                        {respondendoId === comentario.id && (
                          <div className="mt-3 flex gap-2">
                            <input
                              value={respostaTexto[comentario.id] ?? ''}
                              onChange={(e) => setRespostaTexto((prev) => ({ ...prev, [comentario.id]: e.target.value }))}
                              className="flex-1 px-3 py-2 rounded-md border border-border bg-input-background text-sm"
                              placeholder="Resposta do autor"
                            />
                            <Button size="sm" onClick={() => handleEnviarResposta(comentario.id)}>
                              Enviar
                            </Button>
                          </div>
                        )}
                        {(comentario.respostas ?? []).length > 0 && (
                          <div className="mt-4 space-y-3 border-l border-border pl-4">
                            {(comentario.respostas ?? []).map((resposta) => (
                              <div key={resposta.id} className="group/resposta">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{resposta.usuario.nome}</span>
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                      Autor
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(resposta.criadoEm).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {(usuario?.perfil === 'ADMIN' || usuario?.id === resposta.usuarioId) && (
                                    <div className="flex items-center gap-2 opacity-0 group-hover/resposta:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleEditarComentario(resposta.id, resposta.texto)}
                                        className="text-xs text-muted-foreground hover:text-primary"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => handleExcluirComentario(resposta.id)}
                                        className="text-muted-foreground hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-wrap">{resposta.texto}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {comentarios.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                      Seja o primeiro a comentar!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm sticky top-24 space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-3">Vídeos Relacionados</h3>
                {relatedVideos.length > 0 ? (
                  <div className="space-y-3">
                    {relatedVideos.map((relatedVideo) => {
                      // Extrair apenas o nome do arquivo se for um caminho completo
                      const miniaturaPath = relatedVideo.miniatura?.includes('/') 
                        ? relatedVideo.miniatura.split('/').pop() 
                        : relatedVideo.miniatura;
                      
                      const relatedId = Number(relatedVideo.id);
                      if (!Number.isFinite(relatedId)) return null;


                      return (
                      <div
                        key={relatedId}
                        className="group cursor-pointer border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                        onClick={() => onVideoClick(relatedId)}
                      >
                        <div className="aspect-video bg-muted relative">
                          {(() => {
                            const thumbnailUrl = obterThumbnailUrl(relatedVideo);
                            return thumbnailUrl ? (
                              <img
                                src={thumbnailUrl}
                                alt={relatedVideo.titulo}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <VideoIcon className="w-8 h-8 text-muted-foreground" />
                              </div>
                            );
                          })()}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                            {relatedVideo.titulo}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {relatedVideo.autor}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {contarVisualizacoes(relatedVideo.visualizacoes)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum vídeo relacionado encontrado.
                  </p>
                )}
              </div>
              {usuario?.perfil === 'ADMIN' && (
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium text-foreground mb-2 text-sm">Link Direto</h4>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">Compartilhe este link com qualquer pessoa:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={window.location.href}
                        readOnly
                        className="flex-1 text-xs px-2 py-1 rounded border border-border bg-input-background"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copiado!');
                        }}
                        className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded font-medium hover:bg-primary/90"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
