import { Video, Github, Twitter, Linkedin, Mail } from 'lucide-react';

interface FooterProps {
   nomeSite?: string;
   logoUrl?: string;
   suporteEmail?: string;
   gestorNome?: string;
   gestorEmail?: string;
   escritoPor?: string;
   escritoPorEmail?: string;
   isLoggedIn?: boolean;
 }

export function Footer({
  nomeSite = 'StreamEscola',
  logoUrl = '',
  suporteEmail = 'suporte@colegiodamas.com.br',
  gestorNome = 'Alberto Brasileiro',
  gestorEmail = 'alberto.brasileiro@colegiodamas.com.br',
  escritoPor = 'Escrito por: William Ramos de Brito',
  escritoPorEmail = 'william.brito@colegiodamas.com.br',
}: FooterProps) {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={nomeSite} className="w-10 h-10 rounded-xl object-cover border border-border" />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <div>
                <p className="text-xl font-bold text-foreground">{nomeSite}</p>
                <p className="text-sm text-muted-foreground">A plataforma de vídeos educacionais da sua instituição.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-2">Suporte</p>
                <ul className="space-y-2">
                  <li><a href="/ajuda" className="hover:text-primary transition-colors">Ajuda</a></li>
                  <li><a href="/termos" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                  <li><a href="/privacidade" className="hover:text-primary transition-colors">Privacidade</a></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Contato</p>
                <ul className="space-y-2">
                  <li><a href={`mailto:${suporteEmail}`} className="hover:text-primary transition-colors">{suporteEmail}</a></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Notas</p>
                <p className="text-xs text-muted-foreground">Use o link de ajuda para suporte ou acesse o e-mail acima.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div className="bg-muted/30 border border-border rounded-2xl p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Gestor do Setor de Tecnologia</p>
              <a href={`mailto:${gestorEmail}`} className="text-primary hover:underline">{gestorNome}</a>
            </div>
            <div className="bg-muted/30 border border-border rounded-2xl p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Escrito por</p>
              <a href={`mailto:${escritoPorEmail}`} className="text-primary hover:underline">{escritoPor}</a>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 {nomeSite}. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
