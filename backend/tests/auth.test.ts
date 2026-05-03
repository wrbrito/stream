import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { gerarToken, verificarToken } from '../src/lib/jwt.js';

describe('JWT Service', () => {
  it('deve gerar um token válido', () => {
    const token = gerarToken({ sub: 1, email: 'test@email.com', perfil: 'ADMIN' });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('deve verificar um token válido', () => {
    const payload = { sub: 1, email: 'test@email.com', perfil: 'ADMIN' };
    const token = gerarToken(payload);
    const verified = verificarToken(token);
    expect(verified.sub).toBe(payload.sub);
    expect(verified.email).toBe(payload.email);
  });

  it('deve lançar erro ao verificar token inválido', () => {
    expect(() => verificarToken('token-invalido')).toThrow();
  });
});
