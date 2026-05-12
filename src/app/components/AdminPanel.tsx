import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bell,
  Check,
  CheckCircle,
  Download,
  DownloadCloud,
  FolderTree,
  LayoutDashboard,
  Loader,
  Settings,
  Trash2,
  Users,
  Video,
  XCircle,
  MessageSquare,
  MessageSquareOff,
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { api, tratarErroApi } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';



interface AdminPanelProps {
  onBack: () => void;
  onUploadClick?: () => void;
  onNotificationsClick?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
}

type MenuId = 'dashboard' | 'videos' | 'users' | 'categories' | 'comments' | 'reports' | 'settings';

interface AdminVideo {
  id: number;
  titulo: string;
  autor: string;
  tipo: string;
  status: string;
  criadoEm: string;
  categoria?: { id?: number; nome?: string };
  visualizacoes?: unknown[] | number;
  descricao?: string;
  urlOriginal?: string | null;
  caminhoArquivo?: string | null;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  podeComentar?: boolean;
  fotoPerfil?: string | null;
  criadoEm: string;
}

interface AdminComentario {
  id: number;
  texto: string;
  criadoEm: string;
  usuarioId: number;
  parentId?: number | null;
  usuario?: { id: number; nome: string; email?: string };
  video?: { id: number; titulo: string };
  parent?: { id: number; texto: string } | null;
  _count?: { respostas: number };
}

interface Categoria {
  id: number;
  nome: string;
  descricao?: string | null;
  slug: string;
  totalVideos?: number;
}

interface Dashboard {
  total: number;
  internos: number;
  externos: number;
  pendentes: number;
  visualizacoes: number;
  totalUsuarios: number;
  totalCategorias: number;
  recentes: AdminVideo[];
  categorias: Categoria[];
}

const menuItems: { id: MenuId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Painel Inicial', icon: LayoutDashboard },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'categories', label: 'Categorias', icon: FolderTree },
  { id: 'comments', label: 'Comentarios', icon: MessageSquare },
  { id: 'reports', label: 'Relatorios', icon: BarChart3 },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  ATIVO: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  PROCESSANDO: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Loader },
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  ERRO: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: XCircle },
};

function contarVisualizacoes(valor: AdminVideo['visualizacoes']) {
  return Array.isArray(valor) ? valor.length : Number(valor ?? 0);
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
}

export function AdminPanel({ onBack, onUploadClick, onNotificationsClick, searchQuery, onSearchQueryChange }: AdminPanelProps) {
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [comentarios, setComentarios] = useState<AdminComentario[]>([]);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [totalItens, setTotalItens] = useState(0);
  const [importingVideoId, setImportingVideoId] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState<Record<number, number>>({});
  const [selectedQuality, setSelectedQuality] = useState<string>('maxima');

  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const { usuario } = useAuth();

  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<{
    id: number;
    titulo: string;
    mensagem: string;
    criadoEm: string;
  } | null>(null);

  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [editingVideoData, setEditingVideoData] = useState<{
    titulo: string;
    descricao: string;
    autor: string;
    categoriaId: number | null;
    status: string;
    tipo: string;
    urlOriginal: string;
    miniaturaFile?: File;
  } | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUserData, setEditingUserData] = useState({
    nome: '',
    email: '',
    perfil: 'ALUNO',
    senha: '',
    ativo: true,
    podeComentar: true,
    fotoPerfil: '',
  });
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryNome, setEditingCategoryNome] = useState('');
  const [editingCategoryDescricao, setEditingCategoryDescricao] = useState('');

  const [newUser, setNewUser] = useState({ nome: '', email: '', senha: '', perfil: 'ALUNO' });
  const [newCategory, setNewCategory] = useState({ nome: '', descricao: '' });
  const [globalConfigs, setGlobalConfigs] = useState<Record<string, string>>({});
  const [isSavingConfigs, setIsSavingConfigs] = useState(false);
  const [localWatermarkText, setLocalWatermarkText] = useState('');
  const [localWatermarkPosition, setLocalWatermarkPosition] = useState('');
  const [localSiteName, setLocalSiteName] = useState('');
  const [localLogoUrl, setLocalLogoUrl] = useState('');
  const [localShowCategories, setLocalShowCategories] = useState(true);
  const [localShowFooter, setLocalShowFooter] = useState(true);
  const [localSupportEmail, setLocalSupportEmail] = useState('');
  const [localFooterGestor, setLocalFooterGestor] = useState('');
  const [localFooterGestorEmail, setLocalFooterGestorEmail] = useState('');
  const [localFooterAutor, setLocalFooterAutor] = useState('');
  const [localFooterAutorEmail, setLocalFooterAutorEmail] = useState('');
  const [localFeaturedCount, setLocalFeaturedCount] = useState(4);
  const [localRelatedCount, setLocalRelatedCount] = useState(4);

  useEffect(() => {
    if (globalConfigs.WATERMARK_TEXT) setLocalWatermarkText(globalConfigs.WATERMARK_TEXT);
    if (globalConfigs.WATERMARK_POSITION) setLocalWatermarkPosition(globalConfigs.WATERMARK_POSITION);
    if (globalConfigs.NOME_SITE) setLocalSiteName(globalConfigs.NOME_SITE);
    if (globalConfigs.LOGO_URL) setLocalLogoUrl(globalConfigs.LOGO_URL);
    setLocalShowCategories(globalConfigs.EXIBIR_CATEGORIAS !== 'false');
    setLocalShowFooter(globalConfigs.EXIBIR_RODAPE !== 'false');
    if (globalConfigs.SUPORTE_EMAIL) setLocalSupportEmail(globalConfigs.SUPORTE_EMAIL);
    if (globalConfigs.RODAPE_GESTOR_NOME) setLocalFooterGestor(globalConfigs.RODAPE_GESTOR_NOME);
    if (globalConfigs.RODAPE_GESTOR_EMAIL) setLocalFooterGestorEmail(globalConfigs.RODAPE_GESTOR_EMAIL);
    if (globalConfigs.RODAPE_ESCRITO_POR) setLocalFooterAutor(globalConfigs.RODAPE_ESCRITO_POR);
    if (globalConfigs.RODAPE_ESCRITO_POR_EMAIL) setLocalFooterAutorEmail(globalConfigs.RODAPE_ESCRITO_POR_EMAIL);

    const destaqueCount = Number(globalConfigs.QTD_VIDEOS_DESTAQUE);
    setLocalFeaturedCount(Number.isNaN(destaqueCount) ? 4 : destaqueCount);
    const relacionadosCount = Number(globalConfigs.QTD_VIDEOS_RELACIONADOS);
    setLocalRelatedCount(Number.isNaN(relacionadosCount) ? 4 : relacionadosCount);
  }, [globalConfigs]);


  async function carregarConfiguracoes() {
    try {
      const response = await api.admin.listarConfiguracoes();
      if (response.sucesso && response.dados) {
        const configs = response.dados as Record<string, string>;
        setGlobalConfigs(configs);
      }
    } catch (erro) {
      console.error('Erro ao carregar configurações:', erro);
    }
  }

  async function salvarConfiguracoes(novasConfigs: Record<string, string>) {
    try {
      setIsSavingConfigs(true);
      await api.admin.salvarConfiguracoes(novasConfigs);
      setGlobalConfigs((prev) => ({ ...prev, ...novasConfigs }));
      alert('Configurações salvas com sucesso!');
    } catch (erro) {
      setError(tratarErroApi(erro));
    } finally {
      setIsSavingConfigs(false);
    }
  }

  async function carregarDados() {
    try {
      setLoading(true);
      setError('');

      const [dashboardResponse, videosResponse, usuariosResponse, categoriasResponse, comentariosResponse] = await Promise.all([
        api.admin.dashboard(),
        api.videos.listar(pagina, limite === -1 ? 9999 : limite),
        api.usuarios.listar(), // Usuarios ainda não tem paginação no backend, mas vamos simular ou preparar
        api.categorias.listar(),
        api.admin.listarComentarios(),
      ]);

      const videosPayload = videosResponse.dados as { videos?: AdminVideo[]; total?: number } | AdminVideo[] | undefined;
      const listaVideos = Array.isArray(videosPayload) ? videosPayload : videosPayload?.videos ?? [];
      const totalVideos = Array.isArray(videosPayload) ? listaVideos.length : videosPayload?.total ?? listaVideos.length;

      setDashboard(dashboardResponse.dados as Dashboard);
      setVideos(listaVideos);
      setUsuarios((usuariosResponse.dados as Usuario[]) ?? []);
      setCategorias((categoriasResponse.dados as Categoria[]) ?? []);
      setComentarios((comentariosResponse.dados as AdminComentario[]) ?? []);
      
      if (activeMenu === 'videos') {
        setTotalItens(totalVideos);
      } else if (activeMenu === 'users') {
        setTotalItens((usuariosResponse.dados as Usuario[])?.length ?? 0);
      } else if (activeMenu === 'comments') {
        setTotalItens((comentariosResponse.dados as AdminComentario[])?.length ?? 0);
      }

      await carregarConfiguracoes();
    } catch (erro) {
      setError(tratarErroApi(erro));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPagina(1);
  }, [activeMenu]);

  useEffect(() => {
    carregarDados();
  }, [pagina, limite, activeMenu]);

  // Efeito para monitorar progresso de vídeos em processamento
  useEffect(() => {
    const videosProcessando = videos.filter(v => v.status === 'PROCESSANDO');
    if (videosProcessando.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const promises = videosProcessando.map(async (v) => {
          try {
            const response = await api.videos.obterProcessamento(v.id);
            if (response.sucesso && response.dados) {
              const proc = response.dados as { progresso: number; status: string };
              setVideoProgress(prev => ({ ...prev, [v.id]: proc.progresso }));
              
              // Se concluiu ou deu erro, recarregar dados para atualizar a lista
              if (proc.status === 'CONCLUIDO' || proc.status === 'ERRO') {
                await carregarDados();
              }
            }
          } catch (innerErr) {
            // Silencia erros de rede individuais no polling para não inundar o console
            console.warn(`Não foi possível obter progresso para o vídeo ${v.id}. Verifique a conexão com o servidor.`);
          }
        });
        await Promise.all(promises);
      } catch (err) {
        console.error('Erro no polling de progresso:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [videos]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.usuarios.criar(newUser);
      setShowAddUser(false);
      setNewUser({ nome: '', email: '', senha: '', perfil: 'ALUNO' });
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.categorias.criar(newCategory);
      setShowAddCategory(false);
      setNewCategory({ nome: '', descricao: '' });
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleStartEditVideo = (video: AdminVideo) => {
    setEditingVideoId(video.id);
    setEditingVideoData({
      titulo: video.titulo,
      descricao: video.descricao ?? '',
      autor: video.autor,
      categoriaId: video.categoria?.id ?? categorias[0]?.id ?? null,
      status: video.status,
      tipo: video.tipo,
      urlOriginal: video.urlOriginal ?? '',
      miniaturaFile: undefined,
    });
  };

  const handleCancelEditVideo = () => {
    setEditingVideoId(null);
    setEditingVideoData(null);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideoId || !editingVideoData) return;

    try {
      if (editingVideoData.miniaturaFile) {
        // Usar FormData para upload de arquivo
        const formData = new FormData();
        formData.append('titulo', editingVideoData.titulo);
        formData.append('descricao', editingVideoData.descricao);
        formData.append('autor', editingVideoData.autor);
        formData.append('categoriaId', String(editingVideoData.categoriaId));
        formData.append('status', editingVideoData.status);
        formData.append('tipo', editingVideoData.tipo);
        if (editingVideoData.tipo === 'YOUTUBE' && editingVideoData.urlOriginal.trim()) {
          formData.append('urlOriginal', editingVideoData.urlOriginal.trim());
        }
        formData.append('miniatura', editingVideoData.miniaturaFile);
        await api.videos.atualizarComArquivo(editingVideoId, formData);
      } else {
        // Atualização normal sem arquivo
        const updates: Record<string, unknown> = {
          titulo: editingVideoData.titulo,
          descricao: editingVideoData.descricao,
          autor: editingVideoData.autor,
          categoriaId: editingVideoData.categoriaId,
          status: editingVideoData.status,
          tipo: editingVideoData.tipo,
          ...(editingVideoData.tipo === 'YOUTUBE' && editingVideoData.urlOriginal.trim()
            ? { urlOriginal: editingVideoData.urlOriginal.trim() }
            : {}),
        };
        await api.videos.atualizar(editingVideoId, updates);
      }
      setEditingVideoId(null);
      setEditingVideoData(null);
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleImportarVideo = async (id: number) => {
    try {
      setImportingVideoId(id);
      await api.videos.importarYoutube(id, undefined, selectedQuality);
      setVideoProgress(prev => ({ ...prev, [id]: 0 }));
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    } finally {
      setImportingVideoId((current) => (current === id ? null : current));
    }
  };

  const handleStartEditUser = (usuario: Usuario) => {
    setEditingUserId(usuario.id);
    setEditingUserData({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      senha: '',
      ativo: usuario.ativo,
      podeComentar: usuario.podeComentar !== false,
      fotoPerfil: usuario.fotoPerfil ?? '',
    });
    setShowAddUser(false);
  };

  const handleCancelEditUser = () => {
    setEditingUserId(null);
    setEditingUserData({
      nome: '',
      email: '',
      perfil: 'ALUNO',
      senha: '',
      ativo: true,
      podeComentar: true,
      fotoPerfil: '',
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    try {
      const updates: Record<string, unknown> = {
        nome: editingUserData.nome,
        email: editingUserData.email,
        perfil: editingUserData.perfil,
        ativo: editingUserData.ativo,
        podeComentar: editingUserData.podeComentar,
        fotoPerfil: editingUserData.fotoPerfil || null,
      };
      if (editingUserData.senha.trim()) {
        updates.senha = editingUserData.senha.trim();
      }
      await api.usuarios.atualizar(editingUserId, updates);
      handleCancelEditUser();
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleStartEditCategory = (categoria: Categoria) => {
    setEditingCategoryId(categoria.id);
    setEditingCategoryNome(categoria.nome);
    setEditingCategoryDescricao(categoria.descricao ?? '');
    setShowAddCategory(false);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryNome('');
    setEditingCategoryDescricao('');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId) return;
    try {
      await api.categorias.atualizar(editingCategoryId, {
        nome: editingCategoryNome,
        descricao: editingCategoryDescricao,
      });
      handleCancelEditCategory();
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const videosFiltrados = useMemo(() => {
    const termo = (searchQuery ?? busca).toLowerCase();
    return videos.filter((video) => {
      const buscaOk =
        !termo ||
        video.titulo.toLowerCase().includes(termo) ||
        video.autor.toLowerCase().includes(termo) ||
        video.categoria?.nome?.toLowerCase().includes(termo);
      const statusOk = !status || video.status === status;
      const tipoOk = !tipo || video.tipo === tipo;
      return buscaOk && statusOk && tipoOk;
    });
  }, [busca, searchQuery, status, tipo, videos]);

  const totalVisualizacoes = dashboard?.visualizacoes ?? videos.reduce((total, video) => total + contarVisualizacoes(video.visualizacoes), 0);
  const tituloAtual = menuItems.find((item) => item.id === activeMenu)?.label ?? 'Admin';

  async function excluirVideo(id: number) {
    const confirmado = window.confirm('Excluir este video?');
    if (!confirmado) {
      return;
    }

    await api.videos.deletar(id);
    await carregarDados();
  }

  async function aprovarVideo(id: number) {
    await api.videos.atualizar(id, { status: 'ATIVO' });
    await carregarDados();
  }

  function StatCard({
    label,
    value,
    helper,
    icon: Icon,
  }: {
    label: string;
    value: string | number;
    helper: string;
    icon: typeof Video;
  }) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{helper}</p>
      </div>
    );
  }

    const totalPaginas = Math.ceil(totalItens / limite);

    function renderPagination() {
      if (totalItens <= 0 || limite === -1) return null;
      
      return (
        <div className="flex items-center justify-between mt-6 p-4 bg-muted/20 rounded-xl border border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Exibindo <strong>{Math.min(limite, totalItens)}</strong> de <strong>{totalItens}</strong> resultados
            </span>
            <select 
              value={limite} 
              onChange={(e) => setLimite(Number(e.target.value))}
              className="bg-card border border-border rounded-md text-xs px-2 py-1 outline-none"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={15}>15 por página</option>
              <option value={-1}>Todos</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagina === 1}
              onClick={() => setPagina(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm font-medium">
              Página {pagina} de {totalPaginas || 1}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina(p => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      );
    }

  function VideosTable() {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar videos..."
              value={searchQuery ?? busca}
              onChange={(event) => {
                const value = event.target.value;
                setBusca(value);
                onSearchQueryChange?.(value);
              }}
              className="px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos os status</option>
              <option value="ATIVO">Ativos</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="PROCESSANDO">Processando</option>
              <option value="ERRO">Erro</option>
            </select>
            <select
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos os tipos</option>
              <option value="INTERNO">Interno</option>
              <option value="YOUTUBE">YouTube</option>
            </select>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">Qualidade:</span>
              <select
                value={selectedQuality}
                onChange={(event) => setSelectedQuality(event.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="maxima">Máxima (Padrão)</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
            </div>
          </div>
          {onUploadClick && (
            <Button onClick={onUploadClick} size="sm">Novo Vídeo</Button>
          )}
        </div>

        {editingVideoData && (
          <div className="p-4 border-b border-border bg-muted/30 dark:bg-muted/20">
            <form onSubmit={handleSaveVideo} className="grid gap-4 md:grid-cols-2 items-end">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Título</label>
                <input
                  value={editingVideoData.titulo}
                  onChange={(e) => setEditingVideoData((prev) => prev ? { ...prev, titulo: e.target.value } : prev)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Autor</label>
                <input
                  value={editingVideoData.autor}
                  onChange={(e) => setEditingVideoData((prev) => prev ? { ...prev, autor: e.target.value } : prev)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Descrição</label>
                <textarea
                  value={editingVideoData.descricao}
                  onChange={(e) => setEditingVideoData((prev) => prev ? { ...prev, descricao: e.target.value } : prev)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Categoria</label>
                <select
                  value={editingVideoData.categoriaId ?? ''}
                  onChange={(e) => setEditingVideoData((prev) => prev ? { ...prev, categoriaId: Number(e.target.value) } : prev)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Tipo</label>
                <select
                  value={editingVideoData.tipo}
                  onChange={(e) => setEditingVideoData((prev) => prev ? { ...prev, tipo: e.target.value } : prev)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="INTERNO">Interno</option>
                  <option value="YOUTUBE">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Status</label>
                <select
                  value={editingVideoData.status}
                  onChange={(e) => setEditingVideoData((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="PROCESSANDO">Processando</option>
                  <option value="ERRO">Erro</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Miniatura (opcional)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditingVideoData((prev) => prev ? { ...prev, miniaturaFile: file } : prev);
                      }
                    }}
                    className="hidden"
                    id="thumbnail-edit"
                  />
                  <label htmlFor="thumbnail-edit" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {editingVideoData.miniaturaFile ? editingVideoData.miniaturaFile.name : 'Clique para selecionar uma miniatura'}
                    </p>
                  </label>
                </div>
              </div>
              {editingVideoData.tipo === 'YOUTUBE' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">URL original do YouTube</label>
                  <input
                    value={editingVideoData.urlOriginal}
                    onChange={(e) => setEditingVideoData((prev) => prev ? { ...prev, urlOriginal: e.target.value } : prev)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button type="submit">Salvar alterações</Button>
                <Button variant="outline" onClick={handleCancelEditVideo}>Cancelar</Button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {['Titulo', 'Tipo', 'Status', 'Importação', 'Categoria', 'Autor', 'Data', 'Visualizacoes', 'Arquivo', 'Download', 'Ações'].map((coluna) => (
                  <th key={coluna} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {coluna}
                  </th>
                ))}

              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {videosFiltrados.map((video) => {
                const config = statusConfig[video.status] ?? statusConfig.PENDENTE;
                const StatusIcon = config.icon;

                return (
                  <tr key={video.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{video.titulo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${video.tipo === 'YOUTUBE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {video.tipo === 'YOUTUBE' ? 'YouTube' : 'Interno'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {video.tipo === 'YOUTUBE' ? (
                        importingVideoId === video.id || video.status === 'PROCESSANDO' ? (
                          <div className="flex flex-col gap-1 w-32">
                            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              <Loader className="w-3 h-3 animate-spin" />
                              {videoProgress[video.id] !== undefined ? `${videoProgress[video.id]}%` : 'Importando...'}
                            </span>
                            <div className="w-full bg-blue-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${videoProgress[video.id] ?? 0}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : video.status === 'PENDENTE' ? (
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <AlertCircle className="w-3 h-3" />
                            Aguardando importação
                          </span>
                        ) : video.status === 'ERRO' ? (
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3" />
                            Falha na importação
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            Importado
                          </span>
                        )
                      ) : video.status === 'PROCESSANDO' ? (
                        <div className="flex flex-col gap-1 w-32">
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Loader className="w-3 h-3 animate-spin" />
                            {videoProgress[video.id] !== undefined ? `${videoProgress[video.id]}%` : 'Processando...'}
                          </span>
                          <div className="w-full bg-blue-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${videoProgress[video.id] ?? 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{video.categoria?.nome ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{video.autor}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatarData(video.criadoEm)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{contarVisualizacoes(video.visualizacoes)}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {video.caminhoArquivo
                        ? video.caminhoArquivo
                        : video.tipo === 'YOUTUBE'
                          ? 'Quando importar: /uploads/videos...'
                          : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {video.status === 'PENDENTE' && (
                        <button
                          className="p-1.5 hover:bg-accent rounded-md transition-colors mr-2"
                          title="Aprovar"
                          onClick={() => aprovarVideo(video.id)}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      {video.tipo === 'INTERNO' ? (
                        <button
                          className="p-1.5 hover:bg-accent rounded-md transition-colors"
                          title="Download"
                          onClick={() => api.videos.download(video.id)}
                        >
                          <DownloadCloud className="w-4 h-4 text-primary" />
                        </button>
                      ) : (
                        <button
                          className="p-1.5 hover:bg-accent rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          title="Importar para servidor"
                          onClick={() => handleImportarVideo(video.id)}
                          disabled={video.status === 'PROCESSANDO' || importingVideoId === video.id}
                        >
                          {importingVideoId === video.id ? (
                            <Loader className="w-4 h-4 text-primary animate-spin" />
                          ) : (
                            <DownloadCloud className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleStartEditVideo(video)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => excluirVideo(video.id)}>
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>


        <div className="p-4 border-t border-border text-sm text-muted-foreground flex justify-between items-center">
          <span>Mostrando {videosFiltrados.length} de {totalItens} vídeos</span>
        </div>
        {renderPagination()}
      </div>
    );
  }

  const handleToggleUserStatus = async (id: number, ativo: boolean) => {
    try {
      if (ativo) await api.usuarios.desativar(id);
      else await api.usuarios.ativar(id);
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleDeletarUsuario = async (id: number) => {
    if (!confirm('Deseja realmente excluir este usuário? Todos os vídeos enviados por ele passarão para o administrador.')) return;
    try {
      await api.usuarios.deletar(id);
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleToggleComentarios = async (id: number, podeComentar: boolean) => {
    try {
      if (podeComentar) {
        await api.usuarios.bloquearComentarios(id);
      } else {
        await api.usuarios.desbloquearComentarios(id);
      }
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    handleStartEditUser(usuario);
  };

  function UsuariosView() {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setShowAddUser(!showAddUser)} size="sm">
            {showAddUser ? 'Cancelar' : 'Novo Usuário'}
          </Button>
        </div>

        {showAddUser && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Adicionar Novo Usuário</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input type="text" required value={newUser.nome} onChange={(e) => setNewUser({...newUser, nome: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Senha</label>
                  <input type="password" required value={newUser.senha} onChange={(e) => setNewUser({...newUser, senha: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Perfil</label>
                  <select value={newUser.perfil} onChange={(e) => setNewUser({...newUser, perfil: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background">
                    <option value="ALUNO">Aluno</option>
                    <option value="PROFESSOR">Professor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>
              <Button type="submit">Salvar Usuário</Button>
            </form>
          </div>
        )}

        {editingUserId && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-foreground dark:text-foreground">Editar Usuário</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Nome</label>
                  <input
                    type="text"
                    required
                    value={editingUserData.nome}
                    onChange={(e) => setEditingUserData((prev) => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">E-mail</label>
                  <input
                    type="email"
                    required
                    value={editingUserData.email}
                    onChange={(e) => setEditingUserData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Perfil</label>
                  <select
                    value={editingUserData.perfil}
                    onChange={(e) => setEditingUserData((prev) => ({ ...prev, perfil: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ALUNO">Aluno</option>
                    <option value="PROFESSOR">Professor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Nova senha</label>
                  <input
                    type="password"
                    value={editingUserData.senha}
                    onChange={(e) => setEditingUserData((prev) => ({ ...prev, senha: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Deixe em branco para manter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Foto de perfil</label>
                  <input
                    value={editingUserData.fotoPerfil}
                    onChange={(e) => setEditingUserData((prev) => ({ ...prev, fotoPerfil: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm text-foreground dark:text-foreground">
                    <input
                      type="checkbox"
                      checked={editingUserData.ativo}
                      onChange={(e) => setEditingUserData((prev) => ({ ...prev, ativo: e.target.checked }))}
                    />
                    Ativo
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground dark:text-foreground">
                    <input
                      type="checkbox"
                      checked={editingUserData.podeComentar}
                      onChange={(e) => setEditingUserData((prev) => ({ ...prev, podeComentar: e.target.checked }))}
                    />
                    Pode comentar
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Salvar Alterações</Button>
                <Button variant="outline" onClick={handleCancelEditUser}>Cancelar</Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {['Nome', 'Email', 'Perfil', 'Status', 'Comentários', 'Criado em', 'Ações'].map((coluna) => (
                  <th key={coluna} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuarios.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 font-medium">{user.nome}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.perfil}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.podeComentar !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.podeComentar !== false ? 'Permitidos' : 'Bloqueados'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatarData(user.criadoEm)}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleStartEditUser(user)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleToggleUserStatus(user.id, user.ativo)} title={user.ativo ? 'Desativar' : 'Ativar'}>
                        {user.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleToggleComentarios(user.id, user.podeComentar !== false)}
                        title={user.podeComentar !== false ? 'Bloquear Comentários' : 'Permitir Comentários'}
                      >
                        {user.podeComentar !== false ? <MessageSquareOff className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeletarUsuario(user.id)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>
    );
  }

  const handleDeletarCategoria = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta categoria? Os vídeos nela serão movidos para "Outros".')) return;
    try {
      await api.categorias.deletar(id);
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleEditarCategoria = (categoria: Categoria) => {
    handleStartEditCategory(categoria);
  };

  function CategoriasView() {
    const categoriasDashboard = dashboard?.categorias ?? categorias;

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setShowAddCategory(!showAddCategory)} size="sm">
            {showAddCategory ? 'Cancelar' : 'Nova Categoria'}
          </Button>
        </div>

        {showAddCategory && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Adicionar Nova Categoria</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input type="text" required value={newCategory.nome} onChange={(e) => setNewCategory({...newCategory, nome: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <input type="text" value={newCategory.descricao} onChange={(e) => setNewCategory({...newCategory, descricao: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
                </div>
              </div>
              <Button type="submit">Salvar Categoria</Button>
            </form>
          </div>
        )}

        {editingCategoryId && (
        <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 text-foreground dark:text-foreground">Editar Categoria</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Nome</label>
                  <input type="text" required value={editingCategoryNome} onChange={(e) => setEditingCategoryNome(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Descrição</label>
                  <input type="text" value={editingCategoryDescricao} onChange={(e) => setEditingCategoryDescricao(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Observação: O "Slug" é um identificador único gerado automaticamente baseado no nome da categoria. Ele é usado na URL para identificar a categoria de forma legível.</p>
              <div className="flex gap-3">
                <Button type="submit">Salvar Alterações</Button>
                <Button variant="outline" onClick={handleCancelEditCategory}>Cancelar</Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categoriasDashboard.map((categoria) => (
            <div key={categoria.id} className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{categoria.nome}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{categoria.descricao || 'Sem descricao'}</p>
                  </div>
                  <FolderTree className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">Slug: {categoria.slug}</p>
                <p className="text-sm font-medium mt-2">{categoria.totalVideos ?? videos.filter((video) => video.categoria?.nome === categoria.nome).length} videos</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleStartEditCategory(categoria)}>
                  Editar
                </Button>
                <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => handleDeletarCategoria(categoria.id)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleStartEditComment = (comentario: AdminComentario) => {
    setEditingCommentId(comentario.id);
    setEditingCommentText(comentario.texto);
  };

  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommentId) return;
    try {
      await api.admin.atualizarComentario(editingCommentId, editingCommentText);
      setEditingCommentId(null);
      setEditingCommentText('');
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!confirm('Deseja realmente excluir este comentário?')) return;
    try {
      await api.admin.deletarComentario(id);
      await carregarDados();
    } catch (error) {
      setError(tratarErroApi(error));
    }
  };

  function ComentariosView() {
    return (
      <div className="space-y-4">
        {editingCommentId && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Editar Comentário</h3>
            <form onSubmit={handleSaveComment} className="space-y-4">
              <textarea
                value={editingCommentText}
                onChange={(e) => setEditingCommentText(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-input-background min-h-24"
              />
              <div className="flex gap-3">
                <Button type="submit">Salvar</Button>
                <Button variant="outline" onClick={() => setEditingCommentId(null)}>Cancelar</Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {['Comentário', 'Usuário', 'Vídeo', 'Tipo', 'Data', 'Ações'].map((coluna) => (
                  <th key={coluna} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {comentarios.map((comentario) => (
                <tr key={comentario.id}>
                  <td className="px-6 py-4 text-sm max-w-md">
                    <p className="line-clamp-3">{comentario.texto}</p>
                    {comentario._count?.respostas ? (
                      <p className="text-xs text-muted-foreground mt-1">{comentario._count.respostas} resposta(s)</p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{comentario.usuario?.nome ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{comentario.video?.titulo ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{comentario.parentId ? 'Resposta' : 'Comentário'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatarData(comentario.criadoEm)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleStartEditComment(comentario)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeleteComment(comentario.id)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>
    );
  }

  function ReportsView() {
    const videosPorTipo = [
      { label: 'Internos', value: dashboard?.internos ?? 0 },
      { label: 'YouTube', value: dashboard?.externos ?? 0 },
      { label: 'Pendentes', value: dashboard?.pendentes ?? 0 },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Resumo por tipo/status</h3>
          <div className="space-y-3">
            {videosPorTipo.map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Categorias mais usadas</h3>
          <div className="space-y-3">
            {(dashboard?.categorias ?? []).map((categoria) => (
              <div key={categoria.id} className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">{categoria.nome}</span>
                <span className="font-semibold">{categoria.totalVideos ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function SettingsView() {

    const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      salvarConfiguracoes({
        NOME_SITE: localSiteName,
        LOGO_URL: localLogoUrl,
        WATERMARK_TEXT: localWatermarkText,
        WATERMARK_POSITION: localWatermarkPosition,
        MARCA_DAGUA_TEXTO: localWatermarkText,
        MARCA_DAGUA_POSICAO: localWatermarkPosition,
        EXIBIR_CATEGORIAS: localShowCategories ? 'true' : 'false',
        EXIBIR_RODAPE: localShowFooter ? 'true' : 'false',
        SUPORTE_EMAIL: localSupportEmail,
        RODAPE_GESTOR_NOME: localFooterGestor,
        RODAPE_GESTOR_EMAIL: localFooterGestorEmail,
        RODAPE_ESCRITO_POR: localFooterAutor,
        RODAPE_ESCRITO_POR_EMAIL: localFooterAutorEmail,
        QTD_VIDEOS_DESTAQUE: String(localFeaturedCount),
        QTD_VIDEOS_RELACIONADOS: String(localRelatedCount),
      });
      // Atualiza também o seletor de importação para consistência imediata
    };

    return (
      <div className="space-y-6 max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configurações da Marca D'água
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Defina o texto e a posição padrão da marca d'água aplicada aos vídeos durante o processamento.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Nome do site</label>
              <input
                type="text"
                value={localSiteName}
                onChange={(e) => setLocalSiteName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Vídeos Escola"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">URL da logomarca</label>
              <input
                type="text"
                value={localLogoUrl}
                onChange={(e) => setLocalLogoUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="https://... ou /uploads/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Texto da Marca D'água</label>
              <input
                type="text"
                value={localWatermarkText}
                onChange={(e) => setLocalWatermarkText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ex: Minha Escola"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Posição Padrão</label>
              <select
                value={localWatermarkPosition}
                onChange={(e) => setLocalWatermarkPosition(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="TOP_LEFT">Topo esquerdo</option>
                <option value="TOP_RIGHT">Topo direito</option>
                <option value="BOTTOM_LEFT">Inferior esquerdo</option>
                <option value="BOTTOM_RIGHT">Inferior direito</option>
                <option value="CENTER">Centro</option>
              </select>
            </div>
          </form>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Informações do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">URL da API</p>
              <p className="font-medium">http://localhost:4000/api</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">CORS Permitido</p>
              <p className="font-medium">http://localhost:5173</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">Usuários Ativos</p>
              <p className="font-medium">{usuarios.filter((u) => u.ativo).length}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">Total de Categorias</p>
              <p className="font-medium">{categorias.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configurações de Página
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Controle a visibilidade de categorias e rodapé, além de configurar informações de contato.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localShowCategories}
                  onChange={(e) => setLocalShowCategories(e.target.checked)}
                  className="w-5 h-5 rounded border-border cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground">Exibir categorias na página inicial</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localShowFooter}
                  onChange={(e) => setLocalShowFooter(e.target.checked)}
                  className="w-5 h-5 rounded border-border cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground">Exibir rodapé</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Quantidade de vídeos em destaque</label>
                <input
                  type="number"
                  min={0}
                  value={localFeaturedCount}
                  onChange={(e) => setLocalFeaturedCount(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Quantidade de vídeos relacionados</label>
                <input
                  type="number"
                  min={0}
                  value={localRelatedCount}
                  onChange={(e) => setLocalRelatedCount(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="4"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <h4 className="text-sm font-medium mb-4 text-foreground">Informações de Contato</h4>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email de Suporte</label>
                <input
                  type="email"
                  value={localSupportEmail}
                  onChange={(e) => setLocalSupportEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="suporte@seusite.com.br"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Gestor - Nome</label>
                  <input
                    type="text"
                    value={localFooterGestor}
                    onChange={(e) => setLocalFooterGestor(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ex: Alberto Brasileiro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Gestor - Email</label>
                  <input
                    type="email"
                    value={localFooterGestorEmail}
                    onChange={(e) => setLocalFooterGestorEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="alberto@seusite.com.br"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Desenvolvedor - Nome</label>
                  <input
                    type="text"
                    value={localFooterAutor}
                    onChange={(e) => setLocalFooterAutor(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ex: William Ramos de Brito"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Desenvolvedor - Email</label>
                  <input
                    type="email"
                    value={localFooterAutorEmail}
                    onChange={(e) => setLocalFooterAutorEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="william@seusite.com.br"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isSavingConfigs}>
                {isSavingConfigs ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function Conteudo() {
    if (activeMenu === 'videos') return VideosTable();
    if (activeMenu === 'users') return UsuariosView();
    if (activeMenu === 'categories') return CategoriasView();
    if (activeMenu === 'comments') return ComentariosView();
    if (activeMenu === 'reports') return ReportsView();
    if (activeMenu === 'settings') return SettingsView();

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total de videos" value={dashboard?.total ?? videos.length} helper={`${dashboard?.internos ?? 0} internos, ${dashboard?.externos ?? 0} YouTube`} icon={Video} />
          <StatCard label="Visualizacoes" value={totalVisualizacoes} helper="Contador real registrado ao abrir videos" icon={BarChart3} />
          <StatCard label="Pendentes" value={dashboard?.pendentes ?? 0} helper="Aguardando revisao/publicacao" icon={AlertCircle} />
          <StatCard label="Usuarios" value={dashboard?.totalUsuarios ?? usuarios.length} helper={`${dashboard?.totalCategorias ?? categorias.length} categorias cadastradas`} icon={Users} />
        </div>
        {VideosTable()}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Admin</h2>
              <p className="text-xs text-muted-foreground">Painel de Controle</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeMenu === item.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Site
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{tituloAtual}</h1>
              <p className="text-muted-foreground mt-1">Dados reais da plataforma</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)} className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-xs font-bold text-destructive-foreground">
                      {unreadCount}
                    </div>
                  )}
                </Button>
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold">Notificações</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-4 text-muted-foreground text-sm">Nenhuma nova notificação</p>
                    ) : (
                      <>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-4 border-b border-border hover:bg-accent cursor-pointer"
                            onClick={() => {
                              markAsRead(notif.id);
                              setSelectedNotification({
                                id: notif.id,
                                titulo: notif.titulo,
                                mensagem: notif.mensagem,
                                criadoEm: notif.criadoEm,
                              });
                            }}
                          >
                            <p className="font-medium">{notif.titulo}</p>
                            <p className="text-sm text-muted-foreground">{notif.mensagem}</p>
                          </div>
                        ))}
                        <Button variant="ghost" className="w-full justify-start" onClick={markAllAsRead}>
                          <Check className="w-4 h-4 mr-2" />
                          Marcar todas como lidas
                        </Button>
                        {onNotificationsClick && (
                          <Button variant="ghost" className="w-full justify-start rounded-none" onClick={onNotificationsClick}>
                            <Bell className="w-4 h-4 mr-2" />
                            Abrir página de notificações
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={carregarDados}>Atualizar</Button>
            </div>
          </div>
        </header>


        <div className="p-6">
          {loading ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">Carregando dados...</div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-destructive">{error}</div>
          ) : (
            Conteudo()
          )}
        </div>

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
      </main>
    </div>
  );
}
