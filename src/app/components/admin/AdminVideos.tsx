import { AlertCircle, CheckCircle, DownloadCloud, Loader, Upload, XCircle } from 'lucide-react';
import { Button } from '../Button';
import { api } from '../../../services/api';

export function AdminVideos({ ctx }: { ctx: any }) {
  const {
    videosFiltrados,
    statusConfig,
    importingVideoId,
    videoProgress,
    aprovarVideo,
    handleImportarVideo,
    handleStartEditVideo,
    excluirVideo,
    totalItens,
    renderPagination,
    busca,
    setBusca,
    searchQuery,
    onSearchQueryChange,
    status,
    setStatus,
    tipo,
    setTipo,
    selectedQuality,
    setSelectedQuality,
    onUploadClick,
    editingVideoData,
    setEditingVideoData,
    categorias,
    handleSaveVideo,
    handleCancelEditVideo,
    formatarData,
    contarVisualizacoes
  } = ctx;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar videos..."
            value={searchQuery ?? busca}
            onChange={(event) => {
              const value = event.target.value;
              setBusca(value);
              if (onSearchQueryChange) onSearchQueryChange(value);
            }}
            className="px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="PROCESSANDO">Processando</option>
            <option value="ERRO">Erro</option>
          </select>
          <select
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos os tipos</option>
            <option value="INTERNO">Interno</option>
            <option value="YOUTUBE">YouTube</option>
          </select>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">Qualidade:</span>
            <select
              value={selectedQuality}
              onChange={(event) => setSelectedQuality(event.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="maxima">Máxima (Padrão)</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </div>
        </div>
        {onUploadClick && (
          <Button onClick={onUploadClick} size="sm">Novo Vídeo</Button>
        )}
      </div>

      {editingVideoData && (
        <div className="p-4 border-b border-border bg-muted/30 dark:bg-muted/20">
          <form onSubmit={handleSaveVideo} className="grid gap-4 md:grid-cols-2 items-end">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Título</label>
              <input
                value={editingVideoData.titulo}
                onChange={(e) => setEditingVideoData((prev: any) => prev ? { ...prev, titulo: e.target.value } : prev)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Autor</label>
              <input
                value={editingVideoData.autor}
                onChange={(e) => setEditingVideoData((prev: any) => prev ? { ...prev, autor: e.target.value } : prev)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Descrição</label>
              <textarea
                value={editingVideoData.descricao}
                onChange={(e) => setEditingVideoData((prev: any) => prev ? { ...prev, descricao: e.target.value } : prev)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Categoria</label>
              <select
                value={editingVideoData.categoriaId ?? ''}
                onChange={(e) => setEditingVideoData((prev: any) => prev ? { ...prev, categoriaId: Number(e.target.value) } : prev)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((categoria: any) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Tipo</label>
              <select
                value={editingVideoData.tipo}
                onChange={(e) => setEditingVideoData((prev: any) => prev ? { ...prev, tipo: e.target.value } : prev)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="INTERNO">Interno</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Status</label>
              <select
                value={editingVideoData.status}
                onChange={(e) => setEditingVideoData((prev: any) => prev ? { ...prev, status: e.target.value } : prev)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ATIVO">Ativo</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PROCESSANDO">Processando</option>
                <option value="ERRO">Erro</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">Miniatura (opcional)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditingVideoData((prev: any) => prev ? { ...prev, miniaturaFile: file } : prev);
                    }
                  }}
                  className="hidden"
                  id="thumbnail-edit"
                />
                <label htmlFor="thumbnail-edit" className="cursor-pointer">
                  {editingVideoData.miniaturaFile ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border mb-2">
                      <img 
                        src={URL.createObjectURL(editingVideoData.miniaturaFile)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {editingVideoData.miniaturaFile ? editingVideoData.miniaturaFile.name : 'Clique para selecionar uma miniatura'}
                  </p>
                </label>
              </div>
            </div>
            {editingVideoData.tipo === 'YOUTUBE' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-foreground dark:text-foreground">URL original do YouTube</label>
                <input
                  value={editingVideoData.urlOriginal}
                  onChange={(e) => setEditingVideoData((prev: any) => prev ? { ...prev, urlOriginal: e.target.value } : prev)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit">Salvar alterações</Button>
              <Button variant="outline" onClick={handleCancelEditVideo}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {['Titulo', 'Tipo', 'Status', 'Importação', 'Categoria', 'Autor', 'Data', 'Visualizacoes', 'Arquivo', 'Ações'].map((coluna) => (
                <th key={coluna} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {videosFiltrados.map((video: any) => {
              const config = statusConfig[video.status] ?? statusConfig.PENDENTE;
              const StatusIcon = config.icon;

              return (
                <tr key={video.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{video.titulo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${video.tipo === 'YOUTUBE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {video.tipo === 'YOUTUBE' ? 'YouTube' : 'Interno'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {video.tipo === 'YOUTUBE' ? (
                      importingVideoId === video.id || video.status === 'PROCESSANDO' ? (
                        <div className="flex flex-col gap-1 w-32">
                          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Loader className="w-3 h-3 animate-spin" />
                            {videoProgress[video.id] !== undefined ? `${videoProgress[video.id]}%` : 'Importando...'}
                          </span>
                          <div className="w-full bg-blue-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${videoProgress[video.id] ?? 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : video.status === 'PENDENTE' ? (
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <AlertCircle className="w-3 h-3" />
                          Aguardando
                        </span>
                      ) : video.status === 'ERRO' ? (
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" />
                          Falha
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Importado
                        </span>
                      )
                    ) : video.status === 'PROCESSANDO' ? (
                      <div className="flex flex-col gap-1 w-32">
                        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Loader className="w-3 h-3 animate-spin" />
                          {videoProgress[video.id] !== undefined ? `${videoProgress[video.id]}%` : 'Processando...'}
                        </span>
                        <div className="w-full bg-blue-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${videoProgress[video.id] ?? 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{video.categoria?.nome ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{video.autor}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatarData(video.criadoEm)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{contarVisualizacoes(video.visualizacoes)}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {video.caminhoArquivo
                      ? video.caminhoArquivo
                      : video.tipo === 'YOUTUBE'
                        ? '...'
                        : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {video.status === 'PENDENTE' && (
                        <button
                          className="p-1.5 hover:bg-accent rounded-md transition-colors"
                          title="Aprovar"
                          onClick={() => aprovarVideo(video.id)}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      {video.tipo === 'INTERNO' ? (
                        <button
                          className="p-1.5 hover:bg-accent rounded-md transition-colors"
                          title="Download"
                          onClick={() => api.videos.download(video.id)}
                        >
                          <DownloadCloud className="w-4 h-4 text-primary" />
                        </button>
                      ) : (
                        <button
                          className="p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-60"
                          title="Importar para servidor"
                          onClick={() => handleImportarVideo(video.id)}
                          disabled={video.status === 'PROCESSANDO' || importingVideoId === video.id}
                        >
                          {importingVideoId === video.id ? (
                            <Loader className="w-4 h-4 text-primary animate-spin" />
                          ) : (
                            <DownloadCloud className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleStartEditVideo(video)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => excluirVideo(video.id)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border text-sm text-muted-foreground flex justify-between items-center">
        <span>Mostrando {videosFiltrados.length} de {totalItens} vídeos</span>
      </div>
      {renderPagination()}
    </div>
  );
}
