import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { Button } from './Button';

export function VideoComments({
  comentarios,
  usuario,
  video,
  comentarioTexto,
  setComentarioTexto,
  handleEnviarComentario,
  enviandoComentario,
  handleEditarComentario,
  handleExcluirComentario,
  respondendoId,
  setRespondendoId,
  respostaTexto,
  setRespostaTexto,
  handleEnviarResposta,
  onChannelClick
}: any) {
  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Comentários ({comentarios.length})
      </h3>

      <form onSubmit={handleEnviarComentario} className="mb-8">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
            {usuario ? usuario.nome[0] : '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={comentarioTexto}
              onChange={(e) => setComentarioTexto(e.target.value)}
              placeholder={usuario ? "Escreva um comentário..." : "Faça login para comentar"}
              disabled={!usuario}
              className="w-full bg-input-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={enviandoComentario || !comentarioTexto.trim() || !usuario}>
                <Send className="w-4 h-4" />
                {enviandoComentario ? 'Enviando...' : 'Comentar'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-6">
        {comentarios.map((comentario: any) => (
          <div key={comentario.id} className="flex gap-4 group">
            <div
              onClick={() => onChannelClick?.(comentario.usuarioId)}
              className={`w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold shrink-0 ${
                onChannelClick ? 'cursor-pointer hover:bg-muted/80 transition-colors' : ''
              }`}
            >
              {comentario.usuario.nome[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onChannelClick?.(comentario.usuarioId)}
                    className={`font-semibold text-sm ${
                      onChannelClick ? 'cursor-pointer hover:text-primary hover:underline transition-colors' : ''
                    }`}
                  >
                    {comentario.usuario.nome}
                  </span>
                  {comentario.usuario.perfil === 'ADMIN' && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(comentario.criadoEm).toLocaleDateString()}
                  </span>
                </div>
                {(usuario?.perfil === 'ADMIN' || usuario?.id === comentario.usuarioId) && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditarComentario(comentario.id, comentario.texto)}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluirComentario(comentario.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Excluir comentário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {comentario.texto}
              </p>
              {usuario?.id === (video.uploaderId ?? video.uploader?.id) && (
                <div className="mt-2">
                  <button
                    onClick={() => setRespondendoId(respondendoId === comentario.id ? null : comentario.id)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Responder
                  </button>
                </div>
              )}
              {respondendoId === comentario.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={respostaTexto[comentario.id] ?? ''}
                    onChange={(e) => setRespostaTexto((prev: any) => ({ ...prev, [comentario.id]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-input-background text-sm"
                    placeholder="Resposta do autor"
                  />
                  <Button size="sm" onClick={() => handleEnviarResposta(comentario.id)}>
                    Enviar
                  </Button>
                </div>
              )}
              {(comentario.respostas ?? []).length > 0 && (
                <div className="mt-4 space-y-3 border-l border-border pl-4">
                  {(comentario.respostas ?? []).map((resposta: any) => (
                    <div key={resposta.id} className="group/resposta">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => onChannelClick?.(resposta.usuarioId)}
                            className={`font-semibold text-sm ${
                              onChannelClick ? 'cursor-pointer hover:text-primary hover:underline transition-colors' : ''
                            }`}
                          >
                            {resposta.usuario.nome}
                          </span>
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Autor
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(resposta.criadoEm).toLocaleDateString()}
                          </span>
                        </div>
                        {(usuario?.perfil === 'ADMIN' || usuario?.id === resposta.usuarioId) && (
                          <div className="flex items-center gap-2 opacity-0 group-hover/resposta:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditarComentario(resposta.id, resposta.texto)}
                              className="text-xs text-muted-foreground hover:text-primary"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleExcluirComentario(resposta.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-wrap">{resposta.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {comentarios.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
            Seja o primeiro a comentar!
          </div>
        )}
      </div>
    </div>
  );
}
