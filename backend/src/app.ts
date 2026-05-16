import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './lib/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Configurar CORS para aceitar múltiplas portas/hosts durante desenvolvimento
const allowedOrigins = new Set([
  'http://192.168.18.77:5173',
  'http://192.168.18.77:5174',
  'http://192.168.90.140:5173',
  'http://192.168.90.140:5174',
  'http://192.168.25.253:5173',
  'http://192.168.16.95:5173',
  'http://192.168.56.1:5173',
  'http://192.168.1.9:5173',
  env.APP_URL,
  // adiciona o origin usado no erro do navegador
  'http://damastube:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (como aplicações desktop ou testes)
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) return callback(null, true);

      // importante: não lançar erro que pode impedir headers no preflight
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIRECTORY)));
app.use('/api', apiRouter);
app.use(errorHandler);

export { app };