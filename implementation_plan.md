# Plano de Implementação

Este plano visa resolver todas as pendências relatadas referentes a gestão de usuários, vídeos, categorias e comentários pelo painel do Admin, além de melhorias significativas no perfil do usuário, no gerenciamento da marca d'água, logo, nome do site e respostas de comentários pelo autor.

## User Review Required

> [!IMPORTANT]
> **Aprovação Necessária**
> Como haverá alteração no esquema de banco de dados e rotas da API, por favor verifique os pontos propostos abaixo. Ao aprovar, executarei as modificações nos arquivos passo a passo. Lembre-se que as senhas precisam de validação extra ao serem alteradas pelo Perfil.

## Open Questions

> [!TIP]
> 1. Para a foto de perfil do usuário, você prefere que o upload de imagem seja salvo como arquivo (localmente em `/uploads/fotos`) ou quer apenas adicionar uma URL externa (avatar genérico)? Para simplificar, faremos um upload real no servidor na pasta de `storage/fotos`.
> 2. O Admin poderá gerenciar os comentários de todos os vídeos num painel centralizado na aba de "Comentários", ou você quer que ele edite/exclua os comentários através da página individual do vídeo? Faremos uma aba própria de Comentários no Admin, por ser mais organizado.

## Proposed Changes

---

### Backend (Prisma & API)

#### [MODIFY] backend/prisma/schema.prisma
- Adicionar o campo `fotoPerfil String?` em `model Usuario`.
- Adicionar o campo `parentId Int?` e `@relation("Respostas", fields: [parentId], references: [id])` em `model Comentario`, permitindo a criação de Respostas de Comentários.
- Adicionar os campos na tabela de banco.

#### [MODIFY] backend/src/controllers/AdminController.ts (e Rotas)
- Criar a listagem de todos os comentários no painel administrativo.
- Atualizar endpoint para permitir que o Admin exclua/atualize comentários de terceiros.
- Criar ou atualizar endpoints para edição completa (senha e foto de perfil) dos usuários através do Painel Admin.

#### [NEW] backend/src/controllers/ProfileController.ts
- Endpoints específicos para o Perfil:
  - Atualizar foto de perfil (recebendo multipart/form-data).
  - Atualizar senha.
  - Listar "Vídeos que avaliei", "Vídeos que comentei".

#### [MODIFY] backend/src/controllers/ComentariosController.ts
- Ajustar endpoint de listar e criar comentários para suportar respostas.
- Adicionar validação para que apenas o `autor` do vídeo correspondente possa adicionar uma resposta a um comentário específico.

#### [MODIFY] backend/src/controllers/ConfiguracaoController.ts
- Disponibilizar `LOGO_URL`, `NOME_SITE` num endpoint aberto/público, para que a interface consiga ler e usar no Header e Footer.

---

### Frontend (React & Componentes)

#### [MODIFY] src/app/components/AdminPanel.tsx
- **Usuários**: Expandir a edição para mudar foto, perfil, senha e status de comentário.
- **Vídeos**: Refinar o formulário de edição atual para assegurar todos os campos e incluir edição completa de metadados.
- **Categorias**: A edição já existe, mas validaremos todos os campos.
- **Comentários**: Nova aba/menu lateral "Comentários" para que o admin edite ou delete comentários ofensivos.
- **Configurações (Settings)**: Formulário para o admin atualizar `NOME_SITE`, fazer upload da logomarca (`LOGO_URL`), cor primária do sistema, definir texto e posição da marca d'água (`MARCA_DAGUA_TEXTO`, `MARCA_DAGUA_POSICAO`).

#### [MODIFY] src/app/components/ProfilePage.tsx
- Adicionar seções de abas (Tabs): 
  - **Dados Pessoais**: Mudar foto de perfil, senha, nome.
  - **Favoritos**: Mover a listagem de vídeos favoritados da página principal (`Home.tsx`) para cá.
  - **Minhas Avaliações**: Listar os vídeos avaliados pelo usuário.
  - **Meus Comentários**: Listar os vídeos comentados pelo usuário.

#### [MODIFY] src/app/components/Home.tsx
- Remover a aba e lógica de exibição de **Favoritos**, deixando a home mais limpa (exibindo apenas Recentes e em Alta/Recomendados).

#### [MODIFY] src/app/components/Header.tsx & src/app/components/Footer.tsx
- Consumir o endpoint global de `Configuracoes` (no contexto de Auth ou ConfigContext a ser criado) para exibir o nome do site (ex: não usar mais "StreamEscola" fixo no footer) e renderizar a logomarca correta.

#### [MODIFY] src/app/components/VideoDetail.tsx
- **Respostas**: Na área de comentários, se o `usuario.id === video.uploaderId`, habilitar o botão "Responder" em cada comentário.
- **Marca d'água**: Puxar a posição e o texto das configurações globais e fixá-la sobre o reprodutor de vídeo dinamicamente.

## Verification Plan

### Automated Tests
- N/A para essa fase.

### Manual Verification
1. **Banco de Dados**: Após alterar o `schema.prisma`, rodar `npx prisma db push` e verificar integridade dos dados existentes.
2. **Perfil**: Fazer login como aluno, acessar Perfil, fazer upload de foto, favoritar vídeo, ir em perfil e checar a lista de favoritos.
3. **Respostas**: Logar como autor de um vídeo. Receber comentário de aluno, e tentar responder usando o botão. Validar se a rota protege contra outras pessoas respondendo.
4. **Admin**: Logar como Admin, acessar a aba de configurações, mudar LOGO e NOME. Reiniciar página (f5) e confirmar se Header e Footer alteraram de acordo. Alterar comentários e senhas de usuários pela aba Admin e confirmar efetivação.
