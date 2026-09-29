import instanciaPrisma from "../../connection/instance.js";
import { encerrarVencidos } from "./aluguelRepository.js";

const prisma = instanciaPrisma.obterConexao();

class LivroRepository {

    async criarLivro(dados) {
        const livroExiste = await prisma.livro.findFirst({
            where: {
                titulo: dados.titulo,
                autor: dados.autor
            }
        });

        if (livroExiste) {
            throw new Error('Repository: Já existe um livro com este título e autor cadastrado!');
        }

        // O admin define quantos exemplares existem. Sem isto a contagem de
        // disponíveis não faria sentido, porque o total viria sempre do seed.
        const quantidadeTotal = Number.parseInt(dados.quantidadeTotal, 10);

        if (!Number.isInteger(quantidadeTotal) || quantidadeTotal < 1) {
            throw new Error('Repository: A quantidade de exemplares deve ser no mínimo 1!');
        }

        const livro = await prisma.livro.create({
            data: {
                titulo: dados.titulo,
                autor: dados.autor,
                dataLancamento: new Date(dados.dataLancamento),
                editora: dados.editora,
                statusAluguel: dados.statusAluguel ?? 'DISPONIVEL',
                quantidadeTotal,
                quantidadeAlugada: dados.quantidadeAlugada ?? 0,
            }
        });

        return livro;
    }

    async listarTodos() {
        // Antes de listar, encerra o que venceu. Sem isso a contagem de
        // exemplares disponíveis ficaria defasada para quem não aluga há dias.
        await encerrarVencidos(prisma);

        // As notas vêm anexadas para o cálculo da média rodar no mesmo
        // round-trip. Sem isto o front exibiria nota 0 em todo livro.
        const livros = await prisma.livro.findMany({
            orderBy: { criadoEm: 'desc' },
            include: { avaliacoes: { select: { nota: true } } },
        });

        return livros.map((livro) => {
            const { avaliacoes, ...resto } = livro;
            const soma = avaliacoes.reduce((total, a) => total + a.nota, 0);

            return {
                ...resto,
                notaMedia: avaliacoes.length > 0
                    ? Math.round((soma / avaliacoes.length) * 10) / 10
                    : null,
                quantidadeAvaliacoes: avaliacoes.length,
            };
        });
    }

    async buscarPorId(id) {
        const livro = await prisma.livro.findUnique({
            where: { id: Number(id) },
            include: { avaliacoes: { select: { nota: true } } },
        });

        if (!livro) {
            throw new Error('Repository: Livro não encontrado!');
        }

        const { avaliacoes, ...resto } = livro;
        const soma = avaliacoes.reduce((total, a) => total + a.nota, 0);

        return {
            ...resto,
            notaMedia: avaliacoes.length > 0
                ? Math.round((soma / avaliacoes.length) * 10) / 10
                : null,
            quantidadeAvaliacoes: avaliacoes.length,
        };
    }

    async atualizarLivro(id, dados) {
        const livroExiste = await prisma.livro.findUnique({
            where: { id: Number(id) }
        });

        if (!livroExiste) {
            throw new Error('Repository: Livro não encontrado!');
        }

        // Remove campos vazios ou nulos para não sobrescrever dados existentes
        const dadosLimpos = Object.fromEntries(
            Object.entries(dados).filter(([_, valor]) => valor !== "" && valor !== null && valor !== undefined)
        );

        if (dadosLimpos.quantidadeTotal !== undefined) {
            const total = Number.parseInt(dadosLimpos.quantidadeTotal, 10);

            // Reduzir o total abaixo do que já está alugado deixaria o estoque
            // negativo, com mais cópias emprestadas do que existem.
            if (!Number.isInteger(total) || total < 1) {
                throw new Error('Repository: A quantidade de exemplares deve ser no mínimo 1!');
            }

            if (total < livroExiste.quantidadeAlugada) {
                throw new Error('Repository: Não é possível ter menos exemplares do que já estão alugados!');
            }

            dadosLimpos.quantidadeTotal = total;

            // O status precisa acompanhar o novo total, ou o livro ficaria
            // marcado como DISPONIVEL sem nenhum exemplar sobrando.
            dadosLimpos.statusAluguel =
                livroExiste.quantidadeAlugada >= total ? 'ALUGADO' : 'DISPONIVEL';
        }

        // Converte a data caso venha no body
        if (dadosLimpos.dataLancamento) {
            dadosLimpos.dataLancamento = new Date(dadosLimpos.dataLancamento);
        }

        const livroAtualizado = await prisma.livro.update({
            where: { id: Number(id) },
            data: dadosLimpos
        });

        return livroAtualizado;
    }

    async deletarLivro(id) {
        const livroExiste = await prisma.livro.findUnique({
            where: { id: Number(id) }
        });

        if (!livroExiste) {
            throw new Error('Repository: Livro não encontrado!');
        }

        await prisma.livro.delete({ where: { id: Number(id) } });
        return { mensagem: 'Livro deletado com sucesso!' };
    }
}

export default LivroRepository;
