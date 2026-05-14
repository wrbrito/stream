import { Settings } from 'lucide-react';
import { Button } from '../Button';

export function AdminSettings({ ctx }: { ctx: any }) {
  const {
    usuarios,
    categorias,
    isSavingConfigs,
    localSiteName,
    setLocalSiteName,
    localLogoUrl,
    setLocalLogoUrl,
    localWatermarkText,
    setLocalWatermarkText,
    localWatermarkPosition,
    setLocalWatermarkPosition,
    localShowCategories,
    setLocalShowCategories,
    localShowFooter,
    setLocalShowFooter,
    localSupportEmail,
    setLocalSupportEmail,
    localFooterGestor,
    setLocalFooterGestor,
    localFooterGestorEmail,
    setLocalFooterGestorEmail,
    localFooterAutor,
    setLocalFooterAutor,
    localFooterAutorEmail,
    setLocalFooterAutorEmail,
    localFeaturedCount,
    setLocalFeaturedCount,
    localRelatedCount,
    setLocalRelatedCount,
    localAtivarRecomendados,
    setLocalAtivarRecomendados,
    localQtdVideosRecomendados,
    setLocalQtdVideosRecomendados,
    localAtivarEmAlta,
    setLocalAtivarEmAlta,
    localQtdVideosEmAlta,
    setLocalQtdVideosEmAlta,
    salvarConfiguracoes
  } = ctx;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    salvarConfiguracoes({
      NOME_SITE: localSiteName,
      LOGO_URL: localLogoUrl,
      WATERMARK_TEXT: localWatermarkText,
      WATERMARK_POSITION: localWatermarkPosition,
      MARCA_DAGUA_TEXTO: localWatermarkText,
      MARCA_DAGUA_POSICAO: localWatermarkPosition,
      EXIBIR_CATEGORIAS: localShowCategories ? 'true' : 'false',
      EXIBIR_RODAPE: localShowFooter ? 'true' : 'false',
      SUPORTE_EMAIL: localSupportEmail,
      RODAPE_GESTOR_NOME: localFooterGestor,
      RODAPE_GESTOR_EMAIL: localFooterGestorEmail,
      RODAPE_ESCRITO_POR: localFooterAutor,
      RODAPE_ESCRITO_POR_EMAIL: localFooterAutorEmail,
      QTD_VIDEOS_DESTAQUE: String(localFeaturedCount),
      QTD_VIDEOS_RELACIONADOS: String(localRelatedCount),
      ATIVAR_RECOMENDADOS: localAtivarRecomendados ? 'true' : 'false',
      QTD_VIDEOS_RECOMENDADOS: String(localQtdVideosRecomendados),
      ATIVAR_EM_ALTA: localAtivarEmAlta ? 'true' : 'false',
      QTD_VIDEOS_EM_ALTA: String(localQtdVideosEmAlta),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Configurações da Marca D'água
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Defina o texto e a posição padrão da marca d'água aplicada aos vídeos durante o processamento.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Nome do site</label>
            <input
              type="text"
              value={localSiteName}
              onChange={(e) => setLocalSiteName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Ex: Vídeos Escola"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">URL da logomarca</label>
            <input
              type="text"
              value={localLogoUrl}
              onChange={(e) => setLocalLogoUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="https://... ou /uploads/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Texto da Marca D'água</label>
            <input
              type="text"
              value={localWatermarkText}
              onChange={(e) => setLocalWatermarkText(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Ex: Minha Escola"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Posição Padrão</label>
            <select
              value={localWatermarkPosition}
              onChange={(e) => setLocalWatermarkPosition(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="TOP_LEFT">Topo esquerdo</option>
              <option value="TOP_RIGHT">Topo direito</option>
              <option value="BOTTOM_LEFT">Inferior esquerdo</option>
              <option value="BOTTOM_RIGHT">Inferior direito</option>
              <option value="CENTER">Centro</option>
            </select>
          </div>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Informações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">URL da API</p>
            <p className="font-medium">http://localhost:4000/api</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">CORS Permitido</p>
            <p className="font-medium">http://localhost:5173</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">Usuários Ativos</p>
            <p className="font-medium">{usuarios.filter((u: any) => u.ativo).length}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">Total de Categorias</p>
            <p className="font-medium">{categorias.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Configurações de Página e Recomendações
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Controle a visibilidade de categorias, rodapé, informações de contato e o sistema de recomendações.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground border-b border-border pb-2">Layout e Exibição</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localShowCategories}
                  onChange={(e) => setLocalShowCategories(e.target.checked)}
                  className="w-5 h-5 rounded border-border cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground">Exibir categorias na página inicial</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localShowFooter}
                  onChange={(e) => setLocalShowFooter(e.target.checked)}
                  className="w-5 h-5 rounded border-border cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground">Exibir rodapé</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Quantidade de vídeos em destaque</label>
                <input
                  type="number"
                  min={0}
                  value={localFeaturedCount}
                  onChange={(e) => setLocalFeaturedCount(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Quantidade de vídeos relacionados</label>
                <input
                  type="number"
                  min={0}
                  value={localRelatedCount}
                  onChange={(e) => setLocalRelatedCount(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="4"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground border-b border-border pb-2">Sistema de Recomendações</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-medium text-foreground">Ativar Vídeos Recomendados</h5>
                  <p className="text-xs text-muted-foreground">Vídeos personalizados para o usuário</p>
                </div>
                <input
                  type="checkbox"
                  checked={localAtivarRecomendados}
                  onChange={(e) => setLocalAtivarRecomendados(e.target.checked)}
                  className="w-5 h-5 rounded border-border cursor-pointer"
                />
              </div>

              {localAtivarRecomendados && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Quantidade de recomendados</label>
                  <input
                    type="number"
                    min={1}
                    value={localQtdVideosRecomendados}
                    onChange={(e) => setLocalQtdVideosRecomendados(Number(e.target.value) || 10)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h5 className="text-sm font-medium text-foreground">Ativar Vídeos em Alta</h5>
                  <p className="text-xs text-muted-foreground">Vídeos mais populares da plataforma</p>
                </div>
                <input
                  type="checkbox"
                  checked={localAtivarEmAlta}
                  onChange={(e) => setLocalAtivarEmAlta(e.target.checked)}
                  className="w-5 h-5 rounded border-border cursor-pointer"
                />
              </div>

              {localAtivarEmAlta && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Quantidade de vídeos em alta</label>
                  <input
                    type="number"
                    min={1}
                    value={localQtdVideosEmAlta}
                    onChange={(e) => setLocalQtdVideosEmAlta(Number(e.target.value) || 10)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground border-b border-border pb-2">Informações de Contato</h4>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Email de Suporte</label>
              <input
                type="email"
                value={localSupportEmail}
                onChange={(e) => setLocalSupportEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="suporte@seusite.com.br"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Gestor - Nome</label>
                <input
                  type="text"
                  value={localFooterGestor}
                  onChange={(e) => setLocalFooterGestor(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Gestor - Email</label>
                <input
                  type="email"
                  value={localFooterGestorEmail}
                  onChange={(e) => setLocalFooterGestorEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Desenvolvedor - Nome</label>
                <input
                  type="text"
                  value={localFooterAutor}
                  onChange={(e) => setLocalFooterAutor(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Desenvolvedor - Email</label>
                <input
                  type="email"
                  value={localFooterAutorEmail}
                  onChange={(e) => setLocalFooterAutorEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button type="submit" disabled={isSavingConfigs} className="w-full md:w-auto">
              {isSavingConfigs ? 'Salvando...' : 'Salvar todas as alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
