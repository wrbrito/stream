-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "fotoPerfil" TEXT;

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TagToVideo" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TagToVideo_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TagToVideo_B_fkey" FOREIGN KEY ("B") REFERENCES "Video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Processamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "mensagem" TEXT,
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "iniciadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" DATETIME,
    CONSTRAINT "Processamento_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Processamento" ("finalizadoEm", "id", "iniciadoEm", "mensagem", "status", "videoId") SELECT "finalizadoEm", "id", "iniciadoEm", "mensagem", "status", "videoId" FROM "Processamento";
DROP TABLE "Processamento";
ALTER TABLE "new_Processamento" RENAME TO "Processamento";
CREATE UNIQUE INDEX "Processamento_videoId_key" ON "Processamento"("videoId");
CREATE TABLE "new_Visualizacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER,
    "videoId" INTEGER NOT NULL,
    "tempoAssistido" INTEGER NOT NULL DEFAULT 0,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visualizacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Visualizacao_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Visualizacao" ("data", "id", "usuarioId", "videoId") SELECT "data", "id", "usuarioId", "videoId" FROM "Visualizacao";
DROP TABLE "Visualizacao";
ALTER TABLE "new_Visualizacao" RENAME TO "Visualizacao";
CREATE INDEX "Visualizacao_usuarioId_idx" ON "Visualizacao"("usuarioId");
CREATE INDEX "Visualizacao_data_idx" ON "Visualizacao"("data");
CREATE TABLE "new_Comentario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "texto" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comentario_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comentario_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comentario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comentario" ("criadoEm", "id", "texto", "usuarioId", "videoId") SELECT "criadoEm", "id", "texto", "usuarioId", "videoId" FROM "Comentario";
DROP TABLE "Comentario";
ALTER TABLE "new_Comentario" RENAME TO "Comentario";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Tag_nome_key" ON "Tag"("nome");

-- CreateIndex
CREATE INDEX "Tag_nome_idx" ON "Tag"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToVideo_AB_unique" ON "_TagToVideo"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToVideo_B_index" ON "_TagToVideo"("B");

-- CreateIndex
CREATE INDEX "Video_categoriaId_idx" ON "Video"("categoriaId");

-- CreateIndex
CREATE INDEX "Video_status_criadoEm_idx" ON "Video"("status", "criadoEm");
