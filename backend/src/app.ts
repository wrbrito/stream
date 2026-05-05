import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './lib/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Configurar CORS para aceitar múltiplas portas do localhost durante desenvolvimento
const allowedOrigins = [
  'http://192.168.18.77:5173',
  'http://192.168.18.77:5174',
  'http://192.168.90.140:5173',
  'http://192.168.90.140:5174',
  env.APP_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Permitir requisições sem origin (como aplicações desktop ou testes)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS error'));
    }
  },
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIRECTORY)));
app.use('/api', apiRouter);
app.use(errorHandler);

export { app };