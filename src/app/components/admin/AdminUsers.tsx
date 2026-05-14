import { MessageSquare, MessageSquareOff } from 'lucide-react';
import { Button } from '../Button';

export function AdminUsers({ ctx }: { ctx: any }) {
  const {
    usuarios,
    showAddUser,
    setShowAddUser,
    newUser,
    setNewUser,
    handleAddUser,
    editingUserId,
    editingUserData,
    setEditingUserData,
    handleSaveUser,
    handleCancelEditUser,
    handleStartEditUser,
    handleToggleUserStatus,
    handleToggleComentarios,
    handleDeletarUsuario,
    formatarData,
    renderPagination
  } = ctx;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddUser(!showAddUser)} size="sm">
          {showAddUser ? 'Cancelar' : 'Novo Usuário'}
        </Button>
      </div>

      {showAddUser && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Adicionar Novo Usuário</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input type="text" required value={newUser.nome} onChange={(e) => setNewUser({...newUser, nome: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha</label>
                <input type="password" required value={newUser.senha} onChange={(e) => setNewUser({...newUser, senha: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Perfil</label>
                <select value={newUser.perfil} onChange={(e) => setNewUser({...newUser, perfil: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-input-background">
                  <option value="ALUNO">Aluno</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            <Button type="submit">Salvar Usuário</Button>
          </form>
        </div>
      )}

      {editingUserId && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 text-foreground dark:text-foreground">Editar Usuário</h3>
          <form onSubmit={handleSaveUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Nome</label>
                <input
                  type="text"
                  required
                  value={editingUserData.nome}
                  onChange={(e) => setEditingUserData((prev: any) => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">E-mail</label>
                <input
                  type="email"
                  required
                  value={editingUserData.email}
                  onChange={(e) => setEditingUserData((prev: any) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Perfil</label>
                <select
                  value={editingUserData.perfil}
                  onChange={(e) => setEditingUserData((prev: any) => ({ ...prev, perfil: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ALUNO">Aluno</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Nova senha</label>
                <input
                  type="password"
                  value={editingUserData.senha}
                  onChange={(e) => setEditingUserData((prev: any) => ({ ...prev, senha: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Deixe em branco para manter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground dark:text-foreground">Foto de perfil</label>
                <input
                  value={editingUserData.fotoPerfil}
                  onChange={(e) => setEditingUserData((prev: any) => ({ ...prev, fotoPerfil: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input-background dark:bg-input-background text-foreground dark:text-foreground placeholder-muted-foreground dark:placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 text-sm text-foreground dark:text-foreground">
                  <input
                    type="checkbox"
                    checked={editingUserData.ativo}
                    onChange={(e) => setEditingUserData((prev: any) => ({ ...prev, ativo: e.target.checked }))}
                  />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground dark:text-foreground">
                  <input
                    type="checkbox"
                    checked={editingUserData.podeComentar}
                    onChange={(e) => setEditingUserData((prev: any) => ({ ...prev, podeComentar: e.target.checked }))}
                  />
                  Pode comentar
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit">Salvar Alterações</Button>
              <Button variant="outline" onClick={handleCancelEditUser}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {['Nome', 'Email', 'Perfil', 'Status', 'Comentários', 'Criado em', 'Ações'].map((coluna) => (
                <th key={coluna} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuarios.map((user: any) => (
              <tr key={user.id}>
                <td className="px-6 py-4 font-medium">{user.nome}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{user.perfil}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.podeComentar !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.podeComentar !== false ? 'Permitidos' : 'Bloqueados'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatarData(user.criadoEm)}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStartEditUser(user)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleUserStatus(user.id, user.ativo)} title={user.ativo ? 'Desativar' : 'Ativar'}>
                      {user.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleToggleComentarios(user.id, user.podeComentar !== false)}
                      title={user.podeComentar !== false ? 'Bloquear Comentários' : 'Permitir Comentários'}
                    >
                      {user.podeComentar !== false ? <MessageSquareOff className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeletarUsuario(user.id)}>
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
