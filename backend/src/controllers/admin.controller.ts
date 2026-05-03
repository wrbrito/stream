import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';

export const AdminController = {
  dashboard: async (_req: Request, res: Response) => {
    const dados = await AdminService.dashboard();
    return res.json({ sucesso: true, dados });
  },
};
