# Backend da Plataforma Escolar de Vídeos

Este backend foi criado para integrar com o frontend Vite React já existente.

## Como executar

1. Instale as dependências:

```bash
pnpm install --filter backend
```

2. Configure as variáveis de ambiente usando `.env.example`.

3. Gere o banco de dados e rode o seed:

```bash
pnpm --filter backend prisma migrate dev --name init
pnpm --filter backend pnpm --filter backend seed
```

4. Inicie em modo de desenvolvimento:

```bash
pnpm --filter backend dev
```

## Rotas principais

- `POST /auth/login`
- `POST /auth/logout`
- `GET /usuarios`
- `GET /videos`
- `POST /videos`
- `GET /videos/:id`
- `PUT /videos/:id`
- `DELETE /videos/:id`
- `POST /videos/:id/importar`
- `GET /categorias`
- `POST /categorias`
- `PUT /categorias/:id`
- `DELETE /categorias/:id`
- `GET /admin/dashboard`

## Notas

- O backend usa Prisma com SQLite para desenvolvimento rápido e portátil.
- A importação de vídeos do YouTube utiliza `ytdl-core` e o processamento de mídia é preparado via `ffmpeg`.
- A autenticação usa JWT, com permissões de `admin`, `professor` e `aluno`.
