import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './lib/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(cors({ origin: env.APP_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIRECTORY)));
app.use('/api', apiRouter);
app.use(errorHandler);

export { app };