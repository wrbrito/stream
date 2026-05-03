
# 🎓 Plataforma de Vídeos Escolar

Uma plataforma completa de vídeos com frontend em React/TypeScript e backend em Node.js/Express.

**Design original**: https://www.figma.com/design/ZGitG6JLmnuGW9Ai0PZDnB/Plataforma-de-V%C3%ADdeos-Escolar

---

## 📦 Estrutura do Projeto

Este é um **monorepo com pnpm workspaces** contendo:

- **Frontend**: React + Vite + TypeScript + Tailwind (em `src/`)
- **Backend**: Node.js + Express + TypeScript + Prisma (em `backend/`)

---

## 🚀 Como Executar

### 1. Instalar dependências de ambos

```bash
pnpm install
```

### 2. Iniciar Backend

```bash
pnpm --filter backend dev
# Servidor em http://localhost:4000
```

### 3. Iniciar Frontend (novo terminal)

```bash
pnpm dev
# Aplicação em http://localhost:5173
```

---

## 📚 Documentação

### Para o Backend
- **[README-BACKEND.md](./README-BACKEND.md)** - Resumo completo do que foi entregue
- **[backend/API.md](./backend/API.md)** - Documentação de todos os 20+ endpoints
- **[ARQUITETURA.md](./ARQUITETURA.md)** - Diagramas e estrutura do sistema
- **[INTEGRACAO.md](./INTEGRACAO.md)** - Como integrar Frontend com Backend

### Para o Frontend
- Componentes em `src/app/components/`
- Styles em `src/styles/`
- UI components em `src/app/components/ui/`

---

## 🎯 Dados de Teste

**Admin padrão (criado automaticamente):**
- Email: `admin@escola.local`
- Senha: `Admin@2026`

---

## 📋 Próximos Passos

1. Ler [README-BACKEND.md](./README-BACKEND.md) para entender a arquitetura
2. Seguir [INTEGRACAO.md](./INTEGRACAO.md) para conectar React com backend
3. Testar cada endpoint segundo [API.md](./backend/API.md)
4. Verificar [CHECKLIST.md](./CHECKLIST.md) para tarefas pendentes

---

## 🛠️ Stack Técnico

**Frontend:**
- React 18.3, Vite, TypeScript, Tailwind CSS, Radix UI

**Backend:**
- Node.js, Express, TypeScript, Prisma ORM, SQLite, JWT, FFmpeg

---

## ❓ Precisa de Ajuda?

Consulte a documentação específica:
- Estrutura: [ARQUITETURA.md](./ARQUITETURA.md)
- Endpoints: [backend/API.md](./backend/API.md)
- Setup: [README-BACKEND.md](./README-BACKEND.md)
- Integração: [INTEGRACAO.md](./INTEGRACAO.md)
  