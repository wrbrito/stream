# Tarefas de Implementacao (Stream)

- [ ] **Etapa 1: Backend - Banco de Dados (Prisma)**
  - [x] Atualizar `backend/prisma/schema.prisma` (adicionar `fotoPerfil` em `Usuario` e auto-relacionamento `parentId` em `Comentario`).
  - [x] Executar `npx prisma db push` e `npx prisma generate`.
  - [ ] Fazer commit e push (Mensagem: "Atualiza schema do banco para suportar foto de perfil e respostas em comentarios")

- [ ] **Etapa 2: Backend - API e Controllers**
  - [x] Atualizar `ComentariosController` e rotas para suportar `parentId`, permitindo autor do video responder.
  - [x] Atualizar ou criar `AdminController` para permitir CRUD de Comentarios, e atualizacao completa de Usuario, Categoria e Video.
  - [x] Criar rotas em `ProfileController` (ou `UsuariosController`) para Upload/Url de foto de perfil e troca de senha com confirmacao.
  - [x] Atualizar `ConfiguracaoController` para ter endpoint publico que liste `LOGO_URL` e `NOME_SITE` e outros.
  - [ ] Fazer commit e push (Mensagem: "Implementa controllers e rotas para perfil, comentarios, admin e configs globais")

- [ ] **Etapa 3: Frontend - Perfil do Usuario e Configuracoes Globais**
  - [x] Mover logica de favoritos da `Home` para `ProfilePage`.
  - [x] Adicionar abas na `ProfilePage` (Dados, Favoritos, Avaliados, Comentados) e suporte para enviar/salvar url da foto, alem da troca de senha com confirmacao.
  - [x] Buscar configs no React (Header, Footer, Head title) para customizar a logomarca e o nome do site.
  - [ ] Fazer commit e push (Mensagem: "Refatora pagina de Perfil e injeta configuracoes visuais dinamicas")

- [ ] **Etapa 4: Frontend - Admin Panel**
  - [x] Editar modal/pagina de edicao de `Usuarios` para permitir edicao de todos os campos.
  - [x] Criar aba de "Comentarios" para gerenciar todos os comentarios da plataforma.
  - [x] Ajustar edicao de `Videos` e `Categorias` para salvar todos os dados.
  - [x] Adicionar secao de "Configuracoes Globais" no Admin (Logo, Nome, Marca d'agua).
  - [ ] Fazer commit e push (Mensagem: "Implementa novas abas e edicoes completas no painel Admin")

- [ ] **Etapa 5: Frontend - VideoDetail e Comentarios**
  - [x] Aplicar a marca d'agua de forma dinamica no Player usando os dados do Admin.
  - [x] Implementar visualizacao das respostas nos comentarios.
  - [x] Habilitar botao "Responder" para o autor do video.
  - [x] Permitir Admin editar/excluir comentario direto pela tela de video.
  - [ ] Fazer commit e push (Mensagem: "Aprimora pagina de videos com marca d'agua dinamica e respostas aos comentarios")

## Verificacao executada

- [x] `npx prisma db push`
- [x] `npx prisma generate`
- [x] `npm run build` no backend
- [x] `npm test` no backend
- [x] `npm run build` no frontend

## Observacao

Os itens de commit/push continuam pendentes para evitar misturar alteracoes preexistentes do workspace, como `pendencias`, e os arquivos de planejamento que estavam sem rastreamento.
