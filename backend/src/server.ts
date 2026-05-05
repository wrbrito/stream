import 'dotenv/config';
import { app } from './app.js';
import { env } from './lib/env.js';

const port = env.PORT;

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
