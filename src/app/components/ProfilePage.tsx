import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, Loader2, Mail, MessageSquare, Save, Shield, Star, User } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { VideoCard } from './VideoCard';
import { api, tratarErroApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ProfilePageProps {
  onBack: () => void;
  onVideoClick?: (videoId: number) => void;
}

type Aba = 'dados' | 'favoritos' | 'avaliados' | 'comentados';

interface ApiVideo {
  id: number;
  titulo: string;
  autor?: string;
  tipo?: string;
  urlOriginal?: string | null;
  miniatura?: string | null;
  categoria?: { id?: number; nome?: string };
  visualizacoes?: unknown[] | number;
}

interface ItemComVideo {
  id: number;
  nota?: number;
  texto?: string;
  criadoEm: string;
  video: ApiVideo;
}

const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:4000';
const fallbackThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600';

function extrairYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/').filter(Boolean)[1] ?? null;
    if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/').filter(Boolean)[1] ?? null;
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

function normalizarVideo(video: ApiVideo) {
  const youtubeId = extrairYoutubeId(video.urlOriginal);
  const visualizacoes = Array.isArray(video.visualizacoes)
    ? video.visualizacoes.length
    : Number(video.visualizacoes ?? 0);

  return {
    id: video.id,
    titulo: video.titulo,
    categoria: video.categoria?.nome ?? 'Outros',
    autor: video.autor ?? 'Autor desconhecido',
    visualizacoes,
    tipo: video.tipo === 'YOUTUBE' ? 'youtube' : 'internal',
    thumbnail: video.miniatura
      ? video.miniatura.startsWith('/') ? `${BASE_URL}${video.miniatura}` : video.miniatura
      : youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : fallbackThumbnail,
  };
}

export function ProfilePage({ onBack, onVideoClick }: ProfilePageProps) {
  const { usuario, atualizarUsuario } = useAuth();
  const [aba, setAba] = useState<Aba>('dados');
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [fotoPerfil, setFotoPerfil] = useState(usuario?.fotoPerfil ?? '');
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [favoritos, setFavoritos] = useState<ApiVideo[]>([]);
  const [avaliados, setAvaliados] = useState<ItemComVideo[]>([]);
  const [comentados, setComentados] = useState<ItemComVideo[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [loadingListas, setLoadingListas] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarListas() {
      try {
        setLoadingListas(true);
        const [favoritosResp, avaliadosResp, comentadosResp] = await Promise.all([
          api.videos.listarFavoritos(),
          api.profile.listarAvaliacoes(),
          api.profile.listarComentarios(),
        ]);

        if (!ativo) return;
        setFavoritos((favoritosResp.dados as ApiVideo[] | undefined) ?? []);
        setAvaliados((avaliadosResp.dados as ItemComVideo[] | undefined) ?? []);
        setComentados((comentadosResp.dados as ItemComVideo[] | undefined) ?? []);
      } catch (err) {
        if (ativo) setErro(tratarErroApi(err));
      } finally {
        if (ativo) setLoadingListas(false);
      }
    }

    carregarListas();
    return () => {
      ativo = false;
    };
  }, []);

  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    try {
      setSalvando(true);
      setMensagem('');
      setErro('');

      // Salva nome e demais dados pessoais
      await api.profile.atualizar({ nome });

      let novaFotoPerfil: string | undefined;
      if (arquivoFoto) {
        const formData = new FormData();
        formData.append('foto', arquivoFoto);
        const resp = await api.profile.atualizarFoto(formData);
        const perfilAtualizado = resp.dados as { fotoPerfil?: string };
        novaFotoPerfil = perfilAtualizado?.fotoPerfil;
      } else if (fotoPerfil.trim()) {
        const resp = await api.profile.atualizarFoto({ fotoPerfil: fotoPerfil.trim() });
        const perfilAtualizado = resp.dados as { fotoPerfil?: string };
        novaFotoPerfil = perfilAtualizado?.fotoPerfil;
      }

      // Atualiza o contexto de autenticação para refletir imediatamente no Header
      atualizarUsuario({
        nome,
        ...(novaFotoPerfil !== undefined ? { fotoPerfil: novaFotoPerfil } : {}),
      });
      if (novaFotoPerfil) setFotoPerfil(novaFotoPerfil);
      setArquivoFoto(null);
      setMensagem('Perfil atualizado com sucesso!');
    } catch (err) {
      setErro(tratarErroApi(err));
    } finally {
      setSalvando(false);
    }
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      setMensagem('');
      setErro('');
      await api.profile.trocarSenha({ senhaAtual, novaSenha, confirmarSenha });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setMensagem('Senha atualizada com sucesso.');
    } catch (err) {
      setErro(tratarErroApi(err));
    } finally {
      setSalvando(false);
    }
  };

  if (!usuario) return null;

  const fotoCompleta = arquivoFoto 
    ? URL.createObjectURL(arquivoFoto)
    : fotoPerfil
      ? fotoPerfil.startsWith('/') ? `${BASE_URL}${fotoPerfil}` : fotoPerfil
      : '';

  function ListaVideos({ videos }: { videos: ApiVideo[] }) {
    if (loadingListas) {
      return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
    }
    if (videos.length === 0) {
      return <div className="p-6 text-sm text-muted-foreground">Nenhum vídeo encontrado nesta lista.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
    );
  }

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

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full overflow-hidden flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {fotoCompleta ? <img src={fotoCompleta} alt={usuario.nome} className="w-full h-full object-cover" /> : usuario.nome[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
              <p className="text-muted-foreground">Dados, favoritos, avaliações e comentários</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'dados' as Aba, label: 'Dados', icon: User },
            { id: 'favoritos' as Aba, label: 'Favoritos', icon: Heart },
            { id: 'avaliados' as Aba, label: 'Avaliados', icon: Star },
            { id: 'comentados' as Aba, label: 'Comentados', icon: MessageSquare },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Button key={item.id} variant={aba === item.id ? 'default' : 'outline'} onClick={() => setAba(item.id)}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {(mensagem || erro) && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${erro ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {erro || mensagem}
          </div>
        )}

        {aba === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleSalvarDados} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">Dados Pessoais</h2>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                Nome
              </label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />

              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                E-mail
              </label>
              <Input value={usuario.email} disabled />

              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                Foto de Perfil (Arquivo ou URL)
              </label>
              <div className="flex flex-col gap-2">
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArquivoFoto(e.target.files[0]);
                      setFotoPerfil('');
                    }
                  }} 
                />
                <div className="text-center text-sm text-muted-foreground">ou</div>
                <Input 
                  value={fotoPerfil} 
                  onChange={(e) => {
                    setFotoPerfil(e.target.value);
                    if (e.target.value) setArquivoFoto(null);
                  }} 
                  placeholder="URL da foto (https://...)" 
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="w-4 h-4 text-muted-foreground" />
                Perfil de acesso
              </label>
              <div className="px-4 py-3 rounded-lg border border-border bg-muted/30 text-muted-foreground font-medium">
                {usuario.perfil}
              </div>

              <Button type="submit" disabled={salvando}>
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar alterações
              </Button>
            </form>

            <form onSubmit={handleTrocarSenha} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-lg">Trocar Senha</h2>
              <Input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="Senha atual" required />
              <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Nova senha" required />
              <Input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Confirmar nova senha" required />
              <Button type="submit" disabled={salvando}>
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Atualizar senha
              </Button>
            </form>
          </div>
        )}

        {aba === 'favoritos' && <ListaVideos videos={favoritos} />}
        {aba === 'avaliados' && <ListaVideos videos={avaliados.map((item) => item.video)} />}
        {aba === 'comentados' && <ListaVideos videos={comentados.map((item) => item.video)} />}
      </main>
    </div>
  );
}
