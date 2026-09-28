import instanciaPrisma from "../../connection/instance.js";
import { encerrarVencidos } from "./aluguelRepository.js";

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

        // O admin define quantos exemplares existem. Sem isto a contagem de
        // disponiveis nao faria sentido, porque o total viria sempre do seed.
        const quantidadeTotal = Number.parseInt(data.quantidadeTotal, 10);

        if (!Number.isInteger(quantidadeTotal) || quantidadeTotal < 1) {
            throw new Error('Repository: A quantidade de exemplares deve ser no mínimo 1!');
        }

        const livro = await prisma.livro.create({
            data: {
                titulo: data.titulo,
                autor: data.autor,
                dataLancamento: new Date(data.dataLancamento),
                editora: data.editora,
                statusAluguel: data.statusAluguel ?? 'DISPONIVEL',
                quantidadeTotal,
                quantidadeAlugada: data.quantidadeAlugada ?? 0,
            }
        });

        return livro;
    }

    async showAllBooks() {
        // Antes de listar, encerra o que venceu. Sem isso a contagem de
        // exemplares disponiveis ficaria defasada para quem nao aluga ha dias.
        await encerrarVencidos(prisma);

        const livros = await prisma.livro.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return livros;
    }

    async showBookById(id) {
        const livro = await prisma.livro.findUnique({
            where: { id: Number(id) }
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

        if (cleanData.quantidadeTotal !== undefined) {
            const total = Number.parseInt(cleanData.quantidadeTotal, 10);

            // Reduzir o total abaixo do que ja esta alugado deixaria o estoque
            // negativo, com mais copias emprestadas do que existem.
            if (!Number.isInteger(total) || total < 1) {
                throw new Error('Repository: A quantidade de exemplares deve ser no mínimo 1!');
            }

            if (total < livroExists.quantidadeAlugada) {
                throw new Error('Repository: Não é possível ter menos exemplares do que já estão alugados!');
            }

            cleanData.quantidadeTotal = total;

            // O status precisa acompanhar o novo total, ou o livro ficaria
            // marcado como DISPONIVEL sem nenhum exemplar sobrando.
            cleanData.statusAluguel =
                livroExists.quantidadeAlugada >= total ? 'ALUGADO' : 'DISPONIVEL';
        }

        // Converte a data caso venha no body
        if (cleanData.dataLancamento) {
            cleanData.dataLancamento = new Date(cleanData.dataLancamento);
        }

        const livroAtualizado = await prisma.livro.update({
            where: { id: Number(id) },
            data: cleanData
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

}

export default BookRepository;
