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
  Upload,
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
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminVideos } from './admin/AdminVideos';
import { AdminUsers } from './admin/AdminUsers';
import { AdminCategories } from './admin/AdminCategories';
import { AdminComments } from './admin/AdminComments';
import { AdminReports } from './admin/AdminReports';
import { AdminSettings } from './admin/AdminSettings';



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
  const [localAtivarRecomendados, setLocalAtivarRecomendados] = useState(true);
  const [localQtdVideosRecomendados, setLocalQtdVideosRecomendados] = useState(10);
  const [localAtivarEmAlta, setLocalAtivarEmAlta] = useState(true);
  const [localQtdVideosEmAlta, setLocalQtdVideosEmAlta] = useState(10);

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

    // Configurações de recomendação
    setLocalAtivarRecomendados(globalConfigs.ATIVAR_RECOMENDADOS !== 'false');
    const qtdRecomendados = Number(globalConfigs.QTD_VIDEOS_RECOMENDADOS);
    setLocalQtdVideosRecomendados(Number.isNaN(qtdRecomendados) ? 10 : qtdRecomendados);

    // Configurações de "em alta"
    setLocalAtivarEmAlta(globalConfigs.ATIVAR_EM_ALTA !== 'false');
    const qtdEmAlta = Number(globalConfigs.QTD_VIDEOS_EM_ALTA);
    setLocalQtdVideosEmAlta(Number.isNaN(qtdEmAlta) ? 10 : qtdEmAlta);
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
      titulo: video.titulo || '',
      descricao: video.descricao || '',
      autor: video.autor || '',
      categoriaId: video.categoria?.id || (categorias.length > 0 ? categorias[0].id : null),
      status: video.status || 'PENDENTE',
      tipo: video.tipo || 'INTERNO',
      urlOriginal: video.urlOriginal || '',
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
    const termo = (searchQuery || busca || '').toLowerCase();
    return (videos || []).filter((video) => {
      if (!video) return false;
      const buscaOk =
        !termo ||
        (video.titulo || '').toLowerCase().includes(termo) ||
        (video.autor || '').toLowerCase().includes(termo) ||
        (video.categoria?.nome || '').toLowerCase().includes(termo);
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

  async function handleToggleUserStatus(id: number, ativo: boolean) {
    try {
      if (ativo) {
        await api.usuarios.desativar(id);
      } else {
        await api.usuarios.ativar(id);
      }
      await carregarDados();
    } catch (erro) {
      setError(tratarErroApi(erro));
    }
  }

  async function handleToggleComentarios(id: number, podeComentar: boolean) {
    try {
      if (podeComentar) {
        await api.usuarios.bloquearComentarios(id);
      } else {
        await api.usuarios.desbloquearComentarios(id);
      }
      await carregarDados();
    } catch (erro) {
      setError(tratarErroApi(erro));
    }
  }

  async function handleDeletarUsuario(id: number) {
    const confirmado = window.confirm('Excluir este usuário?');
    if (!confirmado) return;
    try {
      await api.usuarios.deletar(id);
      await carregarDados();
    } catch (erro) {
      setError(tratarErroApi(erro));
    }
  }

  async function handleDeletarCategoria(id: number) {
    const confirmado = window.confirm('Excluir esta categoria?');
    if (!confirmado) return;
    try {
      await api.categorias.deletar(id);
      await carregarDados();
    } catch (erro) {
      setError(tratarErroApi(erro));
    }
  }

  async function handleSaveComment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCommentId) return;
    try {
      await api.admin.atualizarComentario(editingCommentId, editingCommentText);
      setEditingCommentId(null);
      setEditingCommentText('');
      await carregarDados();
    } catch (erro) {
      setError(tratarErroApi(erro));
    }
  }

  function handleStartEditComment(comentario: AdminComentario) {
    setEditingCommentId(comentario.id);
    setEditingCommentText(comentario.texto || '');
  }

  async function handleDeleteComment(id: number) {
    const confirmado = window.confirm('Excluir este comentário?');
    if (!confirmado) return;
    try {
      await api.admin.deletarComentario(id);
      await carregarDados();
    } catch (erro) {
      setError(tratarErroApi(erro));
    }
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

  const ctx = {
    dashboard, videos, usuarios, categorias, comentarios, totalVisualizacoes, statusConfig, formatarData, setActiveMenu,
    videosFiltrados, importingVideoId, videoProgress, aprovarVideo, handleImportarVideo, handleStartEditVideo, excluirVideo,
    totalItens, renderPagination, busca, setBusca, searchQuery, onSearchQueryChange, status, setStatus, tipo, setTipo,
    selectedQuality, setSelectedQuality, onUploadClick, editingVideoData, setEditingVideoData, handleSaveVideo, handleCancelEditVideo,
    contarVisualizacoes, showAddUser, setShowAddUser, newUser, setNewUser, handleAddUser, editingUserId, editingUserData,
    setEditingUserData, handleSaveUser, handleCancelEditUser, handleStartEditUser, handleToggleUserStatus, handleToggleComentarios,
    handleDeletarUsuario, showAddCategory, setShowAddCategory, newCategory, setNewCategory, handleAddCategory, editingCategoryId,
    editingCategoryNome, setEditingCategoryNome, editingCategoryDescricao, setEditingCategoryDescricao, handleSaveCategory,
    handleCancelEditCategory, handleStartEditCategory, handleDeletarCategoria, editingCommentId, setEditingCommentId,
    editingCommentText, setEditingCommentText, handleSaveComment, handleStartEditComment, handleDeleteComment, isSavingConfigs,
    localSiteName, setLocalSiteName, localLogoUrl, setLocalLogoUrl, localWatermarkText, setLocalWatermarkText, localWatermarkPosition,
    setLocalWatermarkPosition, localShowCategories, setLocalShowCategories, localShowFooter, setLocalShowFooter, localSupportEmail,
    setLocalSupportEmail, localFooterGestor, setLocalFooterGestor, localFooterGestorEmail, setLocalFooterGestorEmail, localFooterAutor,
    setLocalFooterAutor, localFooterAutorEmail, setLocalFooterAutorEmail, localFeaturedCount, setLocalFeaturedCount, localRelatedCount,
    setLocalRelatedCount, localAtivarRecomendados, setLocalAtivarRecomendados, localQtdVideosRecomendados, setLocalQtdVideosRecomendados,
    localAtivarEmAlta, setLocalAtivarEmAlta, localQtdVideosEmAlta, setLocalQtdVideosEmAlta, salvarConfiguracoes, api
  };

  function Conteudo() {
    if (activeMenu === 'dashboard') return <AdminDashboard ctx={ctx} />;
    if (activeMenu === 'videos') return <AdminVideos ctx={ctx} />;
    if (activeMenu === 'users') return <AdminUsers ctx={ctx} />;
    if (activeMenu === 'categories') return <AdminCategories ctx={ctx} />;
    if (activeMenu === 'comments') return <AdminComments ctx={ctx} />;
    if (activeMenu === 'reports') return <AdminReports ctx={ctx} />;
    if (activeMenu === 'settings') return <AdminSettings ctx={ctx} />;

    return <AdminDashboard ctx={ctx} />;
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
