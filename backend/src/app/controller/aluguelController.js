import AluguelRepository from "../repository/aluguelRepository.js";

const aluguelRepository = new AluguelRepository();

/**
 * Traduz a mensagem do repository em status HTTP. O repository trabalha com
 * texto porque os erros sao levantados com `throw new Error`.
 */
function statusPorMensagem(mensagem) {
    if (mensagem.includes("não encontrado")) return 404;
    if (mensagem.includes("não pertence")) return 403;
    if (mensagem.includes("já alugou")) return 409;
    if (mensagem.includes("disponíveis")) return 409;
    if (mensagem.includes("já foi encerrado")) return 409;
    return 500;
}

function mensagemLimpa(mensagem) {
    return mensagem.replace("Repository: ", "").replace("AluguelRepository: ", "");
}

class AluguelController {

    async alugarController(requisicao, resposta) {
        try {
            const { id } = requisicao.params;
            const idLivro = parseInt(id, 10);

            if (isNaN(idLivro)) {
                return resposta.status(400).json({ mensagem: "ID inválido!" });
            }

            // exigirAutenticacao ja carregou o usuario, entao nao ha como
            // alugar em nome de outra pessoa.
            const { emprestimo, disponiveis } = await aluguelRepository.alugarLivro(
                requisicao.usuario.id,
                idLivro
            );

            return resposta.status(201).json({
                mensagem: "Livro alugado com sucesso!",
                data: emprestimo,
                disponiveis,
            });

        } catch (erro) {
            const status = statusPorMensagem(erro.message);

            return resposta.status(status).json({
                mensagem: status === 500 ? "Erro ao alugar livro!" : mensagemLimpa(erro.message),
                erro: erro.message,
            });
        }
    }

    async listarMeusController(requisicao, resposta) {
        try {
            const alugueis = await aluguelRepository.listarPorUsuario(requisicao.usuario.id);
            return resposta.status(200).json(alugueis);

        } catch (erro) {
            return resposta.status(500).json({
                mensagem: "Erro ao buscar seus aluguéis!",
                erro: erro.message
            });
        }
    }

    async devolverController(requisicao, resposta) {
        try {
            const { id } = requisicao.params;
            const idEmprestimo = parseInt(id, 10);

            if (isNaN(idEmprestimo)) {
                return resposta.status(400).json({ mensagem: "ID inválido!" });
            }

            const { emprestimo, livro } = await aluguelRepository.devolverLivro(
                requisicao.usuario.id,
                idEmprestimo
            );

            return resposta.status(200).json({
                mensagem: "Livro devolvido com sucesso!",
                data: emprestimo,
                disponiveis: livro ? livro.quantidadeTotal - livro.quantidadeAlugada : 0,
            });

        } catch (erro) {
            const status = statusPorMensagem(erro.message);

            return resposta.status(status).json({
                mensagem: status === 500 ? "Erro ao devolver livro!" : mensagemLimpa(erro.message),
                erro: erro.message,
            });
        }
    }
}

export default AluguelController;
