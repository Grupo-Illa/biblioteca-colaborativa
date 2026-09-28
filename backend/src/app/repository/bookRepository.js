import instanciaPrisma from "../../connection/instance.js";

const prisma = instanciaPrisma.getConnection();

class BookRepository {

    async createBook(data) {
        const livroExists = await prisma.livro.findFirst({
            where: {
                titulo: data.titulo,
                autor: data.autor
            }
        });

        if (livroExists) {
            throw new Error('Repository: Já existe um livro com este título e autor cadastrado!');
        }

        const livro = await prisma.livro.create({
            data: {
                titulo: data.titulo,
                autor: data.autor,
                dataLancamento: new Date(data.dataLancamento),
                editora: data.editora,
                // Faceta dos filtros da home. Vazio vira "Geral" para nunca
                // quebrar o agrupamento por categoria.
                categoria: data.categoria?.trim() || 'Geral',
                // Capa é opcional: sem URL a interface usa a imagem padrão.
                capa: data.capa?.trim() || null,
                statusAluguel: data.statusAluguel ?? 'DISPONIVEL',
                quantidadeAlugada: data.quantidadeAlugada ?? 0,
            }
        });

        return livro;
    }

    async showAllBooks() {
        const livros = await prisma.livro.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return livros;
    }

    async showBookById(id) {
        const livro = await prisma.livro.findUnique({
            where: { id: Number(id) },
            include: {
                // quantas pessoas estão esperando este livro
                _count: { select: { reservas: { where: { status: 'ATIVA' } } } },
            },
        });

        if (!livro) {
            throw new Error('Repository: Livro não encontrado!');
        }

        return livro;
    }

    async updateBook(id, data) {
        const livroExists = await prisma.livro.findUnique({
            where: { id: Number(id) }
        });

        if (!livroExists) {
            throw new Error('Repository: Livro não encontrado!');
        }

        // Remove campos vazios ou nulos para não sobrescrever dados existentes
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
        );

        // `statusAluguel`, `alugadoPor` e `alugadoEm` ficam fora do escopo do
        // PATCH: quem controla o empréstimo é rentBook/returnBook, que
        // mantêm os três campos coerentes entre si. Sem isso dava para marcar
        // um livro como ALUGADO sem dizer quem pegou.
        const { statusAluguel: _s, alugadoPor: _p, alugadoEm: _e, id: _id, ...safeData } = cleanData;

        // Converte a data caso venha no body
        if (safeData.dataLancamento) {
            safeData.dataLancamento = new Date(safeData.dataLancamento);
        }

        const livroAtualizado = await prisma.livro.update({
            where: { id: Number(id) },
            data: safeData
        });

        return livroAtualizado;
    }

    async deleteBook(id) {
        const livroExists = await prisma.livro.findUnique({
            where: { id: Number(id) }
        });

        if (!livroExists) {
            throw new Error('Repository: Livro não encontrado!');
        }

        await prisma.livro.delete({ where: { id: Number(id) } });
        return { message: 'Livro deletado com sucesso!' };
    }

    // ---------- Empréstimos ----------

    /**
     * Aluga o livro para `email`.
     *
     * O `updateMany` com `statusAluguel: DISPONIVEL` no where é o que resolve
     * a corrida entre dois usuários clicando "Alugar" no mesmo instante: a
     * condição é avaliada e aplicada na mesma instrução do banco, então só um
     * dos dois consegue casar com a linha. Com `findUnique` seguido de
     * `update` os dois leriam DISPONIVEL e o segundo sobrescreveria o
     * primeiro — o segundo aluguel "ganharia" e o primeiro usuário ficaria
     * com um livro que não é dele.
     */
    async rentBook(id, email) {
        const livro = await prisma.livro.findUnique({ where: { id: Number(id) } });
        if (!livro) {
            throw Object.assign(new Error('Livro não encontrado!'), { status: 404 });
        }

        const resultado = await prisma.livro.updateMany({
            where: { id: Number(id), statusAluguel: 'DISPONIVEL' },
            data: {
                statusAluguel: 'ALUGADO',
                alugadoPor: email,
                alugadoEm: new Date(),
            },
        });

        if (resultado.count === 0) {
            // Ou outro usuário acabou de pegar, ou o próprio já tinha.
            throw Object.assign(new Error('Este livro já está alugado!'), { status: 409 });
        }

        return this.showBookById(id);
    }

    /**
     * Devolve o livro. Só o dono do empréstimo ou um ADMIN pode.
     *
     * `avaliacao` é opcional e, quando vem, é gravada junto. A avaliação fica
     * ligada à devolução porque é a devolução que prova que a pessoa realmente
     * leu o livro — aceita qualquer outro caminho, e aí a nota vira fiction.
     */
    async returnBook(id, { email, role }, avaliacao = null) {
        const livro = await this.showBookById(id);

        if (livro.statusAluguel !== 'ALUGADO') {
            throw Object.assign(new Error('Este livro não está alugado!'), { status: 409 });
        }

        if (livro.alugadoPor !== email && role !== 'ADMIN') {
            throw Object.assign(
                new Error('Apenas quem alugou este livro pode devolvê-lo.'),
                { status: 403 }
            );
        }

        const devolvido = await prisma.livro.update({
            where: { id: Number(id) },
            data: {
                statusAluguel: 'DISPONIVEL',
                // nullable no schema, então o Prisma aceita null para limpar.
                alugadoPor: null,
                alugadoEm: null,
            },
        });

        if (avaliacao) {
            const avaliacaoRepo = (await import('./avaliacaoRepository.js')).default;
            await avaliacaoRepo.avaliarLivro(Number(id), {
                email: livro.alugadoPor ?? email,
                nota: avaliacao.nota,
                comentario: avaliacao.comentario,
            });
        }

        return devolvido;
    }

    /** Livros atualmente alugados por um usuário específico. */
    async listRentalsByUser(email) {
        return prisma.livro.findMany({
            where: { statusAluguel: 'ALUGADO', alugadoPor: email },
            orderBy: { alugadoEm: 'desc' },
        });
    }

    /**
     * Alterna a disponibilidade sem registrar empréstimo. Usado pelo ADMIN,
     * que precisa forçar a devolução de um livro de outra pessoa.
     */
    async setAvailability(id, disponivel) {
        await this.showBookById(id);
        return prisma.livro.update({
            where: { id: Number(id) },
            data: {
                statusAluguel: disponivel ? 'DISPONIVEL' : 'ALUGADO',
                ...(disponivel ? { alugadoPor: null, alugadoEm: null } : {}),
            },
        });
    }
}

export default BookRepository;
