import { Button } from '../Button';

export function AdminComments({ ctx }: { ctx: any }) {
  const {
    comentarios,
    editingCommentId,
    setEditingCommentId,
    editingCommentText,
    setEditingCommentText,
    handleSaveComment,
    handleStartEditComment,
    handleDeleteComment,
    formatarData,
    renderPagination
  } = ctx;

  return (
    <div className="space-y-4">
      {editingCommentId && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Editar Comentário</h3>
          <form onSubmit={handleSaveComment} className="space-y-4">
            <textarea
              value={editingCommentText}
              onChange={(e) => setEditingCommentText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-input-background min-h-24"
            />
            <div className="flex gap-3">
              <Button type="submit">Salvar</Button>
              <Button variant="outline" onClick={() => setEditingCommentId(null)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {['Comentário', 'Usuário', 'Vídeo', 'Tipo', 'Data', 'Ações'].map((coluna) => (
                <th key={coluna} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comentarios.map((comentario: any) => (
              <tr key={comentario.id}>
                <td className="px-6 py-4 text-sm max-w-md">
                  <p className="line-clamp-3">{comentario.texto}</p>
                  {comentario._count?.respostas ? (
                    <p className="text-xs text-muted-foreground mt-1">{comentario._count.respostas} resposta(s)</p>
                  ) : null}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{comentario.usuario?.nome ?? '-'}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{comentario.video?.titulo ?? '-'}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{comentario.parentId ? 'Resposta' : 'Comentário'}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatarData(comentario.criadoEm)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStartEditComment(comentario)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeleteComment(comentario.id)}>
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
}
