import { Search, Sun, Moon, Upload, Bell, User, LogOut, Video } from 'lucide-react';
import { Button } from './Button';

export function Header({
  handleBackToHome,
  logoCompleta,
  nomeSite,
  searchQuery,
  setSearchQuery,
  handleGlobalSearch,
  canUpload,
  handleUploadClick,
  isAuthenticated,
  showNotifications,
  setShowNotifications,
  unreadCount,
  markAllAsRead,
  notifications,
  markAsRead,
  setSelectedNotification,
  handleNotificationsClick,
  isDarkMode,
  setIsDarkMode,
  handleAdminClick,
  canManageUsers,
  setCurrentScreen,
  handleLogout,
}: any) {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo lado esquerdo */}
        <div className="flex items-center gap-3 min-w-fit cursor-pointer" onClick={handleBackToHome}>
          {logoCompleta ? (
            <img src={logoCompleta} alt={nomeSite} className="w-10 h-10 rounded-xl object-cover border border-border" />
          ) : (
            <div className="bg-primary text-primary-foreground p-2 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground leading-tight">{nomeSite}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Plataforma Educacional</p>
          </div>
        </div>

        {/* Barra de busca centro */}
        <div className="flex-1 flex items-center gap-2 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleGlobalSearch();
                }
              }}
              placeholder="Buscar vídeos..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <Button onClick={handleGlobalSearch} className="rounded-xl px-6 font-semibold">
            Buscar
          </Button>
        </div>

        {/* Ícones lado direito */}
        <div className="flex items-center gap-2">
          {canUpload() && (
            <Button variant="outline" onClick={handleUploadClick} title="Enviar vídeo" className="hidden md:flex gap-2 rounded-xl border-border/60">
              <Upload className="w-4 h-4" />
              <span className="font-semibold">Enviar Vídeo</span>
            </Button>
          )}

          {isAuthenticated && (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)} title="Notificações" className="rounded-xl relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-[10px] font-bold text-destructive-foreground">
                    {unreadCount}
                  </div>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold">Notificações</h3>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
                      Ler todas
                    </Button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-8 text-center text-muted-foreground text-sm">Nenhuma notificação</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((notif: any) => (
                        <div
                          key={notif.id}
                          className={`p-4 cursor-pointer transition-colors ${!notif.lida ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent'}`}
                          onClick={() => {
                            markAsRead(notif.id);
                            setSelectedNotification({
                              id: notif.id,
                              titulo: notif.titulo,
                              mensagem: notif.mensagem,
                              criadoEm: notif.criadoEm,
                            });
                            setShowNotifications(false);
                          }}
                        >
                          <p className="font-semibold text-sm">{notif.titulo}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.mensagem}</p>
                          <p className="text-[10px] text-muted-foreground mt-2">{new Date(notif.criadoEm).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" className="w-full justify-center rounded-t-none border-t border-border text-xs h-10" onClick={handleNotificationsClick}>
                    Ver todas as notificações
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button variant="outline" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} title="Alternar tema" className="rounded-xl border-border/60">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {isAuthenticated ? (
            <Button variant="ghost" size="icon" onClick={handleAdminClick} title={canManageUsers() ? 'Administração' : 'Meu Perfil'} className="rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-transform hover:scale-110">
                <User className="w-5 h-5" />
              </div>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setCurrentScreen('login')} title="Fazer login" className="rounded-xl">
              <User className="w-5 h-5" />
            </Button>
          )}

          {isAuthenticated && (
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair" className="rounded-xl hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
