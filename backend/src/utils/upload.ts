import multer from 'multer';
import path from 'path';
import { env } from '../lib/env.js';
import fs from 'fs/promises';
import { Request } from 'express';

const baseDir = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY);

async function criarPastaDestino(destino: string) {
  await fs.mkdir(destino, { recursive: true });
}

function storageDestino(subpasta: string) {
  return multer.diskStorage({
    destination: async (_req, _file, cb) => {
      const destino = path.join(baseDir, subpasta);
      await criarPastaDestino(destino);
      cb(null, destino);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const nome = file.originalname.replace(/\s+/g, '-').toLowerCase();
      cb(null, `${timestamp}-${nome}`);
    },
  });
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, file, cb) => {
      const field = file.fieldname === 'miniatura' ? 'thumbnails' : 'videos';
      const destino = path.join(baseDir, field);
      await criarPastaDestino(destino);
      cb(null, destino);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const nome = file.originalname.replace(/\s+/g, '-').toLowerCase();
      cb(null, `${timestamp}-${nome}`);
    },
  }),
});

/**
 * Storage organizado por usuário: storage/fotos/usuarios/{userId}/
 * O nome do arquivo usa timestamp + ext para evitar cache de browser.
 */
export const uploadFotoPerfil = multer({
  storage: multer.diskStorage({
    destination: async (req: Request, _file, cb) => {
      const userId = req.usuario?.id ?? 'anonimo';
      const destino = path.join(baseDir, 'fotos', 'usuarios', String(userId));
      await criarPastaDestino(destino);
      cb(null, destino);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `perfil-${Date.now()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('A foto de perfil deve ser uma imagem'));
  },
  limits: {
    fileSize: 3 * 1024 * 1024, // 3 MB
  },
});
