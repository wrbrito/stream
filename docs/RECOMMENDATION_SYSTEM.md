# Sistema de Recomendação de Vídeos - Documentação Técnica

## Visão Geral

O sistema de recomendação implementado é uma solução híbrida baseada em regras que combina múltiplas dimensões de afinidade do usuário para fornecer recomendações personalizadas de vídeos. O sistema foi projetado para ser escalável, começando simples mas preparado para evoluir para machine learning no futuro.

## Arquitetura

### Componentes Principais

1. **RecommendationController** - Controla as requisições HTTP e validação
2. **RecommendationService** - Contém a lógica de negócio e cálculo de scores
3. **RecommendationRepository** - Acesso otimizado aos dados no banco
4. **Cache** - Sistema de cache em memória para performance

### Fluxo de Dados

```
Requisição HTTP → Controller → Service → Repository → Banco de Dados
                      ↓
Cache ←───────────────┘
```

## Algoritmo de Score Híbrido

### Fórmula Base

```javascript
score = 0.35 * tags + 0.25 * categoria + 0.20 * popularidade + 0.10 * recência + 0.10 * interesse_usuario
```

### Componentes do Score

#### 1. Tags (35%)
- Similaridade baseada na interseção de tags entre histórico do usuário e vídeo
- Normalizado pelo número de tags do vídeo
- Tags favoritas recebem peso extra

#### 2. Categoria (25%)
- Contagem de visualizações do usuário na categoria
- Normalizado por faixa (0-50 visualizações)
- Vídeos na mesma categoria recebem bônus

#### 3. Popularidade (20%)
- Combinação de visualizações (70%) e likes (30%)
- Normalizado por faixas típicas (0-1000 views, 0-200 likes)
- Reflete engajamento geral do vídeo

#### 4. Recência (10%)
- Bônus para vídeos mais recentes
- Decai exponencialmente até 30 dias
- Incentiva descoberta de conteúdo novo

#### 5. Interesse do Usuário (10%)
- Baseado em tempo assistido por categoria/tag
- Normalizado por tempo total (0-5000 segundos)
- Reflete profundidade de interesse

## Estratégias de Ranking

### Vídeos Recomendados
- Personalizados por usuário
- Exclui vídeos já assistidos
- Ordena por score híbrido decrescente

### Vídeos Relacionados
- Baseados no vídeo atual (categoria + tags)
- Score simplificado (sem afinidade pessoal)
- Foco em similaridade de conteúdo

### Vídeos em Alta
- Baseados em atividade recente (últimos 7 dias)
- Combinação de popularidade + recência + retenção
- Atualização frequente via cache

## Otimizações de Performance

### Cache
- Cache em memória com TTL configurável
- Chaves específicas por usuário/página/limite
- Reduz carga no banco de dados

### Índices SQL
```sql
-- Vídeos
INDEX: (status, categoriaId) - Para relacionados
INDEX: (status, criadoEm) - Para recência
INDEX: (status) - Para filtrar ativos

-- Visualizações
INDEX: (data, videoId) - Para trending por período
INDEX: (videoId, data) - Para agregações por vídeo
INDEX: (usuarioId, data) - Para histórico do usuário

-- Favoritos
INDEX: (usuarioId, criadoEm) - Para afinidade por usuário
```

### Queries Otimizadas
- Limitação de resultados no banco
- Agregações parciais para evitar N+1
- Uso de índices compostos para filtros complexos

## Escalabilidade

### Para Milhares de Vídeos

#### 1. Cache Distribuído
- Redis/Memcached para cache compartilhado
- Invalidação inteligente de cache
- Cache warming para conteúdo popular

#### 2. Banco de Dados
- Particionamento por data/status
- Read replicas para queries de recomendação
- Índices otimizados para queries analíticas

#### 3. Processamento Assíncrono
- Jobs em background para cálculo de afinidades
- Pre-computação de scores para usuários ativos
- Cache de afinidades do usuário

### Para Dezenas de Milhares

#### 4. Arquitetura de Microserviços
```
┌─────────────────┐    ┌──────────────────┐
│   API Gateway   │────│ Recommendation   │
│                 │    │   Service        │
└─────────────────┘    └──────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌───▼───┐
            │  ML Model │ │ Cache │ │  DB   │
            │  Service  │ │ Redis │ │  ES   │
            └───────────┘ └───────┘ └───────┘
```

#### 5. Machine Learning
- Elasticsearch para busca semântica
- Embeddings de conteúdo (vídeos + usuários)
- Modelos de recomendação colaborativa
- A/B testing para algoritmos

## Evolução para IA/ML

### Fase 1: Features Engineering
- Coletar mais dados (tempo de sessão, cliques, etc.)
- Implementar tracking detalhado
- Criar pipeline de dados para analytics

### Fase 2: Recomendação Colaborativa
- Matrix factorization (SVD, ALS)
- User-item similarity
- Cold start handling

### Fase 3: Content-Based + Deep Learning
- Embeddings de vídeo (CNN para thumbnails, NLP para títulos/descrições)
- User embeddings baseados em histórico
- Two-tower architecture

### Fase 4: Sistema Híbrido Avançado
- Ensemble de múltiplos modelos
- Reinforcement learning para otimização
- Personalização em tempo real

## Monitoramento e Métricas

### KPIs Principais
- CTR (Click-through rate) das recomendações
- Tempo assistido de vídeos recomendados
- Diversidade do catálogo descoberto
- Satisfação do usuário (avaliações)

### Métricas Técnicas
- Latência de resposta das APIs
- Hit rate do cache
- Throughput do banco de dados
- Precisão do modelo (quando ML)

## Considerações de Segurança

- Rate limiting para evitar abuso
- Validação de entrada em todos os endpoints
- Sanitização de dados do usuário
- Logs de auditoria para recomendações suspeitas

## Conclusão

O sistema implementado fornece uma base sólida para recomendações, começando com regras heurísticas eficientes e preparado para evolução gradual para machine learning. A arquitetura modular permite iterações rápidas e testes de novos algoritmos sem impactar a produção.