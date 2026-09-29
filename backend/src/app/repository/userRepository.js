import instanciaPrisma from "../../connection/instance.js";
import bcrypt from "bcrypt";

const prisma = instanciaPrisma.getConnection();

/**
 * Colunas que podem sair do banco para fora da aplicação.
 *
 * `password` simplesmente NÃO está na lista, e isso é deliberado: com
 * `select` explícito o Prisma nem busca a coluna, então não existe caminho
 * em que o hash chegue a um controller e dali para o JSON. A alternativa
 * (buscar tudo e lembrar de desestruturar no controller) é fail-open — foi
 * exatamente assim que o hash vazou em buscarTodos e atualizarUsuario.
 */
const CAMPOS_PUBLICOS = {
    id: true,
    username: true,
    email: true,
    birthday: true,
    role: true,
    phone: true,
    createdAt: true,
    updatedAt: true,
};

/**
 * Prisma só aceita `select` com chaves, então o helper serve tanto para o
 * `select` (chave: true) quanto para o `omit` equivalente (chave: false).
 */
const CAMPOS_PRIVADOS = { password: false };

class userRepository{
    async findByEmail(email) {
        try {
            // Traz o hash de propósito: é o único jeito de conferir a senha
            // no bcrypt.compare. Este retorno NUNCA deve ir para a resposta —
            // quem chama precisa usar daqui só o id para gerar o token.
            return await prisma.user.findUnique({ where: { email } });
        } catch (error) {
            console.log('Repository: Erro ao buscar email! ', error.message);
            return null;
        }
    }

    async createUser(data) {
        try {
            const userExists = await prisma.user.findUnique({where: {email: data.email}}); //procura o usuário pra ver se ja existe
            if (!userExists) {
                const {username, password, email, birthday, phone} = data;
                const hashedPassword = await bcrypt.hash(data.password, 10);

                const create = prisma.user.create({
                    data: {
                        username,
                        password: hashedPassword,
                        email,
                        birthday: new Date(birthday),
                        phone
                    },
                    // Devolve o registro já sem o hash: o controller não
                    // precisa (e não deve) depender de desestruturar.
                    select: CAMPOS_PUBLICOS
                });

                return create
            } else {
                throw new Error('Repository: O email inserido já está em uso!')
            }

        } catch (error) {
            console.log('Repository: Erro no catch! ', error.message)
            throw error;
        }
    }

    async showAllUsers() {
        try {
            return await prisma.user.findMany({ select: CAMPOS_PUBLICOS });
        } catch (error) {
            console.log('Repository: Erro no cath! ', error.message)
            throw error;
        }
    }

    async updateUser(id, data) {
        try {
            const userExists = await prisma.user.findUnique({where: { id: Number(id) }}); //o Number é pra garantir que é um inteiro e não uma string
            if (!userExists) {
                throw new Error('Repository: ConflictError - Usuário não existe ')
            };

            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
            );

            // Allowlist de escrita: o body não escolhe quais colunas mexer.
            // `role` e `id` ficam de fora de propósito — sem isso qualquer
            // usuário se promove a ADMIN pelo próprio endpoint.
            const { role: _role, id: _id, password, ...safeData } = cleanData;

            // O hash precisa SUBSTITUIR a senha em texto puro, não ser
            // calculado e descartado. Antes este resultado era jogado fora e
            // o cleanData original seguia para o update, gravando a senha em
            // claro no banco.
            if (password) {
                safeData.password = await bcrypt.hash(password, 10);
            }

            return await prisma.user.update({
                where:{ id: Number(id) },
                data: safeData,
                select: CAMPOS_PUBLICOS
            });
        } catch (error) {
            console.log('Repository: Erro ao atualizar usuário! ', error.message);
            throw error;
        }
    }


    async deleteUser(id) {
        try {
            const userExists = await prisma.user.findUnique({where: { id: Number(id) }}); //o Number é pra garantir que é um inteiro e não uma string
            if (!userExists) {
                throw new Error('Repository: ConflictError - Usuário não existe ')
            };

            await prisma.user.delete({where:{ id: Number(id) }});
            return {message: 'Usuário Deletado com sucesso!'}

        } catch (error) {
            console.log('Repository: Erro ao deletar usuário! ', error);
            throw error;
        }
    }

}

export { CAMPOS_PUBLICOS, CAMPOS_PRIVADOS };
export default userRepository;
