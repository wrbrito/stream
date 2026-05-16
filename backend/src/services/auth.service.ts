import bcrypt from 'bcryptjs';
import { UsuarioRepository } from '../repositories/usuario.repository.js';
import { gerarToken } from '../lib/jwt.js';

export const AuthService = {
  autenticar: async (email: string, senha: string) => {
    const usuario = await UsuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      return null;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return null;
    }

    const token = gerarToken({
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
    });

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        fotoPerfil: usuario.fotoPerfil,
      },
      token,
    };
  },
};
