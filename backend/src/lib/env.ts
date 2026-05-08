import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('1h'),
  UPLOAD_DIRECTORY: z.string().default('./storage'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  WATERMARK_TEXT: z.string().optional().default('Plataforma Escolar'),
  WATERMARK_POSITION: z.string().default('BOTTOM_LEFT'),
});

export const env = envSchema.parse(process.env);
