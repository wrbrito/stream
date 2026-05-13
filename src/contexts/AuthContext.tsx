import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, AuthPayload } from '../services/api';

interface AuthContextType {
  usuario: AuthPayload['usuario'] | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string, lembrar?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: 'ADMIN' | 'PROFESSOR' | 'ALUNO') => boolean;
  canUpload: () => boolean;
  canManageUsers: () => boolean;
  canManageVideos: () => boolean;
  canModerate: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<AuthPayload['usuario'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tokenSalvo = api.getToken();
    const usuarioSalvo = api.getUsuario();

    if (tokenSalvo && usuarioSalvo) {
      setToken(tokenSalvo);
      setUsuario(usuarioSalvo);
    } else {
      api.clearAuth();
    }

    setIsLoading(false);
  }, []);

  const isAuthenticated = !!token && !!usuario;

  const login = async (email: string, senha: string, lembrar: boolean = true) => {
    try {
      setIsLoading(true);
      const { usuario: dados, token: novoToken } = await api.auth.login(email, senha);

      api.setToken(novoToken, lembrar);
      api.setUsuario(dados, lembrar);
      setToken(novoToken);
      setUsuario(dados);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    api.clearAuth();
    setToken(null);
    setUsuario(null);
  };

  const hasRole = (role: 'ADMIN' | 'PROFESSOR' | 'ALUNO') => {
    return usuario?.perfil === role;
  };

  const canUpload = () => {
    return isAuthenticated && (hasRole('ADMIN') || hasRole('PROFESSOR'));
  };

  const canManageUsers = () => {
    return hasRole('ADMIN');
  };

  const canManageVideos = () => {
    return hasRole('ADMIN') || hasRole('PROFESSOR');
  };

  const canModerate = () => {
    return hasRole('ADMIN');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        hasRole,
        canUpload,
        canManageUsers,
        canManageVideos,
        canModerate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider');
  }
  return context;
}

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
}) {
  const { isAuthenticated, usuario, isLoading } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <div>Voce precisa estar autenticado.</div>;
  }

  if (requiredRole && usuario?.perfil !== requiredRole) {
    return <div>Voce nao tem permissao para acessar esta pagina.</div>;
  }

  return <>{children}</>;
}
