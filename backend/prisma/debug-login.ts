import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@escola.local';
  const senha = 'Admin@2026';


  const usuario = await prisma.usuario.findUnique({ where: { email } });

  console.log('[debug-login] userExists?', !!usuario);
  if (!usuario) {
    await prisma.$disconnect();
    return;
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  console.log('[debug-login] email:', usuario.email);
  console.log('[debug-login] perfil:', usuario.perfil);
  console.log('[debug-login] ativo:', usuario.ativo);
  console.log('[debug-login] senhaValida?', senhaValida);
}

main()
  .catch((e) => {
    console.error(e);
  })

  .finally(async () => {
    await prisma.$disconnect();
  });

