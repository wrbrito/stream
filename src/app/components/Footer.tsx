import { useState } from 'react';
import { Video, Github, Twitter, Linkedin, X } from 'lucide-react';
import { Button } from './Button';

interface FooterProps {
  nomeSite?: string;
  logoUrl?: string;
  suporteEmail?: string;
  gestorNome?: string;
  gestorEmail?: string;
  escritoPor?: string;
  escritoPorEmail?: string;
}

export function Footer({
  nomeSite = 'Vídeos Escola',
  logoUrl = '',
  suporteEmail = 'suporte@colegiodamas.com.br',
  gestorNome = 'Alberto Brasileiro',
  gestorEmail = 'alberto.brasileiro@colegiodamas.com.br',
  escritoPor = 'William Ramos de Brito',
  escritoPorEmail = 'william.brito@colegiodamas.com.br',
}: FooterProps) {
  const [modalConteudo, setModalConteudo] = useState<{ titulo: string; texto: string } | null>(null);

  return (
    <footer className="bg-card border-t border-border mt-auto pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Coluna 1: Logo e Bio */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={nomeSite} className="w-10 h-10 rounded-xl object-cover border border-border shadow-sm" />
              ) : (
                <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg">
                  <Video className="w-6 h-6 text-background" />
                </div>
              )}
              <h2 className="text-xl font-bold text-foreground tracking-tight">{nomeSite}</h2>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              A maior plataforma de conteúdos educacionais em vídeo para sua instituição.
            </p>
            <div className="flex items-center gap-5 text-muted-foreground">
              <a href="#" className="hover:text-primary transition-all hover:scale-110" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary transition-all hover:scale-110" aria-label="Github">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-primary transition-all hover:scale-110" aria-label="Linkedin">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Suporte */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Suporte</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <button 
                  type="button" 
                  className="hover:text-primary transition-colors text-left"
                  onClick={() => setModalConteudo({
                    titulo: 'Ajuda',
                    texto: `Se você esqueceu sua senha ou está com problemas para acessar, entre em contato com o Setor de Tecnologia no ramal 4601 ou enviando um email para ${suporteEmail}.`
                  })}
                >
                  Ajuda
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  className="hover:text-primary transition-colors text-left"
                  onClick={() => setModalConteudo({
                    titulo: 'Termos de Uso',
                    texto: 'Esta plataforma é para uso exclusivo de alunos e professores. Todo conteúdo enviado é de responsabilidade do autor e deve respeitar as diretrizes da instituição.'
                  })}
                >
                  Termos de Uso
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  className="hover:text-primary transition-colors text-left"
                  onClick={() => setModalConteudo({
                    titulo: 'Privacidade',
                    texto: 'Seus dados de acesso são protegidos e utilizados apenas para autenticação e registro de atividades educacionais na plataforma.'
                  })}
                >
                  Privacidade
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  className="hover:text-primary transition-colors text-left"
                  onClick={() => setModalConteudo({
                    titulo: 'FAQ',
                    texto: 'Para dúvidas frequentes sobre o envio de vídeos, formatos suportados e permissões de acesso, consulte os tutoriais disponíveis na seção de treinamento da sua instituição.'
                  })}
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contato</h3>
            <div className="space-y-5 text-sm">
              <a 
                href={`mailto:${suporteEmail}`} 
                className="block text-muted-foreground hover:text-primary transition-colors break-words font-medium"
              >
                {suporteEmail}
              </a>
              
              <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter opacity-70">
                  Gestor do Setor de Tecnologia
                </span>
                <a 
                  href={`mailto:${gestorEmail}`} 
                  className="block font-semibold text-foreground hover:text-primary transition-colors leading-none"
                >
                  {gestorNome}
                </a>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter opacity-70">
                  Escrito por
                </span>
                <a 
                  href={`mailto:${escritoPorEmail}`} 
                  className="block font-semibold text-foreground hover:text-primary transition-colors leading-none"
                >
                  {escritoPor}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Linha Final: Copyright */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-end">
          <p className="text-[11px] text-muted-foreground font-medium">
            © 2026 {nomeSite}. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Modal de Suporte */}
      {modalConteudo && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalConteudo(null)}>
          <div 
            className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">{modalConteudo.titulo}</h3>
              <button 
                onClick={() => setModalConteudo(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed whitespace-pre-wrap">{modalConteudo.texto}</p>
            <Button onClick={() => setModalConteudo(null)} className="w-full rounded-xl">
              Entendido
            </Button>
          </div>
        </div>
      )}
    </footer>
  );
}
