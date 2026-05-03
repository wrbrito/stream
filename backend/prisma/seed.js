import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const senhaAdmin = await bcrypt.hash('Admin@2026', 10);
    await prisma.usuario.upsert({
        where: { email: 'admin@escola.local' },
        update: {
            nome: 'Administrador da Escola',
            senha: senhaAdmin,
            perfil: 'ADMIN',
            ativo: true,
        },
        create: {
            nome: 'Administrador da Escola',
            email: 'admin@escola.local',
            senha: senhaAdmin,
            perfil: 'ADMIN',
        },
    });
    const categorias = [
        { nome: 'Aulas', descricao: 'Materiais e aulas gravadas', slug: 'aulas' },
        { nome: 'Eventos', descricao: 'Cobertura de eventos escolares', slug: 'eventos' },
        { nome: 'Avisos', descricao: 'Comunicações importantes', slug: 'avisos' },
        { nome: 'Projetos', descricao: 'Apresentações e projetos', slug: 'projetos' },
        { nome: 'Formações', descricao: 'Capacitação e formações', slug: 'formacoes' },
        { nome: 'Outros', descricao: 'Conteúdo diversificado', slug: 'outros' },
    ];
    for (const categoria of categorias) {
        await prisma.categoria.upsert({
            where: { slug: categoria.slug },
            update: categoria,
            create: categoria,
        });
    }
    console.log('✅ Seed executada com sucesso!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
