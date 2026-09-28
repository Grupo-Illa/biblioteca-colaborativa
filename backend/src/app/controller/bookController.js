import BookRepository from "../repository/bookRepository.js";
import avaliacaoRepository from "../repository/avaliacaoRepository.js";

const bookRepository = new BookRepository();

/** Valida o :id das rotas. Responde 400 e devolve null se não for número. */
function validarId(id, res) {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
        res.status(400).json({ message: 'ID inválido!' });
        return null;
    }
    return parsed;
}

/**
 * Extrai a avaliação opcional do corpo de uma devolução.
 * Devolve null quando o cliente não mandou nada, para não criar avaliação
 * vazia em toda devolução.
 */
function extrairAvaliacao(body) {
    const nota = body?.nota;
    const comentario = body?.comentario;

    if (nota === undefined || nota === null || nota === '') return null;

    return { nota: Number(nota), comentario };
}

/**
 * A capa é uma URL que o ADMIN digita. Validamos o esquema porque o valor
 * vai parar no `src` de um <img>: aceitar `javascript:` ou `data:` aqui
 * transformaria um campo de texto em vetor de XSS.
 */
function validarCapa(capa) {
    if (capa === undefined || capa === null || capa === '') return { ok: true };

    let url;
    try {
        url = new URL(String(capa).trim());
    } catch {
        return { ok: false, erro: 'A URL da capa é inválida!' };
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { ok: false, erro: 'A capa deve ser uma URL começando com http:// ou https://' };
    }

    return { ok: true };
}

class BookController {

    async createController(req, res) {
        try {
            const data = req.body;
            const camposObrigatorios = ['titulo', 'autor', 'dataLancamento', 'editora'];

            for (const campo of camposObrigatorios) {
                if (!data[campo]) {
                    return res.status(400).json({
                        message: `Campo obrigatório ausente: "${campo}"`
                    });
                }
            }

            const capa = validarCapa(data.capa);
            if (!capa.ok) {
                return res.status(400).json({ message: capa.erro });
            }

            const livro = await bookRepository.createBook(data);
            return res.status(201).json({ message: 'Livro cadastrado com sucesso!', data: livro });

        } catch (error) {
            return res.status(500).json({
                message: 'Erro ao cadastrar livro!',
                error: error.message
            });
        }
    }

    async showController(req, res) {
        try {
            const livros = await bookRepository.showAllBooks();
            return res.status(200).json(livros);
        } catch (error) {
            return res.status(500).json({
                message: 'Erro ao buscar livros!',
                error: error.message
            });
        }
    }

    async showByIdController(req, res) {
        try {
            const { id } = req.params;
            const userId = parseInt(id, 10);

            if (isNaN(userId)) {
                return res.status(400).json({ message: 'ID inválido!' });
            }

            const livro = await bookRepository.showBookById(userId);
            return res.status(200).json(livro);

        } catch (error) {
            const status = error.message.includes('não encontrado') ? 404 : 500;
            return res.status(status).json({
                message: 'Erro ao buscar livro!',
                error: error.message
            });
        }
    }

    async updateController(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const livroId = parseInt(id, 10);

            if (isNaN(livroId)) {
                return res.status(400).json({ message: 'ID inválido!' });
            }

            const capa = validarCapa(data.capa);
            if (!capa.ok) {
                return res.status(400).json({ message: capa.erro });
            }

            const livro = await bookRepository.updateBook(livroId, data);
            return res.status(200).json({ message: 'Livro atualizado com sucesso!', data: livro });

        } catch (error) {
            const status = error.message.includes('não encontrado') ? 404 : 500;
            return res.status(status).json({
                message: 'Erro ao atualizar livro!',
                error: error.message
            });
        }
    }

    async deleteController(req, res) {
        try {
            const { id } = req.params;
            const livroId = parseInt(id, 10);

            if (isNaN(livroId)) {
                return res.status(400).json({ message: 'ID inválido!' });
            }

            const result = await bookRepository.deleteBook(livroId);
            return res.status(200).json(result);

        } catch (error) {
            const status = error.message.includes('não encontrado') ? 404 : 500;
            return res.status(status).json({
                message: 'Erro ao deletar livro!',
                error: error.message
            });
        }
    }

    // ---------- Empréstimos ----------

    async rentController(req, res) {
        try {
            const { id } = req.params;
            const livroId = parseInt(id, 10);

            if (isNaN(livroId)) {
                return res.status(400).json({ message: 'ID inválido!' });
            }

            // O usuário vem do cookie (requireAuth), nunca do body: assim
            // ninguém_aluga no nome de outro.
            const livro = await bookRepository.rentBook(livroId, req.user.email);
            return res.status(200).json({ message: 'Livro alugado com sucesso!', data: livro });

        } catch (error) {
            return res.status(error.status ?? 500).json({
                message: error.status ? error.message : 'Erro ao alugar livro!',
                error: error.message
            });
        }
    }

    async returnController(req, res) {
        try {
            const livroId = validarId(req.params.id, res);
            if (!livroId) return;

            // Avaliação é opcional: quem devolve sem querer avaliar não é
            // obrigado a dar nota. Se vier, é gravada junto com a devolução.
            const avaliacao = extrairAvaliacao(req.body);

            const livro = await bookRepository.returnBook(livroId, req.user, avaliacao);

            // A regra escolhida para a fila é "libera e notifica": o livro
            // volta a ficar livre e devolvemos quem estava em primeiro lugar,
            // para o chamador poder avisar essa pessoa.
            const fila = await avaliacaoRepository.situacaoDaFila(livroId);

            return res.status(200).json({
                message: 'Livro devolvido com sucesso!',
                data: livro,
                fila,
            });

        } catch (error) {
            return res.status(error.status ?? 500).json({
                message: error.status ? error.message : 'Erro ao devolver livro!',
                error: error.message
            });
        }
    }

    // ---------- Avaliações ----------

    async reviewController(req, res) {
        try {
            const livroId = validarId(req.params.id, res);
            if (!livroId) return;

            const { nota, comentario } = req.body ?? {};

            const resultado = await avaliacaoRepository.avaliarLivro(livroId, {
                email: req.user.email,
                nota,
                comentario,
            });

            return res.status(201).json({ message: 'Avaliação registrada!', ...resultado });

        } catch (error) {
            return res.status(error.status ?? 500).json({
                message: error.status ? error.message : 'Erro ao avaliar livro!',
                error: error.message
            });
        }
    }

    async listReviewsController(req, res) {
        try {
            const livroId = validarId(req.params.id, res);
            if (!livroId) return;

            const avaliacoes = await avaliacaoRepository.listarAvaliacoes(livroId);
            return res.status(200).json(avaliacoes);

        } catch (error) {
            return res.status(500).json({
                message: 'Erro ao buscar avaliações!',
                error: error.message
            });
        }
    }

    // ---------- Reservas ----------

    async reserveController(req, res) {
        try {
            const livroId = validarId(req.params.id, res);
            if (!livroId) return;

            const resultado = await avaliacaoRepository.reservarLivro(livroId, req.user.email);
            return res.status(201).json({ message: 'Você entrou na fila!', ...resultado });

        } catch (error) {
            return res.status(error.status ?? 500).json({
                message: error.status ? error.message : 'Erro ao reservar livro!',
                error: error.message
            });
        }
    }

    async cancelReserveController(req, res) {
        try {
            const livroId = validarId(req.params.id, res);
            if (!livroId) return;

            await avaliacaoRepository.cancelarReserva(livroId, req.user.email);
            return res.status(200).json({ message: 'Reserva cancelada.' });

        } catch (error) {
            return res.status(500).json({
                message: 'Erro ao cancelar reserva!',
                error: error.message
            });
        }
    }

    async queueController(req, res) {
        try {
            const livroId = validarId(req.params.id, res);
            if (!livroId) return;

            const posicao = await avaliacaoRepository.posicaoNaFila(livroId, req.user.email);
            return res.status(200).json(posicao);

        } catch (error) {
            return res.status(500).json({
                message: 'Erro ao buscar fila!',
                error: error.message
            });
        }
    }

    /** Reservas do usuário, com a situação atual de cada livro. */
    async myReservationsController(req, res) {
        try {
            const reservas = await avaliacaoRepository.listarMinhasReservas(req.user.email);
            return res.status(200).json(reservas);

        } catch (error) {
            return res.status(500).json({
                message: 'Erro ao buscar suas reservas!',
                error: error.message
            });
        }
    }

    async myRentalsController(req, res) {
        try {
            const livros = await bookRepository.listRentalsByUser(req.user.email);
            return res.status(200).json(livros);

        } catch (error) {
            return res.status(500).json({
                message: 'Erro ao buscar seus empréstimos!',
                error: error.message
            });
        }
    }

    /** ADMIN alterna a disponibilidade / força a devolução de qualquer livro. */
    async setAvailabilityController(req, res) {
        try {
            const { id } = req.params;
            const livroId = parseInt(id, 10);

            if (isNaN(livroId)) {
                return res.status(400).json({ message: 'ID inválido!' });
            }

            const livro = await bookRepository.setAvailability(livroId, true);
            return res.status(200).json({ message: 'Livro marcado como disponível!', data: livro });

        } catch (error) {
            return res.status(error.status ?? 500).json({
                message: error.status ? error.message : 'Erro ao alterar disponibilidade!',
                error: error.message
            });
        }
    }
}

export default BookController;
