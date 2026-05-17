import { useState, useEffect } from 'react';
import { Search, Sun, Moon, Upload, Bell, User, LogOut, Video, Check } from 'lucide-react';
import { ErrorProvider } from '../contexts/ErrorContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationsProvider, useNotifications } from '../contexts/NotificationsContext';


import { Login } from './components/Login';
import { Home } from './components/Home';
import { VideoDetail } from './components/VideoDetail';
import { UploadVideo } from './components/UploadVideo';
import { AdminPanel } from './components/AdminPanel';
import { NotificationsPage } from './components/NotificationsPage';
import { Button } from './components/Button';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ProfilePage } from './components/ProfilePage';
import { UserChannelPage } from './components/UserChannelPage';
import { api } from '../services/api';

type Screen = 'login' | 'home' | 'video' | 'upload' | 'admin' | 'notifications' | 'profile' | 'channel';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, isLoading, logout, usuario, canUpload, canManageUsers } = useAuth();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [configsPublicas, setConfigsPublicas] = useState<Record<string, string>>({});
  const [selectedNotification, setSelectedNotification] = useState<{
    id: number;
    titulo: string;
    mensagem: string;
    criadoEm: string;
  } | null>(null);

   const supportEmail = configsPublicas.SUPORTE_EMAIL || 'suporte@colegiodamas.com.br';
   const showFooter = configsPublicas.EXIBIR_RODAPE !== 'false';
   const showCategories = configsPublicas.EXIBIR_CATEGORIAS !== 'false';
   const gestorNome = configsPublicas.RODAPE_GESTOR_NOME || 'Alberto Brasileiro';
   const gestorEmail = configsPublicas.RODAPE_GESTOR_EMAIL || 'alberto.brasileiro@colegiodamas.com.br';
   const escritoPor = configsPublicas.RODAPE_ESCRITO_POR || 'William Ramos de Brito';
   const escritoPorEmail = configsPublicas.RODAPE_ESCRITO_POR_EMAIL || 'william.brito@colegiodamas.com.br';
  const featuredCount = Number(configsPublicas.QTD_VIDEOS_DESTAQUE ?? 4);
  const relatedCount = Number(configsPublicas.QTD_VIDEOS_RELACIONADOS ?? 4);
  const featuredVideosCount = Number.isNaN(featuredCount) ? 4 : featuredCount;
  const relatedVideosCount = Number.isNaN(relatedCount) ? 4 : relatedCount;
  
  // Configurações de recomendação
  const showRecommended = configsPublicas.ATIVAR_RECOMENDADOS !== 'false';
  const recommendedCount = Number(configsPublicas.QTD_VIDEOS_RECOMENDADOS ?? 10);
  const recommendedVideosCount = Number.isNaN(recommendedCount) ? 10 : recommendedCount;
  
  // Configurações de em alta
  const showTrending = configsPublicas.ATIVAR_EM_ALTA !== 'false';
  const trendingCount = Number(configsPublicas.QTD_VIDEOS_EM_ALTA ?? 10);
  const trendingVideosCount = Number.isNaN(trendingCount) ? 10 : trendingCount;
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let ativo = true;
    api.configuracoes.publicas()
      .then((response) => {
        if (ativo && response.dados) {
          const configs = response.dados as Record<string, string>;
          setConfigsPublicas(configs);
          if (configs.NOME_SITE) {
            document.title = configs.NOME_SITE;
          }
        }
      })
      .catch(() => null);

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoIdParam = params.get('videoId');
    if (videoIdParam) {
      const id = Number(videoIdParam);
      if (!Number.isNaN(id) && id > 0) {
        setSelectedVideoId(id);
        setCurrentScreen('video');
      }
    }
  }, []);

  const handleVideoClick = (videoId: number) => {
    setSelectedVideoId(videoId);
    setCurrentScreen('video');
    const url = new URL(window.location.href);
    url.searchParams.set('videoId', String(videoId));
    window.history.replaceState(null, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedVideoId(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const handleUploadClick = () => {
    setCurrentScreen('upload');
  };

  const handleAdminClick = () => {
    if (canManageUsers()) {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('profile');
    }
  };

  const handleGlobalSearch = () => {
    setCurrentScreen('home');
  };

  const handleNotificationsClick = () => {
    setCurrentScreen('notifications');
    setShowNotifications(false);
  };

  const handleChannelClick = (usuarioId: number) => {
    setSelectedChannelId(usuarioId);
    setCurrentScreen('channel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    setCurrentScreen('login');
  };

  const nomeSite = configsPublicas.NOME_SITE || 'Vídeos Escola';
  const logoUrl = configsPublicas.LOGO_URL || '';
  const logoCompleta = logoUrl
    ? logoUrl.startsWith('/')
      ? `${(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')}${logoUrl}`
      : logoUrl
    : '';

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Carregando...</div>;
  }

  return (
    <>
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        handleBackToHome={handleBackToHome}
        logoCompleta={logoCompleta}
        nomeSite={nomeSite}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleGlobalSearch={handleGlobalSearch}
        canUpload={canUpload}
        handleUploadClick={handleUploadClick}
        isAuthenticated={isAuthenticated}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        unreadCount={unreadCount}
        markAllAsRead={markAllAsRead}
        notifications={notifications}
        markAsRead={markAsRead}
        setSelectedNotification={setSelectedNotification}
        handleNotificationsClick={handleNotificationsClick}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        handleAdminClick={handleAdminClick}
        canManageUsers={canManageUsers}
        setCurrentScreen={setCurrentScreen}
        handleLogout={handleLogout}
        usuario={usuario}
      />

      {selectedNotification && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedNotification(null)}>
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedNotification.titulo}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(selectedNotification.criadoEm).toLocaleString('pt-BR')}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNotification(null)} className="rounded-full">
                <Check className="w-5 h-5" />
              </Button>
            </div>
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-xl">
              {selectedNotification.mensagem}
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setSelectedNotification(null)} className="rounded-xl px-8">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {currentScreen === 'login' && (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Login
              onLogin={() => setCurrentScreen('home')}
              nomeSite={nomeSite}
              logoUrl={logoCompleta}
              suporteEmail={supportEmail}
            />
          </div>
        )}
        {currentScreen === 'home' && (
          <Home
            onVideoClick={handleVideoClick}
            onUploadClick={handleUploadClick}
            onAdminClick={handleAdminClick}
            onNotificationsClick={handleNotificationsClick}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            showCategories={showCategories}
            featuredCount={featuredVideosCount}
            showRecommended={showRecommended}
            recommendedCount={recommendedVideosCount}
            showTrending={showTrending}
            trendingCount={trendingVideosCount}
          />
        )}
        {currentScreen === 'video' && selectedVideoId && (
          <VideoDetail onBack={handleBackToHome} videoId={selectedVideoId} onVideoClick={handleVideoClick} relatedCount={relatedVideosCount} />
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
        {currentScreen === 'profile' && (
          <ProfilePage onBack={handleBackToHome} onVideoClick={handleVideoClick} />
        )}
        {currentScreen === 'channel' && selectedChannelId && (
          <UserChannelPage
            usuarioId={selectedChannelId}
            onBack={handleBackToHome}
            onVideoClick={handleVideoClick}
          />
        )}
      </main>
      {showFooter && (
          <Footer
            nomeSite={nomeSite}
            logoUrl={logoCompleta}
            suporteEmail={supportEmail}
            gestorNome={gestorNome}
            gestorEmail={gestorEmail}
            escritoPor={escritoPor}
            escritoPorEmail={escritoPorEmail}
            isLoggedIn={isAuthenticated}
          />
        )}
    </div>
    </>
  );
}

export default function App() {
  return (
    <ErrorProvider>
      <AuthProvider>
        <NotificationsProvider>
          <AppContent />
        </NotificationsProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}

