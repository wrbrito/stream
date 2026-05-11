import { prisma } from '../lib/prisma.js';

export const ProcessamentoRepository = {
  criar: async (dados: { videoId: number; status: string; mensagem?: string; progresso?: number }) => {
    return prisma.processamento.upsert({
      where: { videoId: dados.videoId },
      update: {
        status: dados.status,
        mensagem: dados.mensagem,
        progresso: dados.progresso ?? 0,
        iniciadoEm: new Date(),
        finalizadoEm: null,
      } as any,
      create: dados as any,
    });
  },

  atualizar: async (videoId: number, dados: Partial<{ status: string; mensagem?: string; progresso: number; finalizadoEm: Date }>) => {
    return prisma.processamento.upsert({
      where: { videoId },
      update: dados as any,
      create: {
        videoId,
        status: dados.status ?? 'PENDENTE',
        mensagem: dados.mensagem,
        progresso: dados.progresso ?? 0,
        finalizadoEm: dados.finalizadoEm,
      } as any,
    });
  },
};
