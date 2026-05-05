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
    : Number(video.visualizacoes ?? 0);
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

export function Home({ onVideoClick, onUploadClick, onAdminClick, onNotificationsClick, searchQuery, onSearchQueryChange }: HomeProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [destaques, setDestaques] = useState<Video[]>([]);
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

      // Buscar destaques (populares) separadamente
      if (!searchQuery && !selectedCategoryId && pagina === 1) {
        try {
          const respDestaques = await api.videos.listar(1, 6, undefined, undefined, 'populares');
          const dadosDestaques = respDestaques.dados as VideosListPayload | ApiVideo[] | undefined;
          const listaDestaques = Array.isArray(dadosDestaques) ? dadosDestaques : dadosDestaques?.videos ?? [];
          setDestaques(listaDestaques.map(normalizarVideo));
        } catch (err) {
          console.error('Erro ao buscar destaques:', err);
        }
      }

      localStorage.setItem('stream_videos_cache', JSON.stringify(videosApi));
      setVideos(videosApi);
    } catch (err) {
      console.error('API offline, usando cache/mock:', err);

      const cacheStr = localStorage.getItem('stream_videos_cache');
      if (cacheStr) {
        try {
          const videosCache = JSON.parse(cacheStr) as Video[];
          setVideos(videosCache);
        } catch {
          // Cache corrompido
        }
      } else {
        const mockVideos: Video[] = [
          {
            id: 1,
            titulo: 'Aula de Matemática - Funções Quadráticas',
            categoria: { nome: 'Aulas' },
            autor: 'Prof. João Silva',
            visualizacoes: 1250,
            tipo: 'internal',
            thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600',
          },
          {
            id: 2,
            titulo: 'Workshop React + TypeScript Avançado',
            categoria: { nome: 'Formações' },
            autor: 'Profª Maria Santos',
            visualizacoes: 890,
            tipo: 'youtube',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          },
          {
            id: 3,
            titulo: 'Reunião Pedagógica - Planejamento 2024',
            categoria: { nome: 'Eventos' },
            autor: 'Direção Escolar',
            visualizacoes: 340,
            tipo: 'internal',
            thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600',
          },
          {
            id: 4,
            titulo: 'Projeto Ciência - Experimento Químico',
            categoria: { nome: 'Projetos' },
            autor: 'Prof. Carlos Oliveira',
            visualizacoes: 670,
            tipo: 'internal',
            thumbnail: 'https://images.unsplash.com/photo-1544716240-2f0d42b0f947?w=600',
          },
          {
            id: 5,
            titulo: 'Aviso Importante - Calendário Escolar',
            categoria: { nome: 'Avisos' },
            autor: 'Secretaria',
            visualizacoes: 2100,
            tipo: 'internal',
            thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
          },
          {
            id: 6,
            titulo: 'Live Q&A - Dúvidas Matemática',
            categoria: { nome: 'Aulas' },
            autor: 'Prof. João Silva',
            visualizacoes: 450,
            tipo: 'youtube',
            thumbnail: 'https://img.youtube.com/vi/beKof55V8UY/hqdefault.jpg',
          },
        ];
        setVideos(mockVideos);
      }
      setError('Usando dados demo (backend offline)');
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
  }, [searchQuery, selectedCategoryId, pagina]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(destaques.length > 0 ? destaques : filteredVideos).slice(0, 3).map((video) => (
              <VideoCard
                key={`destaque-${video.id}`}
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
