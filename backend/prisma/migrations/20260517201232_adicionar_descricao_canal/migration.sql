-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'ALUNO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "podeComentar" BOOLEAN NOT NULL DEFAULT true,
    "fotoPerfil" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canalPublico" BOOLEAN NOT NULL DEFAULT true,
    "descricaoCanal" TEXT
);
INSERT INTO "new_Usuario" ("ativo", "criadoEm", "email", "fotoPerfil", "id", "nome", "perfil", "podeComentar", "senha") SELECT "ativo", "criadoEm", "email", "fotoPerfil", "id", "nome", "perfil", "podeComentar", "senha" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "Favorito_usuarioId_criadoEm_idx" ON "Favorito"("usuarioId", "criadoEm");

-- CreateIndex
CREATE INDEX "Video_status_categoriaId_idx" ON "Video"("status", "categoriaId");

-- CreateIndex
CREATE INDEX "Video_criadoEm_idx" ON "Video"("criadoEm");

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- CreateIndex
CREATE INDEX "Visualizacao_data_videoId_idx" ON "Visualizacao"("data", "videoId");

-- CreateIndex
CREATE INDEX "Visualizacao_videoId_data_idx" ON "Visualizacao"("videoId", "data");
