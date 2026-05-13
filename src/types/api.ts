// src/types/api.ts
// Tipos TypeScript para a API do backend

export interface ApiResponse<T> {
  sucesso: boolean;
  dados: T;
  erro?: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  ativo: boolean;
  criadoEm: string;
  fotoPerfil?: string;
}

export interface Categoria {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
}

export interface Video {
  id: number;
  titulo: string;
  descricao: string;
  autor: string;
  tipo: 'INTERNO' | 'YOUTUBE';
  status: 'ATIVO' | 'INATIVO' | 'PROCESSANDO' | 'ERRO';
  caminhoArquivo?: string;
  urlOriginal?: string;
  miniatura?: string;
  categoriaId: number;
  uploaderId: number;
  criadoEm: string;
  categoria?: Categoria;
  uploader?: Usuario;
}

export interface VideoListResponse {
  videos: Video[];
  total: number;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
}

export interface CreateVideoRequest {
  titulo: string;
  descricao: string;
  autor: string;
  categoriaId: number;
  tipo: 'INTERNO' | 'YOUTUBE';
  urlOriginal?: string;
  arquivo?: File;
  miniatura?: File;
}

export interface UpdateVideoRequest {
  titulo?: string;
  descricao?: string;
  autor?: string;
  categoriaId?: number;
  status?: 'ATIVO' | 'INATIVO';
}

export interface CreateCategoriaRequest {
  nome: string;
  descricao?: string;
}

export interface UpdateCategoriaRequest {
  nome?: string;
  descricao?: string;
}

export interface AdminDashboardResponse {
  totalUsuarios: number;
  total: number;
  internos: number;
  externos: number;
  pendentes: number;
}

export interface Avaliacao {
  id: number;
  usuarioId: number;
  videoId: number;
  nota: number;
  comentario?: string;
  criadoEm: string;
  usuario?: Usuario;
}

export interface Comentario {
  id: number;
  usuarioId: number;
  videoId: number;
  conteudo: string;
  criadoEm: string;
  parentId?: number;
  usuario?: Usuario;
  respostas?: Comentario[];
}

export interface Configuracao {
  id: number;
  chave: string;
  valor: string;
  descricao?: string;
}

export interface Notification {
  id: number;
  usuarioId: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criadoEm: string;
}