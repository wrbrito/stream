import { useState } from 'react';
import { ArrowLeft, User, Mail, Shield, Save, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { api, tratarErroApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { usuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    
    try {
      setSalvando(true);
      setMensagem('');
      setErro('');
      await api.usuarios.atualizar(usuario.id, { nome });
      setMensagem('Perfil atualizado com sucesso. Faça login novamente para ver as alterações refletidas em todos os locais.');
    } catch (err) {
      setErro(tratarErroApi(err));
    } finally {
      setSalvando(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {usuario.nome[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
              <p className="text-muted-foreground">Visualize e atualize suas informações</p>
            </div>
          </div>

          <form onSubmit={handleSalvar} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nome
                </label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  E-mail
                </label>
                <Input
                  value={usuario.email}
                  disabled
                  title="O e-mail não pode ser alterado diretamente"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  Perfil de Acesso
                </label>
                <div className="px-4 py-3 rounded-lg border border-border bg-muted/30 text-muted-foreground font-medium flex items-center gap-2">
                  {usuario.perfil === 'ALUNO' && '🎓 Aluno'}
                  {usuario.perfil === 'PROFESSOR' && '👨‍🏫 Professor'}
                  {usuario.perfil === 'ADMIN' && '⭐ Administrador'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Para alterar seu perfil de acesso, entre em contato com a administração.
                </p>
              </div>
            </div>

            {mensagem && (
              <div className="p-4 bg-green-100 text-green-700 rounded-lg text-sm">
                {mensagem}
              </div>
            )}
            
            {erro && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={salvando || nome === usuario.nome}>
                {salvando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
