import { NotificationRepository } from '../repositories/notification.repository.js';

export const NotificationService = {
  listarPorUsuario: NotificationRepository.listarPorUsuario,
  listarNaoLidasPorUsuario: NotificationRepository.listarNaoLidasPorUsuario,
  contarNaoLidasPorUsuario: NotificationRepository.contarNaoLidasPorUsuario,
  marcarComoLida: NotificationRepository.marcarComoLida,
  marcarTodasLidas: NotificationRepository.marcarTodasLidas,
  criar: NotificationRepository.criar,
};

