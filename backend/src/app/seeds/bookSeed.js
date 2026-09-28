import { faker } from '@faker-js/faker/locale/pt_BR';
import instanciaPrisma from '../../connection/instance.js';

const prisma = instanciaPrisma.obterConexao();

const editoras = [
    'Compania das Letras', 'Record', 'IntrÃ­nseca', 'Rocco',
    'Planeta', 'Sextante', 'Darkside', 'Arqueiro', 'Alta Books', 'Novatec'
];

async function criarLivrosAleatorios() {
    const total = await prisma.livro.count();

    if (total > 0) {
        console.log(`Ja existem ${total} livros no banco. Seed ignorado.`);
        return;
    }

    const registros = [];

    for (let i = 1; i <= 20; i++) {
        // Sem um total de copias nao dava para calcular o que esta disponivel.
        const quantidadeTotal = faker.number.int({ min: 1, max: 8 });
        const quantidadeAlugada = faker.number.int({ min: 0, max: quantidadeTotal });

        registros.push(
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

    await prisma.$transaction(registros);
    console.log('âœ… 20 livros de seed gerados com sucesso!');
}

criarLivrosAleatorios()
    .catch((erro) => {
        console.error('âŒ Erro ao gerar seeds:', erro);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
