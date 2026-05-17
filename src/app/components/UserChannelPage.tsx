import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, Heart, MessageSquare, Star, Users } from 'lucide-react';
import { Button } from './Button';
import { VideoCard } from './VideoCard';
import { api, tratarErroApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface UserChannelPageProps {
  usuarioId: number;
  onBack: () => void;
  onVideoClick?: (videoId: number) => void;
}

interface CanalInfo {
  id: number;
  nome: string;
  fotoPerfil?: string;
  descricaoCanal?: string;
  canalPublico: boolean;
  criadoEm: string;
  _count: {
    videos: number;
  };
}

interface CanalEstatisticas {
  totalVideos: number;
  totalVisualizacoes: number;
  totalComentarios: number;
  notaMedia: number;
  totalAvaliacoes: number;
}

interface ApiVideo {
  id: number;
  titulo: string;
  descricao: string;
  miniatura?: string;
  criadoEm: string;
  categoria: { id: number; nome: string };
  uploader: { id: number; nome: string };
  _count: { visualizacoes: number };
}

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:4000';
const fallbackThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600';

export function UserChannelPage({ usuarioId, onBack, onVideoClick }: UserChannelPageProps) {
  const { usuario } = useAuth();
  const [canal, setCanal] = useState<CanalInfo | null>(null);
  const [estatisticas, setEstatisticas] = useState<CanalEstatisticas | null>(null);
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const isCanaldoProprio = usuario?.id === usuarioId;

  useEffect(() => {
    carregarDados();
  }, [usuarioId]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro('');

      const [canalRes, statsRes, videosRes] = await Promise.all([
        api.canais.obter(usuarioId),
        api.canais.obterEstatisticas(usuarioId),
        api.canais.listarVideos(usuarioId, pagina, 12),
      ]);

      setCanal(canalRes.dados);
      setEstatisticas(statsRes.dados);
      if (videosRes.dados) {
        setVideos(videosRes.dados.videos);
        setTotalPaginas(videosRes.dados.totalPaginas);
      }
    } catch (err) {
      setErro(tratarErroApi(err));
    } finally {
      setCarregando(false);
    }
  };

  const irParaPagina = (novaPagina: number) => {
    setPagina(novaPagina);
  };

  useEffect(() => {
    if (pagina !== 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      carregarVideos();
    }
  }, [pagina]);

  const carregarVideos = async () => {
    try {
      setCarregando(true);
      const res = await api.canais.listarVideos(usuarioId, pagina, 12);
      if (res.dados) {
        setVideos(res.dados.videos);
        setTotalPaginas(res.dados.totalPaginas);
      }
    } catch (err) {
      setErro(tratarErroApi(err));
    } finally {
      setCarregando(false);
    }
  };

  const normalizarVideo = (video: ApiVideo) => ({
    id: video.id,
    titulo: video.titulo,
    categoria: video.categoria?.nome || 'Sem categoria',
    autor: video.uploader?.nome || 'Desconhecido',
    visualizacoes: video._count?.visualizacoes || 0,
    tipo: 'INTERNO',
    thumbnail: video.miniatura ? `${BASE_URL}${video.miniatura}` : fallbackThumbnail,
  });

  if (carregando && !canal) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando canal...</p>
        </div>
      </div>
    );
  }

  if (erro && !canal) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{erro}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!canal) {
    return null;
  }

  return (
    <div className="w-full bg-background">
      {/* Cabeçalho */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {canal.fotoPerfil ? (
                <img src={canal.fotoPerfil} alt={canal.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-foreground">{canal.nome[0].toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{canal.nome}</h1>
              <p className="text-muted-foreground mt-1">
                {!canal.canalPublico && <span className="text-orange-600 font-semibold">🔒 Canal Privado</span>}
                {canal.canalPublico && <span className="text-green-600 font-semibold">🌐 Canal Público</span>}
              </p>

              {canal.descricaoCanal && (
                <p className="text-foreground mt-3 max-w-2xl">{canal.descricaoCanal}</p>
              )}

              {/* Estatísticas */}
              {estatisticas && (
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{estatisticas.totalVideos}</span>
                    <span className="text-muted-foreground">vídeos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{estatisticas.totalVisualizacoes.toLocaleString()}</span>
                    <span className="text-muted-foreground">visualizações</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{estatisticas.totalComentarios}</span>
                    <span className="text-muted-foreground">comentários</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{estatisticas.notaMedia.toFixed(1)}</span>
                    <span className="text-muted-foreground">média</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Vídeos do Canal</h2>

        {erro && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700 text-sm">
            {erro}
          </div>
        )}

        {carregando && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">Carregando vídeos...</p>
          </div>
        )}

        {!carregando && videos.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhum vídeo disponível neste canal</p>
          </div>
        )}

        {!carregando && videos.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {videos.map((video) => {
                const item = normalizarVideo(video);
                return (
                  <VideoCard
                    key={item.id}
                    title={item.titulo}
                    category={item.categoria}
                    author={item.autor}
                    views={item.visualizacoes}
                    type={item.tipo}
                    thumbnail={item.thumbnail}
                    onClick={() => onVideoClick?.(item.id)}
                  />
                );
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  onClick={() => irParaPagina(pagina - 1)}
                  disabled={pagina === 1}
                  variant="outline"
                >
                  ← Anterior
                </Button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - pagina) <= 2 || p === 1 || p === totalPaginas)
                  .map((p, i, arr) => (
                    <div key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 py-2">...</span>}
                      <Button
                        onClick={() => irParaPagina(p)}
                        variant={p === pagina ? 'default' : 'outline'}
                      >
                        {p}
                      </Button>
                    </div>
                  ))}

                <Button
                  onClick={() => irParaPagina(pagina + 1)}
                  disabled={pagina === totalPaginas}
                  variant="outline"
                >
                  Próxima →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
