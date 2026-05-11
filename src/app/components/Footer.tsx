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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-2">Suporte</p>
                <ul className="space-y-2">
                  <li>
                    <button type="button" className="hover:text-primary transition-colors" onClick={() => window.alert(`Se você esqueceu sua senha ou está com problemas para acessar, entre em contato com o Setor de Tecnologia no ramal 4601 ou enviando um email para ${suporteEmail}.`)}>
                      Ajuda
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-primary transition-colors" onClick={() => window.alert('Esta plataforma é para uso exclusivo de alunos e professores. Todo conteúdo enviado é de responsabilidade do autor e deve respeitar as diretrizes da instituição.')}>Termos de Uso</button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-primary transition-colors" onClick={() => window.alert('Seus dados de acesso são protegidos e utilizados apenas para autenticação e registro de atividades educacionais na plataforma.')}>Privacidade</button>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-2">Contato</p>
                <ul className="space-y-2">
                  <li><a href={`mailto:${suporteEmail}`} className="hover:text-primary transition-colors">{suporteEmail}</a></li>
                  <li>
                    <span className="text-[12px] text-muted-foreground">Gestor do Setor de Tecnologia</span>
                    <div className="leading-snug">
                      <a href={`mailto:${gestorEmail}`} className="text-primary hover:underline">{gestorNome}</a>
                    </div>
                  </li>
                  <li>
                    <span className="text-[12px] text-muted-foreground">Escrito por</span>
                    <div className="leading-snug">
                      <a href={`mailto:${escritoPorEmail}`} className="text-primary hover:underline">{escritoPor}</a>
                    </div>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">© 2026 {nomeSite}. Todos os direitos reservados.</p>
              </div>
            </div>
          </div>


        </div>
      </div>
    </footer>
  );
}
