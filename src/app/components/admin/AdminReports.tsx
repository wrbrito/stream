export function AdminReports({ ctx }: { ctx: any }) {
  const { dashboard } = ctx;

  const videosPorTipo = [
    { label: 'Internos', value: dashboard?.internos ?? 0 },
    { label: 'YouTube', value: dashboard?.externos ?? 0 },
    { label: 'Pendentes', value: dashboard?.pendentes ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Resumo por tipo/status</h3>
        <div className="space-y-3">
          {videosPorTipo.map((item) => (
            <div key={item.label} className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Categorias mais usadas</h3>
        <div className="space-y-3">
          {(dashboard?.categorias ?? []).map((categoria: any) => (
            <div key={categoria.id} className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">{categoria.nome}</span>
              <span className="font-semibold">{categoria.totalVideos ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
