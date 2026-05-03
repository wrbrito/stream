import { useState } from 'react';
import { Search } from 'lucide-react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';

import { Login } from './components/Login';
import { Home } from './components/Home';
import { VideoDetail } from './components/VideoDetail';
import { UploadVideo } from './components/UploadVideo';
import { AdminPanel } from './components/AdminPanel';
import { NotificationsPage } from './components/NotificationsPage';
import { Button } from './components/Button';

type Screen = 'login' | 'home' | 'video' | 'upload' | 'admin' | 'notifications';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, isLoading, logout } = useAuth();

  const handleVideoClick = (videoId: number) => {
    setSelectedVideoId(videoId);
    setCurrentScreen('video');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleUploadClick = () => {
    setCurrentScreen('upload');
  };

  const handleAdminClick = () => {
    setCurrentScreen('admin');
  };

  const handleGlobalSearch = () => {
    setCurrentScreen('home');
  };

  const handleNotificationsClick = () => {
    setCurrentScreen('notifications');
  };

  const handleLogout = () => {
    logout();
    setCurrentScreen('login');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setCurrentScreen('home')} />;
  }

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <h1 className="text-xl font-semibold text-foreground">Vídeos Escola</h1>
            <div className="relative w-full sm:w-80">
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
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button size="sm" onClick={handleGlobalSearch}>
              Buscar
            </Button>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm">
            Sair
          </Button>
        </div>
      </header>
      <main className="size-full">
        {currentScreen === 'home' && (
          <Home
            onVideoClick={handleVideoClick}
            onUploadClick={handleUploadClick}
            onAdminClick={handleAdminClick}
            onNotificationsClick={handleNotificationsClick}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        )}
        {currentScreen === 'video' && selectedVideoId && (
          <VideoDetail onBack={handleBackToHome} videoId={selectedVideoId} />
        )}
        {currentScreen === 'upload' && <UploadVideo onBack={handleBackToHome} />}
        {currentScreen === 'admin' && (
          <AdminPanel
            onBack={handleBackToHome}
            onUploadClick={handleUploadClick}
            onNotificationsClick={handleNotificationsClick}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        )}
        {currentScreen === 'notifications' && (
          <NotificationsPage onBack={handleBackToHome} onVideoClick={handleVideoClick} />
        )}
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppContent />
      </NotificationsProvider>
    </AuthProvider>
  );
}

