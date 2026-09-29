import instanciaPrisma from "../../connection/instance.js";
import bcrypt from "bcrypt";

const prisma = instanciaPrisma.obterConexao();

class UsuarioRepository {
    async buscarPorEmail(email) {
        try {
            return await prisma.usuario.findUnique({ where: { email } });
        } catch (erro) {
            console.log('Repository: Erro ao buscar email! ', erro.message);
            return null;
        }
    }

    async criarUsuario(dados) {
        try {
            const usuarioExiste = await prisma.usuario.findUnique({ where: { email: dados.email } });
            if (!usuarioExiste) {
                const { nomeUsuario, senha, email, dataNascimento, telefone } = dados;
                const senhaHasheada = await bcrypt.hash(senha, 10);

                const promessaCriacao = prisma.usuario.create({
                    data: {
                        nomeUsuario,
                        senha: senhaHasheada,
                        email,
                        dataNascimento: new Date(dataNascimento),
                        telefone
                    }
                });

                return promessaCriacao;
            }

            throw new Error('Repository: O email inserido já está em uso!');

        } catch (erro) {
            // Engolir o erro aqui devolveria undefined e o controller cairia em
            // um TypeError, escondendo o motivo real (email duplicado, por
            // exemplo). Propagar deixa a mensagem chegar na resposta.
            throw erro;
        }
    }

    async listarTodos() {
        try {
            const promessaListagem = prisma.usuario.findMany();
            return promessaListagem;
        } catch (erro) {
            console.log('Repository: Erro ao listar usuarios! ', erro.message);
            throw erro;
        }
    }

    async atualizarUsuario(id, dados) {
        try {
            const usuarioExiste = await prisma.usuario.findUnique({ where: { id: Number(id) } });
            if (!usuarioExiste) {
                throw new Error('Repository: Usuário não existe!');
            }

            // Remove campos vazios ou nulos para não sobrescrever dados existentes
            const dadosLimpos = Object.fromEntries(
                Object.entries(dados).filter(([_, valor]) => valor !== "" && valor !== null && valor !== undefined)
            );

            if (dadosLimpos.senha) {
                // Antes a senha hasheada era calculada e descartada, e a senha
                // em texto puro era gravada. Aqui o valor hasheado e o que
                // realmente substitui a senha.
                dadosLimpos.senha = await bcrypt.hash(dadosLimpos.senha, 10);
            }

            const promessaAtualizacao = prisma.usuario.update({
                where: { id: Number(id) },
                data: dadosLimpos
            });
            return promessaAtualizacao;
        } catch (erro) {
            console.log('Repository: Erro ao atualizar usuário! ', erro.message);
            throw erro;
        }
    }

    async deletarUsuario(id) {
        try {
            const usuarioExiste = await prisma.usuario.findUnique({ where: { id: Number(id) } });
            if (!usuarioExiste) {
                throw new Error('Repository: Usuário não existe!');
            }

            await prisma.usuario.delete({ where: { id: Number(id) } });
            return { mensagem: 'Usuário Deletado com sucesso!' };

        } catch (erro) {
            console.log('Repository: Erro ao deletar usuário! ', erro);
            throw erro;
        }
    }
}

export default UsuarioRepository;
