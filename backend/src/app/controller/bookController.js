import LivroRepository from "../repository/bookRepository.js";

const livroRepository = new LivroRepository();

/**
 * Erros de entrada tem que sair como 4xx, nao 500. Sem isto o admin que
 * digita 0 exemplares receberia "Erro ao cadastrar livro!" em vez do motivo
 * real, e o log marcaria uma falha de servidor inexistente.
 */
function respostaDeErro(erro, acao) {
    const mensagem = erro.message ?? "";

    if (mensagem.includes('não encontrado')) {
        return { status: 404, mensagem: 'Registro não encontrado!' };
    }

    if (mensagem.includes('Já existe')) {
        return { status: 409, mensagem: mensagem.replace('Repository: ', '') };
    }

    // Validacao de dado enviado pelo cliente.
    if (
        mensagem.includes('deve ser no mínimo') ||
        mensagem.includes('Não é possível ter menos')
    ) {
        return { status: 400, mensagem: mensagem.replace('Repository: ', '') };
    }

    return { status: 500, mensagem: `Erro ao ${acao}!` };
}

class LivroController {

    async criarController(requisicao, resposta) {
        try {
            const dados = requisicao.body;
            const camposObrigatorios = ['titulo', 'autor', 'dataLancamento', 'editora'];

            for (const campo of camposObrigatorios) {
                if (!dados[campo]) {
                    return resposta.status(400).json({
                        mensagem: `Campo obrigatório ausente: "${campo}"`
                    });
                }
            }

            const livro = await livroRepository.criarLivro(dados);
            return resposta.status(201).json({ mensagem: 'Livro cadastrado com sucesso!', data: livro });

        } catch (erro) {
            const { status, mensagem } = respostaDeErro(erro, 'cadastrar livro');
            return resposta.status(status).json({ mensagem, erro: erro.message });
        }
    }

    async listarController(requisicao, resposta) {
        try {
            const livros = await livroRepository.listarTodos();
            return resposta.status(200).json(livros);
        } catch (erro) {
            return resposta.status(500).json({
                mensagem: 'Erro ao buscar livros!',
                erro: erro.message
            });
        }
    }

    async buscarPorIdController(requisicao, resposta) {
        try {
            const { id } = requisicao.params;
            const idLivro = parseInt(id, 10);

            if (isNaN(idLivro)) {
                return resposta.status(400).json({ mensagem: 'ID inválido!' });
            }

            const livro = await livroRepository.buscarPorId(idLivro);
            return resposta.status(200).json(livro);

        } catch (erro) {
            const status = erro.message.includes('não encontrado') ? 404 : 500;
            return resposta.status(status).json({
                mensagem: 'Erro ao buscar livro!',
                erro: erro.message
            });
        }
    }

    async atualizarController(requisicao, resposta) {
        try {
            const { id } = requisicao.params;
            const idLivro = parseInt(id, 10);

            if (isNaN(idLivro)) {
                return resposta.status(400).json({ mensagem: 'ID inválido!' });
            }

            const livro = await livroRepository.atualizarLivro(idLivro, requisicao.body);
            return resposta.status(200).json({ mensagem: 'Livro atualizado com sucesso!', data: livro });

        } catch (erro) {
            const { status, mensagem } = respostaDeErro(erro, 'atualizar livro');
            return resposta.status(status).json({ mensagem, erro: erro.message });
        }
    }

    async deletarController(requisicao, resposta) {
        try {
            const { id } = requisicao.params;
            const idLivro = parseInt(id, 10);

            if (isNaN(idLivro)) {
                return resposta.status(400).json({ mensagem: 'ID inválido!' });
            }

            const resultado = await livroRepository.deletarLivro(idLivro);
            return resposta.status(200).json(resultado);

        } catch (erro) {
            const { status, mensagem } = respostaDeErro(erro, 'deletar livro');
            return resposta.status(status).json({ mensagem, erro: erro.message });
        }
    }
}

export default LivroController;
