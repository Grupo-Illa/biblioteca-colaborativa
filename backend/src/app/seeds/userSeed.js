import {faker} from '@faker-js/faker';
import bcrypt from 'bcrypt';
import instanciaPrisma from '../../connection/instance.js';

const prisma = instanciaPrisma.getConnection()

// Senha em texto puro usada nos seeds. Guarde para conseguir logar.
const SENHA_PADRAO = 'senha123';
const DOMINIO = 'grupoilla.com.br';

async function createRandomUser() {

    const agora = new Date();
    const emailAdmin = `admin@${DOMINIO}`;

    // Evita duplicar os seeds a cada execucao. Usa o admin como marcador
    // para nao confundir com usuarios cadastrados pela aplicacao.
    const seedJaExiste = await prisma.user.findUnique({ where: { email: emailAdmin } });

    if (seedJaExiste) {
        console.log(`Seed ja executado (admin ${emailAdmin} existe). Ignorado.`);
        return;
    }

    // O login usa bcrypt.compare, entao a senha PRECISA estar com hash.
    const senhaHasheada = await bcrypt.hash(SENHA_PADRAO, 10);

    // requireAdmin so libera quem tem role ADMIN, entao o seed precisa de um.
    const seeds = []

    for (let i = 1; i <= 20; i++) {
        const email = `${faker.string.alphanumeric(6).toLowerCase()}@${DOMINIO}`;

        seeds.push({
            username: faker.person.fullName(),
            password: senhaHasheada,
            email: i === 1 ? emailAdmin : email,
            birthday: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
            phone: faker.phone.number({ style: 'national' }),
            role: i === 1 ? 'ADMIN' : 'USER',
            createdAt: agora,
            updatedAt: agora
        })

    }

    await prisma.user.createMany({ data: seeds });

    console.log(`Registros de seeds gerados com sucesso! ${seeds.length} usuarios.`);
    console.log(`Senha de todos: ${SENHA_PADRAO}`);
    console.log(`Admin: ${emailAdmin}`);
};

createRandomUser()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
