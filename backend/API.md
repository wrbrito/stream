# Documentação da API Backend

Plataforma Escolar de Vídeos - API REST com autenticação JWT.

## Base URL

```
http://localhost:4000/api
```

## Autenticação

Todas as rotas (exceto login) requerem token JWT no header:

```
Authorization: Bearer seu_token_aqui
```

## Perfis de Usuário

- `ADMIN`: Acesso completo
- `PROFESSOR`: Pode criar categorias e vídeos
- `ALUNO`: Pode apenas listar e visualizar

---

## Endpoints

### Autenticação (`/auth`)

#### POST `/auth/login`
Realiza o login e retorna o token JWT.

**Request:**
```json
{
  "email": "admin@escola.local",
  "senha": "Admin@2026"
}
```

**Response (200):**
```json
{
  "sucesso": true,
  "dados": {
    "usuario": {
      "id": 1,
      "nome": "Administrador da Escola",
      "email": "admin@escola.local",
      "perfil": "ADMIN"
    },
    "token": "eyJhbGciOic..."
  }
}
```

#### POST `/auth/logout`
Realiza logout (puramente simbólico, o JWT continua válido até sua expiração).

---

### Vídeos (`/videos`)

#### GET `/videos`
Lista todos os vídeos com suporte a busca e paginação.

**Query Parameters:**
- `busca` (string): Busca no título, descrição ou autor
- `categoriaId` (number): Filtrar por categoria
- `pagina` (number): Número da página (padrão: 1)
- `limite` (number): Itens por página (padrão: 10)

**Response (200):**
```json
{
  "sucesso": true,
  "dados": {
    "videos": [
      {
        "id": 1,
        "titulo": "Introdução à Matemática Aplicada",
        "descricao": "Aula de matemática...",
        "autor": "Prof. João Silva",
        "tipo": "INTERNO",
        "status": "ATIVO",
        "miniatura": "/uploads/thumbnails/...",
        "categoriaId": 1,
        "uploaderId": 1,
        "criadoEm": "2026-05-02T10:20:30Z",
        "categoria": {
          "id": 1,
          "nome": "Aulas",
          "slug": "aulas"
        }
      }
    ],
    "total": 15
  }
}
```

#### GET `/videos/:id`
Obtém detalhes de um vídeo específico.

**Response (200):**
```json
{
  "sucesso": true,
  "dados": {
    "id": 1,
    "titulo": "Introdução à Matemática Aplicada",
    "descricao": "...",
    "autor": "Prof. João Silva",
    "tipo": "INTERNO",
    "status": "ATIVO",
    "caminhoArquivo": "/uploads/videos/video-1-123456.mp4",
    "miniatura": "/uploads/thumbnails/...",
    "categoria": { "id": 1, "nome": "Aulas" },
    "uploader": { "id": 1, "nome": "Admin", "email": "admin@escola.local" }
  }
}
```

#### POST `/videos`
Cria um novo vídeo (requer autenticação).

**Multipart Form Data:**
- `titulo` (string, obrigatório): Título do vídeo
- `descricao` (string, obrigatório): Descrição
- `autor` (string, obrigatório): Nome do autor
- `categoriaId` (number, obrigatório): ID da categoria
- `tipo` (string, obrigatório): `INTERNO` ou `YOUTUBE`
- `urlOriginal` (string): URL do YouTube (obrigatória se tipo é YOUTUBE)
- `arquivo` (file): Arquivo de vídeo (obrigatório se tipo é INTERNO)
- `miniatura` (file, opcional): Imagem miniatura

**Response (201):**
```json
{
  "sucesso": true,
  "dados": { "id": 2, "titulo": "...", "status": "PROCESSANDO" }
}
```

#### PUT `/videos/:id`
Atualiza um vídeo (requer ser ADMIN ou PROFESSOR).

**Request:**
```json
{
  "titulo": "Novo título",
  "status": "ATIVO"
}
```

**Response (200):**
```json
{
  "sucesso": true,
  "dados": { "id": 1, "titulo": "Novo título", ... }
}
```

#### DELETE `/videos/:id`
Deleta um vídeo (requer ser ADMIN).

**Response (204):** Sem conteúdo

#### POST `/videos/:id/importar`
Importa um vídeo do YouTube para servidor interno (requer ser ADMIN).

O vídeo será baixado, processado com marca d'água e salvo no servidor.

**Response (200):**
```json
{
  "sucesso": true,
  "dados": {
    "mensagem": "Importação iniciada. O vídeo será processado em breve."
  }
}
```

---

### Categorias (`/categorias`)

#### GET `/categorias`
Lista todas as categorias.

**Response (200):**
```json
{
  "sucesso": true,
  "dados": [
    { "id": 1, "nome": "Aulas", "slug": "aulas", "descricao": "..." },
    { "id": 2, "nome": "Eventos", "slug": "eventos", "descricao": "..." }
  ]
}
```

#### POST `/categorias`
Cria uma nova categoria (requer ser ADMIN ou PROFESSOR).

**Request:**
```json
{
  "nome": "Workshop",
  "descricao": "Descrição da categoria"
}
```

**Response (201):**
```json
{
  "sucesso": true,
  "dados": { "id": 7, "nome": "Workshop", "slug": "workshop" }
}
```

#### PUT `/categorias/:id`
Atualiza uma categoria (requer ser ADMIN ou PROFESSOR).

**Response (200):**
```json
{
  "sucesso": true,
  "dados": { "id": 1, "nome": "Aulas Atualizadas", ... }
}
```

#### DELETE `/categorias/:id`
Deleta uma categoria (requer ser ADMIN).

**Response (204):** Sem conteúdo

---

### Usuários (`/usuarios`)

#### GET `/usuarios`
Lista todos os usuários (requer ser ADMIN).

**Response (200):**
```json
{
  "sucesso": true,
  "dados": [
    {
      "id": 1,
      "nome": "Administrador da Escola",
      "email": "admin@escola.local",
      "perfil": "ADMIN",
      "ativo": true,
      "criadoEm": "2026-04-20T10:00:00Z"
    }
  ]
}
```

---

### Admin Dashboard (`/admin`)

#### GET `/admin/dashboard`
Obtém estatísticas do sistema (requer ser ADMIN).

**Response (200):**
```json
{
  "sucesso": true,
  "dados": {
    "totalUsuarios": 42,
    "total": 247,
    "internos": 150,
    "externos": 97,
    "pendentes": 8
  }
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Valor inválido na requisição |
| 401 | E-mail/senha inválidos ou token expirado |
| 403 | Permissão insuficiente |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

---

## Fluxo de Uso Típico

### 1. Login
```bash
POST /api/auth/login
```

### 2. Criar Vídeo do YouTube
```bash
POST /api/videos
- tipo: YOUTUBE
- urlOriginal: https://www.youtube.com/watch?v=...
```

### 3. Admin Importa para Servidor (Aplicar Marca d'Água)
```bash
POST /api/videos/:id/importar
```

### 4. Usuário visualiza vídeo
```bash
GET /api/videos/:id
- tipo agora é INTERNO
- status é ATIVO
- caminhoArquivo contém a URL do arquivo processado
```

---

## Variáveis de Ambiente

```env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=1h
UPLOAD_DIRECTORY=./storage
APP_URL=http://localhost:4000
WATERMARK_TEXT=Plataforma Escolar
```

---

## Exemplo com cURL

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.local",
    "senha": "Admin@2026"
  }'
```

### Listar Vídeos
```bash
curl -X GET http://localhost:4000/api/videos?pagina=1&limite=10 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar Vídeo com Upload
```bash
curl -X POST http://localhost:4000/api/videos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "titulo=Meu Vídeo" \
  -F "descricao=Descrição do vídeo" \
  -F "autor=Prof. João" \
  -F "categoriaId=1" \
  -F "tipo=INTERNO" \
  -F "arquivo=@video.mp4"
```

---

## Notas

- A marca d'água é aplicada automaticamente a vídeos internos
- Vídeos do YouTube são salvos como links externos até que um admin execute a importação
- O processamento de vídeo ocorre de forma assíncrona
- Limpe arquivos processados periodicamente do diretório `./storage`
