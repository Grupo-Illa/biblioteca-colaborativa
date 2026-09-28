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

    async rentController(req, res) {
        try {
            const { id } = req.params;
            const livroId = parseInt(id, 10);

            if (isNaN(livroId)) {
                return res.status(400).json({ message: "ID inválido!" });
            }

            // requireAuth ja carregou o usuario, entao nao ha como alugar
            // em nome de outra pessoa.
            const { emprestimo, disponiveis } = await aluguelRepository.rentBook(
                req.user.id,
                livroId
            );

            return res.status(201).json({
                message: "Livro alugado com sucesso!",
                data: emprestimo,
                disponiveis,
            });

        } catch (error) {
            const status = statusPorMensagem(error.message);

            return res.status(status).json({
                message: status === 500 ? "Erro ao alugar livro!" : mensagemLimpa(error.message),
                error: error.message,
            });
        }
    }

    async listMineController(req, res) {
        try {
            const alugueis = await aluguelRepository.listByUser(req.user.id);
            return res.status(200).json(alugueis);

        } catch (error) {
            return res.status(500).json({
                message: "Erro ao buscar seus aluguéis!",
                error: error.message
            });
        }
    }

    async returnController(req, res) {
        try {
            const { id } = req.params;
            const emprestimoId = parseInt(id, 10);

            if (isNaN(emprestimoId)) {
                return res.status(400).json({ message: "ID inválido!" });
            }

            const { emprestimo, livro } = await aluguelRepository.returnBook(
                req.user.id,
                emprestimoId
            );

            return res.status(200).json({
                message: "Livro devolvido com sucesso!",
                data: emprestimo,
                disponiveis: livro ? livro.quantidadeTotal - livro.quantidadeAlugada : 0,
            });

        } catch (error) {
            const status = statusPorMensagem(error.message);

            return res.status(status).json({
                message: status === 500 ? "Erro ao devolver livro!" : mensagemLimpa(error.message),
                error: error.message,
            });
        }
    }
}

export default AluguelController;
