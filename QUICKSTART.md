# ⚡ Quick Start - Plataforma escolar de Vídeos

Guia rápido para colocar o projeto rodando em 10 minutos.

---

## 1️⃣ Setup Backend (5 min)

```bash
# Terminal 1
cd stream/backend

# Instalar dependências
pnpm install

# Gerar banco de dados e dados de teste
pnpm prisma migrate dev --name init
pnpm seed

# Iniciar servidor
pnpm dev

# ✅ Pronto em: http://localhost:4000
```

**Testar login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@escola.local","senha":"Admin@2026"}'
```

---

## 2️⃣ Setup Frontend (3 min)

```bash
# Terminal 2 (na raiz)
cd stream

# Instalar (já foi feito, mas confirmar)
pnpm install

# Iniciar Vite
pnpm dev

# ✅ Pronto em: http://localhost:5173
```

---

## 3️⃣ Integrar React com Backend (2 min)

**Arquivo já existe em:** `src/services/api.ts`
- ✅ Cliente HTTP pronto
- ✅ Gerencia token JWT
- ✅ Métodos para auth, vídeos, categorias

**Usar no componente Login:**

```typescript
import { api } from '../services/api';

const handleLogin = async (email: string, senha: string) => {
  const { usuario, token } = await api.auth.login(email, senha);
  api.setToken(token);
  // Usuário autenticado!
};
```

---

## 🧪 Testar Fluxo Completo

### 1. Login
```
Abrir http://localhost:5173
Email: admin@escola.local
Senha: Admin@2026
Clicar "Entrar"
```

### 2. Ver Vídeos
```
Frontend GET /api/videos
Backend retorna lista
Exibir na Home
```

### 3. Upload de Vídeo
```
Clicar "Enviar Vídeo"
Preencher formulário
Selecionar arquivo .mp4
Clicar "Enviar"
```

### 4. Admin Dashboard
```
Clicar ícone de perfil (canto superior)
Ver estatísticas
Gerenciar categorias/usuários
```

---

## 📋 Checklist de Funcionalidades

Depois que está rodando, testar:

- [ ] Login com credenciais corretas e incorretas
- [ ] Listar categorias
- [ ] Listar vídeos
- [ ] Buscar vídeo por título
- [ ] Filtrar por categoria
- [ ] Upload de vídeo local
- [ ] Adicionar vídeo do YouTube
- [ ] Visualizar detalhes do vídeo
- [ ] Admin import YouTube → servidor
- [ ] Admin dashboard com estatísticas

---

## 📁 Arquivos Principais

### Backend
```
backend/
├── src/server.ts           ← Entry point
├── src/app.ts              ← Setup Express
├── src/routes/index.ts     ← Rotas principais
└── ...
```

### Frontend
```
src/
├── services/api.ts         ← Cliente HTTP ⭐
├── contexts/AuthContext.tsx ← Auth global ⭐
├── app/App.tsx             ← App principal
└── app/components/         ← Componentes
```

---

## 🔌 Endpoints para Testar

```bash
# Login
POST /api/auth/login
Body: {"email":"admin@escola.local","senha":"Admin@2026"}

# Listar vídeos
GET /api/videos
Header: Authorization: Bearer $TOKEN

# Listar categorias
GET /api/categorias
Header: Authorization: Bearer $TOKEN

# Criar vídeo (upload)
POST /api/videos
Header: Authorization: Bearer $TOKEN
Body: FormData {titulo, descricao, arquivo, etc}

# Dashboard admin
GET /api/admin/dashboard
Header: Authorization: Bearer $TOKEN
```

Use **Thunder Client** ou **Postman** para testar endpoints.

---

## 🐛 Troubleshooting

### Porta 4000 em uso?
```bash
# No .env do backend, mude
PORT=4001
```

### Erro "ffmpeg não encontrado"?
```bash
# Windows (Admin)
choco install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

### Erro "SQLITE_CANTOPEN"?
```bash
# Backend
rm backend/dev.db
pnpm prisma migrate dev --name init
pnpm seed
```

### Token expirado?
- Fazer login novamente
- Verificar JWT_EXPIRES_IN em .env

---

## 📚 Ler Depois

1. [README-BACKEND.md](./README-BACKEND.md) - Arquitetura completa
2. [backend/API.md](./backend/API.md) - Todos os endpoints
3. [INTEGRACAO.md](./INTEGRACAO.md) - Integração React detalhada
4. [ARQUITETURA.md](./ARQUITETURA.md) - Diagramas do sistema
5. [CHECKLIST.md](./CHECKLIST.md) - Próximas ações

---

## ✨ Dicas

- Usar **DevTools do navegador** para inspecionar requisições
- Terminal do backend mostra logs úteis (debug)
- Se falhar upload, verificar diretório `backend/storage/`
- Marca d'água é aplicada automaticamente em vídeos internos

---

**Pronto? Boa sorte! 🚀**
