# TODO - Sistema de Recomendação (arquitetura escalável)

- [x] Step 1: Criar tipos/DTOs em `backend/src/types/recommendation.types.ts`


- [x] Step 2: Refatorar `RecommendationRepository` para devolver dados agregados e evitar N+1
- [x] Step 3: Implementar score híbrido fiel + ranking + paginação em `RecommendationService`

- [ ] Step 4: Atualizar `VideoDetail.tsx` para consumir `GET /api/recommendations/related/:videoId`
- [ ] Step 5: Ajustar cliente/API no frontend (`src/services/api.ts`) se necessário
- [ ] Step 6: Sugerir e implementar índices no `backend/prisma/schema.prisma` e rodar migração
- [ ] Step 7: Preparar ganchos para embeddings/IA (sem implementar embeddings)

