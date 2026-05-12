CREATE INDEX "Visualizacao_videoId_idx" ON "Visualizacao"("videoId");
CREATE INDEX "Visualizacao_usuarioId_videoId_idx" ON "Visualizacao"("usuarioId", "videoId");
CREATE INDEX "Visualizacao_usuarioId_data_idx" ON "Visualizacao"("usuarioId", "data");
CREATE INDEX "Favorito_videoId_idx" ON "Favorito"("videoId");
CREATE INDEX "Favorito_criadoEm_idx" ON "Favorito"("criadoEm");
