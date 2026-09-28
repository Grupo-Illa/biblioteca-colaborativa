import BookRepository from "../repository/bookRepository.js";

const bookRepository = new BookRepository();

/**
 * Erros de entrada tem que sair como 4xx, nao 500. Sem isto o admin que
 * digita 0 exemplares receberia "Erro ao cadastrar livro!" em vez do motivo
 * real, e o log marcaria uma falha de servidor inexistente.
 */
function respostaDeErro(error, acao) {
    const mensagem = error.message ?? "";

    if (mensagem.includes('não encontrado')) {
        return { status: 404, message: 'Registro não encontrado!' };
    }

    if (mensagem.includes('Já existe')) {
        return { status: 409, message: mensagem.replace('Repository: ', '') };
    }

    // Validacao de dado enviado pelo cliente.
    if (
        mensagem.includes('deve ser no mínimo') ||
        mensagem.includes('Não é possível ter menos')
    ) {
        return { status: 400, message: mensagem.replace('Repository: ', '') };
    }

    return { status: 500, message: `Erro ao ${acao}!` };
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

            const livro = await bookRepository.createBook(data);
            return res.status(201).json({ message: 'Livro cadastrado com sucesso!', data: livro });

        } catch (error) {
            const { status, message } = respostaDeErro(error, 'cadastrar livro');
            return res.status(status).json({ message, error: error.message });
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

            const livro = await bookRepository.updateBook(livroId, data);
            return res.status(200).json({ message: 'Livro atualizado com sucesso!', data: livro });

        } catch (error) {
            const { status, message } = respostaDeErro(error, 'atualizar livro');
            return res.status(status).json({ message, error: error.message });
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
            const { status, message } = respostaDeErro(error, 'deletar livro');
            return res.status(status).json({ message, error: error.message });
        }
    }
}

export default BookController;
