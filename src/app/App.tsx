import { useState, useEffect } from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';

import { Login } from './components/Login';
import { Home } from './components/Home';
import { VideoDetail } from './components/VideoDetail';
import { UploadVideo } from './components/UploadVideo';
import { AdminPanel } from './components/AdminPanel';
import { NotificationsPage } from './components/NotificationsPage';
import { Button } from './components/Button';
import { Footer } from './components/Footer';

type Screen = 'login' | 'home' | 'video' | 'upload' | 'admin' | 'notifications';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
    return (
      <>
        <div className="fixed top-4 right-4 z-[100]">
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
        <Login onLogin={() => setCurrentScreen('home')} />
      </>
    );
  }

  return (
    <>
    <div className="min-h-screen flex flex-col bg-background">
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} title="Alternar tema">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
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
      <Footer />
    </div>
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

