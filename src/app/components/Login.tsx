import { useState } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { Video, Mail, Lock, AlertCircle } from 'lucide-react';
import { tratarErroApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await login(email, password, lembrar);
      onLogin();
    } catch (error) {
      const mensagem = tratarErroApi(error);
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Plataforma de Vídeos
            </h1>
            <p className="text-muted-foreground mt-1">
              Acesse sua conta para continuar
            </p>
          </div>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">{erro}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="admin@escola.local"
                label="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={carregando}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                label="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={carregando}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  disabled={carregando}
                />
                <span className="text-muted-foreground">Lembrar de mim</span>
              </label>
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50"
                disabled={carregando}
              >
                Esqueci minha senha
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <p><strong>Dados teste:</strong></p>
            <p>admin@escola.local / Admin@2026</p>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Ajuda
              </a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">
                Termos de Uso
              </a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacidade
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
