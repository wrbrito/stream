/**
 * Serviço de API - Cliente HTTP centralizado
 * Gerencia autenticação, tokens JWT e requisições à API backend
 */

// Construir URL da API dinamicamente baseado no host atual
const getApiBaseUrl = (): string => {
  // Se houver variável de ambiente definida, usar ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Caso contrário, usar o host/porta do navegador
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = 4000; // Porta padrão do backend

  return `${protocol}//${hostname}:${port}/api`;
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = unknown> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
  detalhes?: unknown;
}

function extrairMensagemDetalhes(detalhes: unknown): string | null {
  if (!detalhes || typeof detalhes !== 'object') {
    return null;
  }

  const mensagens: string[] = [];

  function coletar(valor: unknown) {
    if (!valor || typeof valor !== 'object') {
      return;
    }

    const erros = (valor as { _errors?: unknown })._errors;
    if (Array.isArray(erros)) {
      mensagens.push(...erros.filter((item): item is string => typeof item === 'string'));
    }

    for (const item of Object.values(valor)) {
      coletar(item);
    }
  }

  coletar(detalhes);
  return mensagens.length ? mensagens.join(' ') : null;
}

export interface AuthPayload {
  usuario: {
    id: number;
    nome: string;
    email: string;
    perfil: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
    fotoPerfil?: string | null;
  };
  token: string;
}

export const api = {
  /**
   * Armazena token JWT
   */
  setToken: (token: string, lembrar: boolean = true): void => {
    const storage = lembrar ? localStorage : sessionStorage;
    const outroStorage = lembrar ? sessionStorage : localStorage;
    storage.setItem('auth_token', token);
    outroStorage.removeItem('auth_token');
  },

  setUsuario: (usuario: AuthPayload['usuario'], lembrar: boolean = true): void => {
    const storage = lembrar ? localStorage : sessionStorage;
    const outroStorage = lembrar ? sessionStorage : localStorage;
    storage.setItem('auth_usuario', JSON.stringify(usuario));
    outroStorage.removeItem('auth_usuario');
  },

  /**
   * Remove token JWT
   */
  clearToken: (): void => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  },

  clearAuth: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_usuario');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_usuario');
  },

  /**
   * Retorna token JWT armazenado
   */
  getToken: (): string | null => {
    return localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');
  },

  getUsuario: (): AuthPayload['usuario'] | null => {
    const usuario = localStorage.getItem('auth_usuario') ?? sessionStorage.getItem('auth_usuario');
    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario) as AuthPayload['usuario'];
    } catch {
      localStorage.removeItem('auth_usuario');
      sessionStorage.removeItem('auth_usuario');
      return null;
    }
  },

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated: (): boolean => {
    return !!api.getToken();
  },

  /**
   * Realiza requisição HTTP genérica com autenticação automática
   */
  async fetch<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = api.getToken();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string> | undefined),
    };

    // Adicionar token no header se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Se token expirou (401), limpar credenciais e evitar redirecionamento de rota
    if (response.status === 401) {
      api.clearAuth();
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? ((await response.json()) as ApiResponse<T>)
      : ({ sucesso: response.ok, erro: await response.text() } as ApiResponse<T>);

    if (!data.sucesso) {
      const detalhes = extrairMensagemDetalhes(data.detalhes);
      if (detalhes) {
        throw new Error(detalhes);
      }
      throw new Error(data.erro || 'Erro na requisição');
    }

    return data;
  },

  // ============ Auth ============

  auth: {
    login: async (email: string, senha: string): Promise<AuthPayload> => {
      const response = await api.fetch<AuthPayload>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
      return response.dados!;
    },

    logout: async (): Promise<void> => {
      api.clearAuth();
      await api.fetch('/auth/logout', { method: 'POST' });
    },
  },

  // ============ Vídeos ============

  videos: {
    listar: async (
      pagina: number = 1,
      limite: number = 10,
      busca?: string,
      categoriaId?: number,
      ordenarPor?: 'recentes' | 'populares'
    ) => {
      const params = new URLSearchParams();
      params.append('pagina', pagina.toString());
      params.append('limite', limite.toString());
      if (busca) params.append('busca', busca);
      if (categoriaId) params.append('categoriaId', categoriaId.toString());
      if (ordenarPor) params.append('ordenarPor', ordenarPor);

      return api.fetch(`/videos?${params.toString()}`);
    },

    obterPorId: async (id: number) => {
      return api.fetch(`/videos/${id}`);
    },

    registrarVisualizacao: async (id: number, tempoAssistido: number = 0) => {
      return api.fetch(`/videos/${id}/visualizacoes`, {
        method: 'POST',
        body: JSON.stringify({ tempoAssistido }),
      });
    },

    listarFavoritos: async () => {
      return api.fetch('/videos/favoritos/me');
    },

    verificarFavorito: async (id: number) => {
      return api.fetch(`/videos/${id}/favorito`);
    },

    favoritar: async (id: number) => {
      return api.fetch(`/videos/${id}/favorito`, {
        method: 'POST',
      });
    },

    desfavoritar: async (id: number) => {
      return api.fetch(`/videos/${id}/favorito`, {
        method: 'DELETE',
      });
    },

    denunciar: async (id: number) => {
      return api.fetch(`/videos/${id}/denunciar`, {
        method: 'POST',
      });
    },

    criar: async (formData: FormData) => {
      return api.fetch('/videos', {
        method: 'POST',
        headers: {}, // FormData define content-type automaticamente
        body: formData,
      });
    },

    atualizar: async (id: number, dados: Record<string, unknown>) => {
      return api.fetch(`/videos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
      });
    },

    atualizarComArquivo: async (id: number, formData: FormData) => {
      return api.fetch(`/videos/${id}`, {
        method: 'PUT',
        headers: {}, // FormData define content-type automaticamente
        body: formData,
      });
    },

    deletar: async (id: number) => {
      return api.fetch(`/videos/${id}`, {
        method: 'DELETE',
      });
    },

    importarYoutube: async (
      id: number,
      posicaoMarcaDagua?: 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER',
      qualidade?: string
    ) => {
      return api.fetch(`/videos/${id}/importar`, {
        method: 'POST',
        body: JSON.stringify({ 
          posicaoMarcaDagua,
          qualidade: qualidade || 'maxima'
        }),
      });
    },

    obterProcessamento: async (id: number) => {
      return api.fetch(`/videos/${id}/processamento`);
    },

    buscarMetadadosYoutube: async (url: string) => {
      return api.fetch('/videos/metadados-youtube', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },

    download: async (id: number) => {
      window.open(`${import.meta.env.VITE_API_URL}/videos/${id}/download`, '_blank');
    },
  },


  // ============ Categorias ============

  categorias: {
    listar: async () => {
      return api.fetch('/categorias');
    },

    criar: async (dados: { nome: string; descricao?: string }) => {
      return api.fetch('/categorias', {
        method: 'POST',
        body: JSON.stringify(dados),
      });
    },

    atualizar: async (id: number, dados: Record<string, unknown>) => {
      return api.fetch(`/categorias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
      });
    },

    deletar: async (id: number) => {
      return api.fetch(`/categorias/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ============ Usuários ============

  usuarios: {
    listar: async () => {
      return api.fetch('/usuarios');
    },
    criar: async (dados: { nome: string; email: string; senha: string; perfil: string }) => {
      return api.fetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify(dados),
      });
    },
    atualizar: async (id: number, dados: Record<string, unknown>) => {
      return api.fetch(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
      });
    },
    ativar: async (id: number) => {
      return api.fetch(`/usuarios/${id}/ativar`, {
        method: 'PATCH',
      });
    },
    desativar: async (id: number) => {
      return api.fetch(`/usuarios/${id}/desativar`, {
        method: 'PATCH',
      });
    },
    deletar: async (id: number) => {
      return api.fetch(`/usuarios/${id}`, {
        method: 'DELETE',
      });
    },
    bloquearComentarios: async (id: number) => {
      return api.fetch(`/usuarios/${id}/bloquear-comentarios`, {
        method: 'PATCH',
      });
    },
    desbloquearComentarios: async (id: number) => {
      return api.fetch(`/usuarios/${id}/desbloquear-comentarios`, {
        method: 'PATCH',
      });
    },
  },

  profile: {
    obter: async () => {
      return api.fetch('/profile');
    },
    atualizar: async (dados: Record<string, unknown>) => {
      return api.fetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(dados),
      });
    },
    atualizarFoto: async (dados: FormData | { fotoPerfil: string }) => {
      if (dados instanceof FormData) {
        return api.fetch('/profile/foto', {
          method: 'POST',
          body: dados,
        });
      }
      return api.fetch('/profile/foto', {
        method: 'POST',
        body: JSON.stringify(dados),
      });
    },
    trocarSenha: async (dados: { senhaAtual: string; novaSenha: string; confirmarSenha: string }) => {
      return api.fetch('/profile/senha', {
        method: 'PATCH',
        body: JSON.stringify(dados),
      });
    },
    listarAvaliacoes: async () => {
      return api.fetch('/profile/avaliacoes');
    },
    listarComentarios: async () => {
      return api.fetch('/profile/comentarios');
    },
  },

  comentarios: {
    listar: async (videoId: number) => {
      return api.fetch(`/comentarios/video/${videoId}`);
    },
    criar: async (videoId: number, texto: string, parentId?: number) => {
      return api.fetch(`/comentarios/video/${videoId}`, {
        method: 'POST',
        body: JSON.stringify({ texto, parentId }),
      });
    },
    atualizar: async (id: number, texto: string) => {
      return api.fetch(`/comentarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ texto }),
      });
    },
    deletar: async (id: number) => {
      return api.fetch(`/comentarios/${id}`, {
        method: 'DELETE',
      });
    },
  },

  avaliacoes: {
    obter: async (videoId: number) => {
      return api.fetch(`/avaliacoes/video/${videoId}`);
    },
    avaliar: async (videoId: number, nota: number) => {
      return api.fetch(`/avaliacoes/video/${videoId}`, {
        method: 'POST',
        body: JSON.stringify({ nota }),
      });
    },
  },

  notifications: {
    listar: async () => {
      return api.fetch('/notifications');
    },
    contar: async () => {
      return api.fetch('/notifications/contar');
    },
    marcarLida: async (id: number) => {
      return api.fetch(`/notifications/${id}/lida`, { method: 'PATCH' });
    },
    marcarTodasLidas: async () => {
      return api.fetch('/notifications/todas/lidas', { method: 'PATCH' });
    },
  },


  // ============ Admin ============

  admin: {
    dashboard: async () => {
      return api.fetch('/admin/dashboard');
    },
    listarConfiguracoes: async () => {
      return api.fetch('/admin/configuracoes');
    },
    salvarConfiguracoes: async (configs: Record<string, string>) => {
      return api.fetch('/admin/configuracoes', {
        method: 'POST',
        body: JSON.stringify({ configs }),
      });
    },
    listarComentarios: async () => {
      return api.fetch('/admin/comentarios');
    },
    atualizarComentario: async (id: number, texto: string) => {
      return api.fetch(`/admin/comentarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ texto }),
      });
    },
    deletarComentario: async (id: number) => {
      return api.fetch(`/admin/comentarios/${id}`, {
        method: 'DELETE',
      });
    },
  },

  recommendations: {
    recommended: async (pagina: number = 1, limite: number = 10) => {
      const params = new URLSearchParams({ pagina: String(pagina), limite: String(limite) });
      return api.fetch(`/recommendations/recommended?${params.toString()}`);
    },
    related: async (videoId: number, pagina: number = 1, limite: number = 10) => {
      const params = new URLSearchParams({ pagina: String(pagina), limite: String(limite) });
      return api.fetch(`/recommendations/related/${videoId}?${params.toString()}`);
    },
    trending: async (pagina: number = 1, limite: number = 10) => {
      const params = new URLSearchParams({ pagina: String(pagina), limite: String(limite) });
      return api.fetch(`/recommendations/trending?${params.toString()}`);
    },
  },

  configuracoes: {
    publicas: async () => {
      return api.fetch('/configuracoes/publicas');
    },
  },
};

/**
 * Hook para integrar com React Hooks (exemplo)
 */
export function useApi() {
  return api;
}

/**
 * Função para traduzi erros da API em mensagens amigáveis
 */
export function tratarErroApi(erro: unknown): string {
  if (erro instanceof Error) {
    if (erro.message === 'Sessão expirada. Por favor, faça login novamente.') {
      return 'Sua sessão expirou. Por favor, faça login novamente.';
    }
    if (erro.message.includes('E-mail ou senha inválidos')) {
      return 'E-mail ou senha incorretos.';
    }
    if (erro.message.includes('permissão')) {
      return 'Você não tem permissão para realizar esta ação.';
    }
    return erro.message;
  }
  return 'Ocorreu um erro. Tente novamente.';
}
