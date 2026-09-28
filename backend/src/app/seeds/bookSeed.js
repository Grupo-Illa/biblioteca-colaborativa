import { faker } from '@faker-js/faker/locale/pt_BR';
import instanciaPrisma from '../../connection/instance.js';

const prisma = instanciaPrisma.getConnection();

const editoras = [
    'Companhia das Letras', 'Record', 'Intrínseca', 'Rocco',
    'Planeta', 'Sextante', 'Darkside', 'Arqueiro', 'Alta Books', 'Novatec'
];

const statusOpcoes = ['DISPONIVEL', 'ALUGADO'];

async function createRandomBooks() {
    const total = await prisma.livro.count();

    if (total > 0) {
        console.log(`Ja existem ${total} livros no banco. Seed ignorado.`);
        return;
    }

    const seeds = [];

    for (let i = 1; i <= 20; i++) {
        // Sem um total de copias nao dava para calcular o que esta disponivel.
        const quantidadeTotal = faker.number.int({ min: 1, max: 8 });
        const quantidadeAlugada = faker.number.int({ min: 0, max: quantidadeTotal });

        seeds.push(
            prisma.livro.create({
                data: {
                    titulo: faker.lorem.words({ min: 2, max: 5 }),
                    autor: faker.person.fullName(),
                    dataLancamento: faker.date.between({ from: '1950-01-01', to: '2024-12-31' }),
                    editora: editoras[Math.floor(Math.random() * editoras.length)],
                    // Esgota o estoque quando todas as copias foram alugadas.
                    statusAluguel: quantidadeAlugada >= quantidadeTotal ? 'ALUGADO' : 'DISPONIVEL',
                    quantidadeTotal,
                    quantidadeAlugada,
                }
            })
        );
    }

    await prisma.$transaction(seeds);
    console.log('✅ 20 livros de seed gerados com sucesso!');
}

createRandomBooks()
    .catch((e) => {
        console.error('❌ Erro ao gerar seeds:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
