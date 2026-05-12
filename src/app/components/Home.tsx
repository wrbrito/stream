import { useEffect, useState, useRef } from 'react';
import { Search, User, Bell, Video, Upload, Check } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { Button } from './Button';
import { api } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';

interface HomeProps {
  onVideoClick: (videoId: number) => void;
  onUploadClick: () => void;
  onAdminClick: () => void;
  onNotificationsClick: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  showCategories?: boolean;
  featuredCount?: number;
  showRecommended?: boolean;
  recommendedCount?: number;
  showTrending?: boolean;
  trendingCount?: number;
}

const categories = [
  { id: 1, name: 'Aulas', icon: '📚', color: 'bg-blue-100 text-blue-700' },
  { id: 2, name: 'Eventos', icon: '🎉', color: 'bg-purple-100 text-purple-700' },
  { id: 3, name: 'Avisos', icon: '📢', color: 'bg-yellow-100 text-yellow-700' },
  { id: 4, name: 'Projetos', icon: '🚀', color: 'bg-green-100 text-green-700' },
  { id: 5, name: 'Formações', icon: '🎓', color: 'bg-indigo-100 text-indigo-700' },
  { id: 6, name: 'Outros', icon: '📁', color: 'bg-gray-100 text-gray-700' },
];

interface Video {
  id: number;
  titulo: string;
  categoria: {
    id?: number;
    nome: string;
  };
  autor: string;
  visualizacoes: number;
  tipo: 'internal' | 'youtube';
  thumbnail: string;
}

interface ApiVideo {
  id: number;
  titulo: string;
  autor?: string;
  tipo?: string;
  urlOriginal?: string | null;
  miniatura?: string | null;
  categoria?: {
    id?: number;
    nome?: string;
  };
  visualizacoes?: unknown[] | number;
  viewsCount?: number;
}

interface VideosListPayload {
  videos: ApiVideo[];
  total: number;
}

const fallbackThumbnail =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600';

const metaEnv = (import.meta as any).env as { VITE_API_URL?: string } | undefined;
const BASE_URL = metaEnv?.VITE_API_URL
  ? metaEnv.VITE_API_URL.replace('/api', '')
  : 'http://localhost:4000';

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

function normalizarVideo(video: ApiVideo): Video {
  const visualizacoes = Array.isArray(video.visualizacoes)
    ? video.visualizacoes.length
    : Number(video.visualizacoes ?? video.viewsCount ?? 0);
  const youtubeId = extrairYoutubeId(video.urlOriginal);

  return {
    id: video.id,
    titulo: video.titulo,
    categoria: {
      id: video.categoria?.id,
      nome: video.categoria?.nome ?? 'Outros',
    },
    autor: video.autor ?? 'Autor desconhecido',
    visualizacoes,
    tipo: video.tipo === 'YOUTUBE' ? 'youtube' : 'internal',
    thumbnail: (() => {
      if (video.miniatura) {
        // Se for URL local (/uploads/...), prefixar com BASE_URL do backend
        if (video.miniatura.startsWith('/')) return `${BASE_URL}${video.miniatura}`;
        return video.miniatura; // já é URL externa (http://...)
      }
      if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      return fallbackThumbnail;
    })(),
  };
}

export function Home({ onVideoClick, onUploadClick, onAdminClick, onNotificationsClick, searchQuery, onSearchQueryChange, showCategories, featuredCount = 4, showRecommended = true, recommendedCount = 10, showTrending = true, trendingCount = 10 }: HomeProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [destaques, setDestaques] = useState<Video[]>([]);
  const [recomendados, setRecomendados] = useState<Video[]>([]);
  const [emAlta, setEmAlta] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<{
    id: number;
    titulo: string;
    mensagem: string;
    criadoEm: string;
  } | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [limite] = useState(12);
  const debounceTimer = useRef<number | null>(null);
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { usuario } = useAuth();

  const temFiltro = Boolean(searchQuery.trim() || selectedCategoryId);
  const shouldShowDestaques = !temFiltro && pagina === 1;

  // Função reutilizável para buscar vídeos
  const fetchVideos = async (isInitial: boolean) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      setError('');

      const response = await api.videos.listar(
        pagina,
        limite,
        searchQuery.trim() || undefined,
        selectedCategoryId ?? undefined
      );
      const dados = response.dados as VideosListPayload | ApiVideo[] | undefined;
      const listaApi = Array.isArray(dados) ? dados : dados?.videos ?? [];
      const total = Array.isArray(dados) ? listaApi.length : dados?.total ?? listaApi.length;
      
      const videosApi = listaApi.map(normalizarVideo);
      setTotalVideos(total);
      setTotalPaginas(Math.ceil(total / limite));

      // Buscar trilhos de recomendação apenas quando não houver busca/categoria ativa.
      if (shouldShowDestaques) {
        const [respDestaques, respTrending, respRecommended] = await Promise.allSettled([
          api.videos.listar(1, featuredCount, undefined, undefined, 'populares'),
          showTrending ? api.recommendations.trending(1, trendingCount) : Promise.resolve(null),
          (usuario && showRecommended) ? api.recommendations.recommended(1, recommendedCount) : Promise.resolve(null),
        ]);

        if (respDestaques.status === 'fulfilled') {
          const dadosDestaques = respDestaques.value.dados as VideosListPayload | ApiVideo[] | undefined;
          const listaDestaques = Array.isArray(dadosDestaques) ? dadosDestaques : dadosDestaques?.videos ?? [];
          setDestaques(listaDestaques.map(normalizarVideo));
        }

        if (respTrending.status === 'fulfilled' && respTrending.value) {
          const dadosTrending = respTrending.value.dados as VideosListPayload | undefined;
          setEmAlta((dadosTrending?.videos ?? []).map(normalizarVideo));
        } else {
          setEmAlta([]);
        }

        if (respRecommended.status === 'fulfilled' && respRecommended.value) {
          const dadosRecommended = respRecommended.value.dados as VideosListPayload | undefined;
          setRecomendados((dadosRecommended?.videos ?? []).map(normalizarVideo));
        } else {
          setRecomendados([]);
        }
      } else {
        setDestaques([]);
        setRecomendados([]);
        setEmAlta([]);
      }

      setVideos(videosApi);
    } catch (err) {
      console.error('Erro ao carregar vídeos:', err);
      setError('Não foi possível carregar vídeos. Tente novamente mais tarde.');
      setVideos([]);
    } finally {
      setLoading(false);
      setSearching(false);
      setInitialLoad(false);
    }
  };

  // Carregamento INICIAL — sem debounce, executa imediatamente
  useEffect(() => {
    fetchVideos(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Carregamento por busca/filtros/paginação — com debounce
  useEffect(() => {
    if (initialLoad) return; // Já coberto pelo efeito acima
    
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = window.setTimeout(() => fetchVideos(false), 300);

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, selectedCategoryId, pagina, usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resetar página ao filtrar
  useEffect(() => {
    setPagina(1);
  }, [searchQuery, selectedCategoryId]);

  const filteredVideos = videos;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando vídeos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {showCategories !== false && (
          <section className="mb-8">
            <h2 className="mb-4">Categorias</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() =>
                    setSelectedCategoryId(
                      selectedCategoryId === category.id ? null : category.id
                    )
                  }
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedCategoryId === category.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <div className="font-medium text-sm text-foreground">
                    {category.name}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {selectedCategoryId && (
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategoryId(null)}
            >
              ✕ Limpar filtro
            </Button>
          </div>
        )}

        {temFiltro ? (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2>Resultados</h2>
              <button
                className="text-primary hover:underline text-sm"
                onClick={() => {
                  onSearchQueryChange('');
                  setSelectedCategoryId(null);
                }}
              >
                Ver todos
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  title={video.titulo}
                  category={video.categoria.nome}
                  author={video.autor}
                  views={video.visualizacoes}
                  type={video.tipo}
                  thumbnail={video.thumbnail}
                  onClick={() => onVideoClick(video.id)}
                />
              ))}
            </div>
          </section>
        ) : (
          <>
            {showRecommended && recomendados.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2>Vídeos recomendados</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recomendados.map((video) => (
                    <VideoCard
                      key={`recomendado-${video.id}`}
                      title={video.titulo}
                      category={video.categoria.nome}
                      author={video.autor}
                      views={video.visualizacoes}
                      type={video.tipo}
                      thumbnail={video.thumbnail}
                      onClick={() => onVideoClick(video.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {showTrending && emAlta.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2>Em alta</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {emAlta.map((video) => (
                    <button
                      key={`em-alta-${video.id}`}
                      onClick={() => onVideoClick(video.id)}
                      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary hover:shadow-md transition-all"
                    >
                      <div className="w-20 h-14 rounded-xl overflow-hidden bg-muted">
                        <img src={video.thumbnail} alt={video.titulo} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-foreground line-clamp-2">{video.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-1">{video.visualizacoes} visualizações</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2>Vídeos em Destaque</h2>
                <button
                  className="text-primary hover:underline text-sm"
                  onClick={() => {
                    onSearchQueryChange('');
                    setSelectedCategoryId(null);
                  }}
                >
                  Ver todos
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {destaques.slice(0, featuredCount).map((video) => (
                  <button
                    key={`destaque-${video.id}`}
                    onClick={() => onVideoClick(video.id)}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-muted">
                      <img src={video.thumbnail} alt={video.titulo} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground line-clamp-2">{video.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">{video.autor}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2>Vídeos Recentes</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    title={video.titulo}
                    category={video.categoria.nome}
                    author={video.autor}
                    views={video.visualizacoes}
                    type={video.tipo}
                    thumbnail={video.thumbnail}
                    onClick={() => onVideoClick(video.id)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

{error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg mb-2 text-destructive">{error}</h3>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        ) : filteredVideos.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg mb-2">Nenhum vídeo encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar sua busca ou filtros
            </p>
          </div>
        )}

        {selectedNotification && (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedNotification.titulo}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedNotification.criadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNotification(null)}>
                  Fechar
                </Button>
              </div>
              <div className="mt-4 text-sm text-foreground whitespace-pre-wrap">
                {selectedNotification.mensagem}
              </div>
            </div>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12 pb-8">
            <Button
              variant="outline"
              disabled={pagina === 1}
              onClick={() => {
                setPagina(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Anterior
            </Button>
            <span className="text-sm font-medium">
              Página {pagina} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              disabled={pagina >= totalPaginas}
              onClick={() => {
                setPagina(p => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Próxima
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
