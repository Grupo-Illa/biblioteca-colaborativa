import AvaliacaoRepository from "../repository/avaliacaoRepository.js";
import instanciaPrisma from "../../connection/instance.js";

const avaliacaoRepository = new AvaliacaoRepository();
const prisma = instanciaPrisma.obterConexao();

function statusPorMensagem(mensagem) {
    if (mensagem.includes("não encontrado")) return 404;
    // Nota fora da faixa e dado invalido do cliente, nao erro de servidor.
    if (mensagem.includes("1 a 5")) return 400;
    if (mensagem.includes("já alugou")) return 403;
    return 500;
}

function mensagemLimpa(mensagem) {
    return mensagem.replace("Repository: ", "").replace("AvaliacaoRepository: ", "");
}

class AvaliacaoController {

    async avaliarController(requisicao, resposta) {
        try {
            const { livroId, nota, comentario } = requisicao.body;
            const idLivro = parseInt(livroId, 10);

            if (isNaN(idLivro)) {
                return resposta.status(400).json({ mensagem: "ID do livro inválido!" });
            }

            const avaliacao = await avaliacaoRepository.avaliarLivro(
                requisicao.usuario.id,
                idLivro,
                nota,
                comentario,
            );

            return resposta.status(201).json({
                mensagem: "Avaliação registrada com sucesso!",
                data: avaliacao,
            });

        } catch (erro) {
            const status = statusPorMensagem(erro.message);

            return resposta.status(status).json({
                mensagem: status === 500 ? "Erro ao registrar avaliação!" : mensagemLimpa(erro.message),
                erro: erro.message,
            });
        }
    }

    async listarMinhasController(requisicao, resposta) {
        try {
            const avaliacoes = await avaliacaoRepository.listarDoUsuario(requisicao.usuario.id);
            return resposta.status(200).json(avaliacoes);

        } catch (erro) {
            return resposta.status(500).json({
                mensagem: "Erro ao buscar suas avaliações!",
                erro: erro.message,
            });
        }
    }

    /**
     * Titulos que o usuario pode avaliar agora. Vai junto das avaliacoes ja
     * feitas para o front nao precisar cruzar os dois Responses.
     */
    async listarLivrosAvaliaveisController(requisicao, resposta) {
        try {
            const [ids, avaliacoes] = await Promise.all([
                avaliacaoRepository.listarLivrosAvaliaveis(requisicao.usuario.id),
                avaliacaoRepository.listarDoUsuario(requisicao.usuario.id),
            ]);

            return resposta.status(200).json({
                idsLivrosAvaliaveis: ids,
                avaliacoes,
            });

        } catch (erro) {
            return resposta.status(500).json({
                mensagem: "Erro ao verificar livros avaliáveis!",
                erro: erro.message,
            });
        }
    }

    /**
     * Avaliacoes de um livro. Sem exigir login: quem olha o acervo pode ler as
     * opinioes, do mesmo modo que ve titulo, autor e numero de exemplares.
     */
    async listarPorLivroController(requisicao, resposta) {
        try {
            const { id } = requisicao.params;
            const idLivro = parseInt(id, 10);

            if (isNaN(idLivro)) {
                return resposta.status(400).json({ mensagem: "ID inválido!" });
            }

            const livro = await prisma.livro.findUnique({
                where: { id: idLivro },
                select: { id: true },
            });

            if (!livro) {
                return resposta.status(404).json({ mensagem: "Livro não encontrado!" });
            }

            const avaliacoes = await avaliacaoRepository.listarPorLivro(idLivro);

            return resposta.status(200).json(avaliacoes);

        } catch (erro) {
            return resposta.status(500).json({
                mensagem: "Erro ao buscar as avaliações do livro!",
                erro: erro.message,
            });
        }
    }
}

export default AvaliacaoController;
