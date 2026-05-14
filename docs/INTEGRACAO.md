# Guia de Integração Frontend-Backend

Este documento descreve como integrar o ReactApp frontend com o backend Express.

## Configuração Inicial

### 1. Instalar dependências de ambos os projetos

```bash
# Instala todas as dependências de ambos frontend e backend
pnpm install
```

### 2. Configurar variáveis de ambiente do backend

Copie `.env.example` para `.env` no diretório `backend/`:

```bash
cp backend/.env.example backend/.env
```

E ajuste conforme necessário (especialmente `JWT_SECRET`):

```env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET=sua_chave_super_secreta_aqui_minimo_10_caracteres
JWT_EXPIRES_IN=1h
UPLOAD_DIRECTORY=./storage
APP_URL=http://localhost:3000
WATERMARK_TEXT=Plataforma Escolar
```

### 3. Iniciar o backend

```bash
# Terminal 1
pnpm --filter backend dev
# Servidor rodará em http://localhost:4000
```

### 4. Iniciar o frontend

```bash
# Terminal 2
pnpm dev
# Aplicação rodará em http://localhost:5173 (Vite) ou http://localhost:3000
```

---

## Integração no React

### 1. Criar um serviço API centralizado

Crie `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  getToken: () => localStorage.getItem('auth_token'),

  clearToken: () => localStorage.removeItem('auth_token'),

  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
      }
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro na requisição');
    }

    return response.json();
  },
};
```

### 2. Adaptار o Login

Modifique `src/app/App.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Login } from './components/Login';
import { Home } from './components/Home';
// ... outros imports

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!api.getToken());
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  // ... resto do código

  const handleLogin = async (email: string, senha: string) => {
    try {
      const { dados } = await api.fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
      api.setToken(dados.token);
      setIsLoggedIn(true);
      setCurrentScreen('home');
    } catch (erro) {
      console.error('Erro ao fazer login:', erro);
      alert('Falha na autenticação');
    }
  };

  // ... resto do código
}
```

### 3. Listar Vídeos

Modifique `src/app/components/Home.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
// ... outros imports

interface HomeProps {
  onVideoClick: (videoId: number) => void;
  onUploadClick: () => void;
  onAdminClick: () => void;
}

export function Home({ onVideoClick, onUploadClick, onAdminClick }: HomeProps) {
  const [videos, setVideos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [videosRes, categoriasRes] = await Promise.all([
          api.fetch('/videos?pagina=1&limite=20'),
          api.fetch('/categorias'),
        ]);
        setVideos(videosRes.dados.videos);
        setCategorias(categoriasRes.dados);
      } catch (erro) {
        console.error('Erro ao carregar:', erro);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, []);

  // ... resto do código, substituindo mockVideos e mockCategories pelos dados reais
}
```

### 4. Upload de Vídeo

Modifique `src/app/components/UploadVideo.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append('titulo', title);
  formData.append('descricao', description);
  formData.append('autor', 'Usuário'); // Obter do contexto
  formData.append('categoriaId', category);
  formData.append('tipo', uploadType === 'file' ? 'INTERNO' : 'YOUTUBE');

  if (uploadType === 'youtube') {
    formData.append('urlOriginal', youtubeUrl);
  } else if (selectedFile) {
    formData.append('arquivo', selectedFile);
  }

  try {
    const response = await api.fetch('/videos', {
      method: 'POST',
      headers: {}, // FormData define content-type automaticamente
      body: formData,
    });
    alert('Vídeo enviado com sucesso!');
    onBack();
  } catch (erro) {
    alert(`Erro ao enviar vídeo: ${erro.message}`);
  }
};
```

### 5. Painel Admin

Modifique `src/app/components/AdminPanel.tsx`:

```typescript
const [adminStats, setAdminStats] = useState<any>(null);

useEffect(() => {
  const carregarDados = async () => {
    try {
      const res = await api.fetch('/admin/dashboard');
      setAdminStats(res.dados);
    } catch (erro) {
      console.error('Erro ao carregar dashboard:', erro);
    }
  };

  if (activeMenu === 'dashboard') {
    carregarDados();
  }
}, [activeMenu]);
```

---

## Variáveis de Ambiente Frontend

Crie `.env.local` na raiz do frontend:

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Fluxo Completo de Uso

1. **Usuário faz login**
   - Frontend envia credenciais para POST `/auth/login`
   - Backend retorna token JWT
   - Frontend armazena token em localStorage

2. **Usuário vê lista de vídeos**
   - Frontend faz GET `/videos?pagina=1`
   - Backend retorna vídeos do banco de dados

3. **Usuário faz upload de vídeo**
   - Frontend envia multipart form data para POST `/videos`
   - Backend processa e marca com água
   - Vídeo fica visível na listagem

4. **Admin importa vídeo do YouTube**
   - Frontend faz POST `/videos/:id/importar`
   - Backend baixa, processa e marca com água
   - Vídeo muda status de YOUTUBE para INTERNO

---

## Tratamento de Erros

Sempre que houver um erro 401 (token expirado), o usuário é redirecionado para login.

Adicione um interceptor para tratar erros padronizados:

```typescript
export const handleApiError = (error: any): string => {
  if (error.response?.status === 401) {
    api.clearToken();
    window.location.href = '/login';
    return 'Sessão expirada. Por favor, faça login novamente.';
  }

  if (error.response?.status === 403) {
    return 'Você não tem permissão para esta ação.';
  }

  if (error.response?.status === 404) {
    return 'Recurso não encontrado.';
  }

  return error.message || 'Ocorreu um erro. Tente novamente.';
};
```

---

## Suporte a TypeScript

Defina tipos para as respostas da API em `src/types/api.ts`:

```typescript
export interface UsuarioLogin {
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
}

export interface AuthResponse {
  usuario: UsuarioLogin;
  token: string;
}

export interface Video {
  id: number;
  titulo: string;
  descricao: string;
  autor: string;
  tipo: 'INTERNO' | 'YOUTUBE';
  status: 'PENDENTE' | 'ATIVO' | 'PROCESSANDO' | 'ERRO';
  miniatura?: string;
  caminhoArquivo?: string;
  urlOriginal?: string;
  categoria: { id: number; nome: string };
}

export interface ApiResponse<T> {
  sucesso: boolean;
  dados?: T;
  erro?: string;
}
```

---

## Dicas de Desenvolvimento

1. **Usar Redux/Zustand para estado global** (opcional, mas recomendado para aplicações maiores)
2. **Adicionar loading e skeleton screens** durante chamadas API
3. **Implementar React Query ou SWR** para cache e sincronização de dados
4. **Testar cada endpoint com Postman ou Insomnia** antes de integrar
5. **Usar React Context para autenticação** em vez de apenas localStorage
6. **Implementar refresh token** para melhor segurança

---

## Deploy

### Backend
```bash
# Build
cd backend
pnpm build

# Deploy (exemplo: Vercel, Railway, Heroku)
# Certifique-se de definir variáveis de ambiente corretas
```

### Frontend
```bash
# Build
pnpm build

# Deploy (exemplo: Vercel, Netlify)
# Atualize VITE_API_URL para a URL de produção do backend
```

---

## Suporte

Para dúvidas sobre a integração, verifique:
- [Documentação de Endpoints](./API.md)
- [Documentação do Backend](./README.md)
