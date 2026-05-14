import { FolderTree } from 'lucide-react';
import { Button } from '../Button';

export function AdminCategories({ ctx }: { ctx: any }) {
  const {
    categorias,
    dashboard,
    videos,
    showAddCategory,
    setShowAddCategory,
    newCategory,
    setNewCategory,
    handleAddCategory,
    editingCategoryId,
    editingCategoryNome,
    setEditingCategoryNome,
    editingCategoryDescricao,
    setEditingCategoryDescricao,
    handleSaveCategory,
    handleCancelEditCategory,
    handleStartEditCategory,
    handleDeletarCategoria
  } = ctx;

  const categoriasDashboard = dashboard?.categorias ?? categorias;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddCategory(!showAddCategory)} size="sm">
          {showAddCategory ? 'Cancelar' : 'Nova Categoria'}
        </Button>
      </div>

      {showAddCategory && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Adicionar Nova Categoria</h3>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input type="text" required value={newCategory.nome} onChange={(e) => setNewCategory({...newCategory, nome: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input type="text" value={newCategory.descricao} onChange={(e) => setNewCategory({...newCategory, descricao: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
              </div>
            </div>
            <Button type="submit">Salvar Categoria</Button>
          </form>
        </div>
      )}

      {editingCategoryId && (
      <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 text-foreground dark:text-foreground">Editar Categoria</h3>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Nome</label>
                <input type="text" required value={editingCategoryNome} onChange={(e) => setEditingCategoryNome(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Descrição</label>
                <input type="text" value={editingCategoryDescricao} onChange={(e) => setEditingCategoryDescricao(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Observação: O "Slug" é um identificador único gerado automaticamente baseado no nome da categoria. Ele é usado na URL para identificar a categoria de forma legível.</p>
            <div className="flex gap-3">
              <Button type="submit">Salvar Alterações</Button>
              <Button variant="outline" onClick={handleCancelEditCategory}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categoriasDashboard.map((categoria: any) => (
          <div key={categoria.id} className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{categoria.nome}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{categoria.descricao || 'Sem descricao'}</p>
                </div>
                <FolderTree className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-4">Slug: {categoria.slug}</p>
              <p className="text-sm font-medium mt-2">{categoria.totalVideos ?? videos.filter((video: any) => video.categoria?.nome === categoria.nome).length} videos</p>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleStartEditCategory(categoria)}>
                Editar
              </Button>
              <Button size="sm" variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => handleDeletarCategoria(categoria.id)}>
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
