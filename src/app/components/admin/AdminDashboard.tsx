import { AlertCircle, BarChart3, Users, Video } from 'lucide-react';
import { Button } from '../Button';

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: typeof Video;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{helper}</p>
    </div>
  );
}

export function AdminDashboard({ ctx }: { ctx: any }) {
  const {
    dashboard,
    videos,
    usuarios,
    categorias,
    totalVisualizacoes,
    statusConfig,
    formatarData,
    setActiveMenu
  } = ctx;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total de videos" value={dashboard?.total ?? videos.length} helper={`${dashboard?.internos ?? 0} internos, ${dashboard?.externos ?? 0} YouTube`} icon={Video} />
        <StatCard label="Visualizacoes" value={totalVisualizacoes} helper="Contador real registrado ao abrir videos" icon={BarChart3} />
        <StatCard label="Pendentes" value={dashboard?.pendentes ?? 0} helper="Aguardando revisao/publicacao" icon={AlertCircle} />
        <StatCard label="Usuarios" value={dashboard?.totalUsuarios ?? usuarios.length} helper={`${dashboard?.totalCategorias ?? categorias.length} categorias cadastradas`} icon={Users} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <h3 className="font-semibold text-foreground">Videos Recentes</h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveMenu('videos')}>Ver todos</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Titulo</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {videos.slice(0, 5).map((video: any) => (
                <tr key={video.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{video.titulo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusConfig[video.status]?.color ?? 'bg-muted text-muted-foreground'}`}>
                      {statusConfig[video.status]?.label ?? video.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatarData(video.criadoEm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
