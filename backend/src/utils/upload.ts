import multer from 'multer';
import path from 'path';
import { env } from '../lib/env.js';
import fs from 'fs/promises';

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
    destination: async (req, file, cb) => {
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

export const uploadFotoPerfil = multer({
  storage: storageDestino('fotos'),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('A foto de perfil deve ser uma imagem'));
  },
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});
