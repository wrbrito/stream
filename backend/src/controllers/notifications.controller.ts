import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';

export const NotificationsController = {
  listar: async (req: Request, res: Response) => {
    const notificacoes = await NotificationService.listarPorUsuario(req.usuario?.id);
    return res.json({ sucesso: true, dados: notificacoes });
  },

  contar: async (req: Request, res: Response) => {
    if (!req.usuario?.id) {
      return res.status(401).json({ sucesso: false, erro: 'Usuário não autenticado' });
    }
    const total = await NotificationService.contarNaoLidasPorUsuario(req.usuario.id);
    return res.json({ sucesso: true, dados: { total } });
  },

  marcarLida: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await NotificationService.marcarComoLida(id);
    return res.json({ sucesso: true, dados: { mensagem: 'Notificação marcada como lida' } });
  },

  marcarTodasLidas: async (req: Request, res: Response) => {
    if (!req.usuario?.id) {
      return res.status(401).json({ sucesso: false, erro: 'Usuário não autenticado' });
    }
    await NotificationService.marcarTodasLidas(req.usuario.id);
    return res.json({ sucesso: true, dados: { mensagem: 'Todas notificações marcadas como lidas' } });
  },
};

