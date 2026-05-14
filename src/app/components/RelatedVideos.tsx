import { Eye, Video as VideoIcon } from 'lucide-react';

export function RelatedVideos({
  relatedVideos,
  onVideoClick,
  obterThumbnailUrl,
  contarVisualizacoes,
  usuario
}: any) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm sticky top-24 space-y-6">
      <div>
        <h3 className="font-medium text-foreground mb-3">Vídeos Relacionados</h3>
        {relatedVideos.length > 0 ? (
          <div className="space-y-3">
            {relatedVideos.map((relatedVideo: any) => {
              const relatedId = Number(relatedVideo.id);
              if (!Number.isFinite(relatedId)) return null;

              return (
                <div
                  key={relatedId}
                  className="group cursor-pointer border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                  onClick={() => {
                    if (onVideoClick) onVideoClick(relatedId);
                  }}
                >
                  <div className="aspect-video bg-muted relative">
                    {(() => {
                      const thumbnailUrl = obterThumbnailUrl(relatedVideo);
                      return thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={relatedVideo.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <VideoIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      );
                    })()}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                      {relatedVideo.titulo}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {relatedVideo.autor}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {contarVisualizacoes(relatedVideo.visualizacoes)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum vídeo relacionado encontrado.
          </p>
        )}
      </div>
      {usuario?.perfil === 'ADMIN' && (
        <div className="border-t border-border pt-4">
          <h4 className="font-medium text-foreground mb-2 text-sm">Link Direto</h4>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Compartilhe este link com qualquer pessoa:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 text-xs px-2 py-1 rounded border border-border bg-input-background"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copiado!');
                }}
                className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded font-medium hover:bg-primary/90"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
