import UsuarioRepository from "../repository/userRepository.js";
import bcrypt from "bcrypt"

const { criarUsuario, listarTodos, atualizarUsuario, deletarUsuario, buscarPorEmail } = new UsuarioRepository();

// Mapeia a mensagem do repository para status HTTP, como no controller de livros.
function respostaDeErro(erro, acao) {
    const mensagem = erro?.message ?? "";

    if (mensagem.includes('não existe') || mensagem.includes('não encontrado')) {
        return { status: 404, mensagem: 'Usuário não encontrado!' };
    }

    if (mensagem.includes('já está em uso')) {
        return { status: 409, mensagem: 'O email inserido já está em uso!' };
    }

    return { status: 500, mensagem: `Erro ao ${acao}!` };
}

class UsuarioController {
    async loginController(requisicao, resposta) {
        try {
            const { email, senha } = requisicao.body;
            if (!email || !senha) {
                return resposta.status(400).json({ mensagem: 'Email e senha são obrigatórios!' });
            }

            const usuario = await buscarPorEmail(email)
            if (!usuario) {
                return resposta.status(401).json({ mensagem: 'Usuário inválido!' });
            }

            const senhaConfere = await bcrypt.compare(senha, usuario.senha);
            if (!senhaConfere) {
                return resposta.status(401).json({ mensagem: 'Senha incorreta!' })
            }

            // A senha sai da resposta; o restante do cadastro vai junto.
            const { senha: _, ...dadosUsuario } = usuario;
            return resposta.status(200).json({ mensagem: 'Login realizado com sucesso!', usuario: dadosUsuario });

        } catch (erro) {
            return resposta.status(500).json({
                mensagem: 'Erro ao fazer login!',
                erro: erro.message
            });
        }
    }

    async criarController(requisicao, resposta) {
        try {
            const dados = requisicao.body;
            if (dados.dataNascimento) {
                dados.dataNascimento = new Date(dados.dataNascimento);
            }

            if (!dados.nomeUsuario || !dados.senha || !dados.email || !dados.dataNascimento) {
                return resposta.status(400).json({ mensagem: 'Parâmetros insuficientes para criar usuário!' })
            }

            const emailInstitucional = /^[^\s@]+@grupoilla\.com\.br$/;
            if (!emailInstitucional.test(dados.email)) {
                return resposta.status(400).json({ mensagem: 'Apenas emails institucionais @grupoilla.com.br são permitidos!' });
            }

            const usuario = await criarUsuario(dados);
            const { senha: _, ...dadosUsuario } = usuario;
            return resposta.status(201).json({ mensagem: 'Usuário criado!', usuario: dadosUsuario })

        } catch (erro) {
            const { status, mensagem } = respostaDeErro(erro, 'criar usuário');
            return resposta.status(status).json({ mensagem, erro: erro.message });
        }
    }

    async listarController(requisicao, resposta) {
        try {
            const usuarios = await listarTodos();
            return resposta.status(200).json(usuarios)
        } catch (erro) {
            return resposta.status(500).json({
                mensagem: 'Controller: Erro ao acessar a tabela!',
                erro: erro.message
            })
        }
    }

    async atualizarController(requisicao, resposta) {
        try {
            const { id } = requisicao.params;
            const dados = requisicao.body;
            const idUsuario = parseInt(id, 10);

            if (isNaN(idUsuario)) {
                return resposta.status(400).json({ mensagem: 'ID inválido!' });
            };

            if (dados.email) {
                const emailInstitucional = /^[^\s@]+@grupoilla\.com\.br$/;
                if (!emailInstitucional.test(dados.email)) {
                    return resposta.status(400).json({ mensagem: 'Apenas emails institucionais @grupoilla.com.br são permitidos!' });
                }
            }

            const usuario = await atualizarUsuario(idUsuario, dados);

            return resposta.status(200).json({ mensagem: 'Usuário atualizado!', usuario })
        } catch (erro) {
            const { status, mensagem } = respostaDeErro(erro, 'atualizar usuário');
            return resposta.status(status).json({ mensagem, erro: erro.message });
        }
    }

    async deletarController(requisicao, resposta) {
        try {
            const { id } = requisicao.params;
            if (id === null || id === undefined) {
                return resposta.status(400).json({ mensagem: 'Não foi possivel deletar o usuário! ID Obrigatório.' })
            };

            const resultado = await deletarUsuario(parseInt(id, 10));
            return resposta.status(200).json(resultado)

        } catch (erro) {
            const { status, mensagem } = respostaDeErro(erro, 'deletar usuário');
            return resposta.status(status).json({ mensagem, erro: erro.message });
        }
    }
}

export default UsuarioController;
