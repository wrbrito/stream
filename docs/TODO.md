# CHECKLIST.md

## ✅ Fase 1: Estrutura e Arquitetura (CONCLUÍDA)
### Backend
- [x] Estrutura de diretórios completa
- [x] package.json com todas as dependências
- [x] tsconfig.json configurado
- [x] .env.example criado
- [x] Prisma schema com todas as entidades
- [x] Seed com dados iniciais

### Middlewares & Auth
- [x] Middleware de autenticação JWT
- [x] Middleware de autorização por perfil
- [x] Middleware de validação Zod
- [x] Middleware de tratamento de erros
- [x] Utilitários de JWT (gerarToken, verificarToken)

### Repositories
- [x] UsuarioRepository
- [x] CategoriaRepository
- [x] VideoRepository
- [x] ProcessamentoRepository

### Services
- [x] AuthService (login)
- [x] CategoriaService
- [x] VideoService (CRUD)
- [x] AdminService (dashboard)
- [x] ProcessamentoService (FFmpeg + ytdl-core)

### Controllers
- [x] AuthController (login, logout)
- [x] VideosController (CRUD completo)
- [x] CategoriasController (CRUD)
- [x] UsuariosController (listar)
- [x] AdminController (dashboard)

### Routes
- [x] /api/auth (login, logout)
- [x] /api/videos (CRUD + importar)
- [x] /api/categorias (CRUD)
- [x] /api/usuarios (listar)
- [x] /api/admin (dashboard)

### Documentação
- [x] API.md com todos os endpoints
- [x] ARQUITETURA.md com diagramas
- [x] INTEGRACAO.md para frontend
- [x] README.md do backend

## 📋 Fase 2: Próximos Passos (TODO)
### Instalação & Setup
- [ ] `pnpm install --filter backend`
- [ ] Copiar `.env.example` para `.env`
- [ ] Gerar banco: `pnpm --filter backend prisma migrate dev --name init`
- [ ] Rodar seed: `pnpm --filter backend seed`
- [ ] Iniciar dev server: `pnpm --filter backend dev`

### Frontend - Integração React
- [ ] Criar `src/services/api.ts` com cliente HTTP
- [ ] Atualizar `App.tsx` com chamadas reais de auth
- [ ] Integrar `Home.tsx` com GET `/videos`
- [ ] Integrar `UploadVideo.tsx` com POST `/videos`
- [ ] Integrar `AdminPanel.tsx` com GET `/admin/dashboard`
- [ ] Adicionar `src/types/api.ts` com tipos TypeScript
- [ ] Criar contexto de autenticação (opcional, mas recomendado)
- [ ] Implementar tratamento de erros padronizado

### Testes
- [ ] Escrever testes unitários (vitest)
- [ ] Testar cada endpoint com Postman/Thunder Client
- [ ] Validar fluxos de autenticação
- [ ] Testar upload de vídeo
- [ ] Testar importação do YouTube

### Melhorias & Otimização
- [ ] Implementar refresh token
- [ ] Adicionar rate limiting
- [ ] Implement pagináção melhorada
- [ ] Adicionar cache (Redis opcional)
- [ ] Implementar fila de processamento (Bull Queue opcional)
- [ ] Melhorar tratamento de erros com logs estruturados

### Deploy
- [ ] Configurar variáveis de produção
- [ ] Trocar SQLite por PostgreSQL
- [ ] Deploy backend (Vercel, Railway, Render, etc)
- [ ] Deploy frontend (Vercel, Netlify)
- [ ] Configurar CORS correto para produção
- [ ] Setup de CI/CD (GitHub Actions)

---

# PROXIMOS_PASSOS.md

## ✅ O QUE JÁ FOI IMPLEMENTADO (100% CONCLUÍDO)
### 🎓 Backend Completo
- **Estrutura completa** com 50+ arquivos
- **20+ endpoints REST** com autenticação JWT
- **Sistema de upload** com marca d'água automática (FFmpeg)
- **Integração YouTube** com ytdl-core
- **Admin dashboard** com estatísticas em tempo real
- **Banco de dados** com Prisma ORM (7 entidades)
- **Testes unitários** setup pronto
- **Documentação completa** (API.md, ARQUITETURA.md, etc)

### 🔐 Sistema de Autenticação
- Login/logout com JWT tokens
- 3 perfis de usuário (ADMIN, PROFESSOR, ALUNO)
- Middleware de autenticação e autorização
- Validação com Zod schemas

### 🎥 Gestão de Vídeos
- CRUD completo de vídeos
- Upload de arquivos .mp4
- Importação de URLs do YouTube
- Processamento automático com marca d'água
- Busca e filtro por categoria/título
- Paginação configurável

### 📊 Admin Panel
- Dashboard com estatísticas
- Gestão de usuários (listar)
- Gestão de categorias (CRUD)
- Gestão de vídeos (editar/deletar)
- Importação de YouTube para servidor

### 📚 Documentação
- [x] API.md - 20+ endpoints documentados
- [x] ARQUITETURA.md - Diagramas completos
- [x] INTEGRACAO.md - Guia frontend-backend
- [x] README-BACKEND.md - Resumo completo
- [x] QUICKSTART.md - Guia rápido 10 min
- [x] CHECKLIST.md - Checklist de implementação
- [x] ENTREGA.md - Resumo da entrega final

## 📋 SISTEMA DE RECOMENDAÇÃO (PARCIALMENTE CONCLUÍDO)
### ✅ Já Implementado
- [x] Tipos/DTOs em `backend/src/types/recommendation.types.ts`
- [x] `RecommendationRepository` otimizado (evita N+1)
- [x] Score híbrido em `RecommendationService`
- [x] Integração com `VideoDetail.tsx`
- [x] Índices no Prisma schema
- [x] Cache em memória

### ⏳ Pendente
- [ ] Preparar ganchos para embeddings/IA (sem implementar embeddings)

## 🔧 FRONTEND INTEGRAÇÃO (CONCLUÍDO)
### ✅ Já Implementado
- [x] `src/services/api.ts` - cliente HTTP pronto
- [x] `AuthContext.tsx` - auth provider completo com verificações de permissões
- [x] `ErrorContext.tsx` - tratamento de erros padronizado
- [x] `src/types/api.ts` - tipos TypeScript completos
- [x] Exemplo de integração em `Login.integrated.tsx`
- [x] Configuração de variáveis de ambiente
- [x] Integração completa com backend em todos os componentes principais

## 🎯 IMPLEMENTAÇÃO PLANEJADA (implementation_plan.md)
### ❌ NÃO IMPLEMENTADO AINDA
#### Backend - Alterações Pendentes
- [ ] Adicionar campo `fotoPerfil String?` em `model Usuario`
- [ ] Adicionar campo `parentId Int?` para respostas de comentários
- [ ] Criar `ProfileController.ts` com endpoints para:
  - Atualizar foto de perfil
  - Atualizar senha
  - Listar "Vídeos que avaliei"
  - Listar "Vídeos que comentei"
- [ ] Atualizar `ComentariosController.ts` para suportar respostas
- [ ] Atualizar `ConfiguracaoController.ts` para fornecer `LOGO_URL`, `NOME_SITE`

#### Frontend - Alterações Pendentes
- [ ] Expandir `AdminPanel.tsx` com:
  - Edição de foto, perfil, senha de usuários
  - Nova aba "Comentários" para admin editar/deletar
  - Formulário de configurações (logo, nome, marca d'água)
- [ ] Modificar `ProfilePage.tsx` com abas:
  - Dados Pessoais (foto, senha, nome)
  - Favoritos (mover da Home)
  - Minhas Avaliações
  - Meus Comentários
- [ ] Modificar `Home.tsx` - remover aba Favoritos
- [ ] Atualizar `Header.tsx` e `Footer.tsx` - consumir configurações globais
- [ ] Modificar `VideoDetail.tsx` - botão "Responder" para autores

## 🚨 PRIORIDADES E DECISÕES
### 🔥 ALTA PRIORIDADE (Conclusão essencial)
- [x] **Finalizar integração Frontend-Backend** ✅ COMPLETO
- [ ] Testar fluxo completo login → upload → visualização
- [x] Implementar sistema de comentários com respostas ✅ COMPLETO
- [x] Criar perfil do usuário completo ✅ COMPLETO

### 🎯 MÉDIA PRIORIDADE (Melhorias importantes)
4. **Sistema de configurações globais** ✅ COMPLETO
   - [x] Admin pode definir logo, nome do site, marca d'água
   - [x] Frontend consome essas configurações dinamicamente

5. **Admin panel comentários** ✅ COMPLETO
   - [x] Aba separada para moderar comentários
   - [x] Edição/exclusão por parte do admin

### 🔮 BAIXA PRIORIDADE (Otimizações futuras)
6. **Sistema de recomendação completo** 🔄 PARCIAL (90%)
   - [ ] Implementar embeddings/IA (quando pronto)
   - [ ] A/B testing de algoritmos

7. **Otimizações de performance**
   - [ ] Redis para cache distribuído
   - [ ] PostgreSQL em produção
   - [ ] Rate limiting

## 🎯 PRÓXIMOS PASSOS IMEDIATOS
### 1. Hoje (teste)
- Testar fluxo completo de autenticação e navegação
- Verificar se todas as integrações funcionam corretamente
- Corrigir eventuais bugs encontrados

### 2. Esta semana
- Implementar sistema de comentários com respostas
- Testar upload e visualização de vídeos
- Melhorar UX/UI se necessário

### 3. Próxima semana
- Implementar perfil do usuário completo
- Sistema de favoritos e avaliações
- Admin panel avançado

---

# TODO.md

# TODO - Sistema de Recomendação (arquitetura escalável)
- [x] Step 1: Criar tipos/DTOs em `backend/src/types/recommendation.types.ts`
- [x] Step 2: Refatorar `RecommendationRepository` para devolver dados agregados e evitar N+1
- [x] Step 3: Implementar score híbrido fiel + ranking + paginação em `RecommendationService`
- [x] Step 4: Atualizar `VideoDetail.tsx` para consumir `GET /api/recommendations/related/:videoId`
- [x] Step 6: Sugerir e implementar índices no `backend/prisma/schema.prisma` e rodar migração
- [ ] Step 7: Preparar ganchos para embeddings/IA (sem implementar embeddings)

---

# PENDENCIAS

- [ ] permitir admin escolher a quantidade de vídeos em destaque e a quantidade de vídeos relacionados - IMPLEMENTADO
- [x] os videos da lateral direita não estão funcionais, as previas (thumb) não estão aparecendo... - CORRIGIDO
- [ ] antes da importação do video é que deve ser feita a escolha da qualidade - IMPLEMENTADO
- [ ] em assistir video, no lado direito poderia ser exibido os icones/cards de videos relacionados - IMPLEMENTADO
- [ ] adicionar um "load" quando for fazer a importação do video para o servidor interno...
- [ ] opção de escolha de qualidade para o video que será importado para o servidor interno...
- [ ] o admin ao clicar em editar usuario, deve poder editar todos os dados do usuario
- [ ] o admin ao clicar em editar video, deve poder editar todos os dados do video
- [ ] o admin ao clicar em editar categoria, deve poder editar todos os dados da categoria
- [ ] o admin ao clicar em editar comentario, deve poder editar todos os dados do comentario
- [ ] o admin deve poder alterar qualquer coisa dentro da plataforma, inclusive a logomarca, e cores de sites...
- [ ] o perfil aluno não envia video, ele assiste, comenta, avalia, favorito e denuncia
- [ ] a pagina principal depois do login poderia ter uma paginação também
- [ ] os videos em destaques poderia ser os mais assistidos?
- [ ] o painel inicial lá no admin, poderia ser paginado...
- [ ] as notificações deve ser aberta em uma pagina, com links para videos que são denunciados...
- [ ] o admin deve poder escolher em que parte do video a marca d'agua sera inserida
- [ ] a busca só esta funcionando na tela inicial... é necessario um botão para fazer a busca em outras paginas
