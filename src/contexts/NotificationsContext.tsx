import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { Bell, Check } from 'lucide-react';

interface Notification {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshCount: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { usuario } = useAuth();

  const loadNotifications = async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      const response = await api.notifications.listar();
      setNotifications(response.dados || []);
    } catch (error) {
      console.error('Erro carregando notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCount = async () => {
    if (!usuario?.id) return;
    try {
      const response = await api.notifications.contar();
      setUnreadCount(response.dados?.total || 0);
    } catch (error) {
      console.error('Erro contagem notificações:', error);
    }
  };


  const markAsRead = async (id: number) => {
    try {
      await api.fetch(`/notifications/${id}/lida`, { method: 'PATCH' });
      setNotifications(nots => nots.map(n => n.id === id ? { ...n, lida: true } : n));
      refreshCount();
    } catch (error) {
      console.error('Erro marcar lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.fetch('/notifications/todas/lidas', { method: 'PATCH' });
      setNotifications(nots => nots.map(n => ({ ...n, lida: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro marcar todas lidas:', error);
    }
  };

  useEffect(() => {
    if (usuario) {
      loadNotifications();
      refreshCount();
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario) {
      const interval = setInterval(async () => {
        try {
          await refreshCount();
        } catch {
          // Silencia erro se backend offline
        }
      }, 30000); // 30s polling silencioso
      return () => clearInterval(interval);
    }
  }, [usuario]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      refreshCount,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationsProvider');
  }
  return context;
};

