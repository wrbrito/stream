import { ArrowLeft, Bell, CheckCircle, PlayCircle } from 'lucide-react';
import { Button } from './Button';
import { useNotifications } from '../../contexts/NotificationsContext';

interface NotificationsPageProps {
  onBack: () => void;
  onVideoClick: (videoId: number) => void;
}

function extrairVideoIdDaMensagem(mensagem: string): number | null {
  const comMarcador = mensagem.match(/\[video:(\d+)\]/i);
  if (comMarcador) {
    return Number(comMarcador[1]);
  }
  const comIdTexto = mensagem.match(/\bID\s*(\d+)\b/i);
  if (comIdTexto) {
    return Number(comIdTexto[1]);
  }
  return null;
}

function limparMarcadorVideo(mensagem: string): string {
  return mensagem.replace(/\s*\[video:\d+\]\s*/gi, '').trim();
}

export function NotificationsPage({ onBack, onVideoClick }: NotificationsPageProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Button>
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="w-4 h-4" />
            Marcar tudo como lido
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Notificações</h1>
        {notifications.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-3" />
            Nenhuma notificação disponível.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const videoId = extrairVideoIdDaMensagem(notif.mensagem);
              return (
                <div
                  key={notif.id}
                  className={`bg-card border rounded-xl p-4 ${notif.lida ? 'border-border' : 'border-primary/40'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{notif.titulo}</p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {limparMarcadorVideo(notif.mensagem)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notif.criadoEm).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notif.lida && (
                        <Button variant="outline" size="sm" onClick={() => markAsRead(notif.id)}>
                          Marcar lida
                        </Button>
                      )}
                      {videoId && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => onVideoClick(videoId)}>
                            <PlayCircle className="w-4 h-4" />
                            Link do vídeo #{videoId}
                          </Button>
                          <Button size="sm" onClick={() => onVideoClick(videoId)}>
                            Abrir vídeo
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
