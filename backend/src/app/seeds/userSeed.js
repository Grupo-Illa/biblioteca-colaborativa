import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import instanciaPrisma from '../../connection/instance.js';

const prisma = instanciaPrisma.obterConexao()

// Senha em texto puro usada nos seeds. Guarde para conseguir logar.
const SENHA_PADRAO = 'senha123';
const DOMINIO = 'grupoilla.com.br';

async function criarUsuariosAleatorios() {

    const agora = new Date();
    const emailAdmin = `admin@${DOMINIO}`;

    // Evita duplicar os seeds a cada execucao. Usa o admin como marcador
    // para nao confundir com usuarios cadastrados pela aplicacao.
    const seedJaExiste = await prisma.usuario.findUnique({ where: { email: emailAdmin } });

    if (seedJaExiste) {
        console.log(`Seed ja executado (admin ${emailAdmin} existe). Ignorado.`);
        return;
    }

    // O login usa bcrypt.compare, entao a senha PRECISA estar com hash.
    const senhaHasheada = await bcrypt.hash(SENHA_PADRAO, 10);

    // exigirAdmin so libera quem tem perfil ADMIN, entao o seed precisa de um.
    const registros = []

    for (let i = 1; i <= 20; i++) {
        const email = `${faker.string.alphanumeric(6).toLowerCase()}@${DOMINIO}`;

        registros.push({
            nomeUsuario: faker.person.fullName(),
            senha: senhaHasheada,
            email: i === 1 ? emailAdmin : email,
            dataNascimento: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
            telefone: faker.phone.number({ style: 'national' }),
            perfil: i === 1 ? 'ADMIN' : 'USUARIO',
            criadoEm: agora,
            atualizadoEm: agora
        })

    }

    await prisma.usuario.createMany({ data: registros });

    console.log(`Registros de seeds gerados com sucesso! ${registros.length} usuarios.`);
    console.log(`Senha de todos: ${SENHA_PADRAO}`);
    console.log(`Admin: ${emailAdmin}`);
};

criarUsuariosAleatorios()
    .catch((erro) => {
        console.error(erro);
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
