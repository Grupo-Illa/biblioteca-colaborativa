import instanciaPrisma from "../../connection/instance.js";

const prisma = instanciaPrisma.obterConexao();

// O email chega num header porque o projeto não usa sessão nem token JWT.
function emailDoHeader(requisicao) {
    return requisicao.headers['x-usuario-email'];
}

export async function exigirAutenticacao(requisicao, resposta, proximo) {
    try {
        const emailUsuario = emailDoHeader(requisicao);

        if (!emailUsuario) {
            return resposta.status(401).json({ mensagem: 'Usuário não autenticado!' });
        }

        const usuario = await prisma.usuario.findUnique({ where: { email: emailUsuario } });

        if (!usuario) {
            return resposta.status(401).json({ mensagem: 'Usuário não encontrado!' });
        }

        requisicao.usuario = usuario;
        proximo();
    } catch (erro) {
        return resposta.status(500).json({
            mensagem: 'Erro ao verificar autenticação!',
            erro: erro.message
        });
    }
}

export async function exigirAdmin(requisicao, resposta, proximo) {
    try {
        const emailUsuario = emailDoHeader(requisicao);

        if (!emailUsuario) {
            return resposta.status(401).json({ mensagem: 'Usuário não autenticado!' });
        }

        const usuario = await prisma.usuario.findUnique({ where: { email: emailUsuario } });

        if (!usuario) {
            return resposta.status(401).json({ mensagem: 'Usuário não encontrado!' });
        }

        if (usuario.perfil !== 'ADMIN') {
            return resposta.status(403).json({ mensagem: 'Acesso negado! Apenas administradores podem realizar esta ação.' });
        }

        requisicao.usuario = usuario;
        proximo();
    } catch (erro) {
        return resposta.status(500).json({
            mensagem: 'Erro ao verificar permissões!',
            erro: erro.message
        });
    }
}
