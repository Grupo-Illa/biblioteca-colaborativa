import instanciaPrisma from "../../connection/instance.js";

const prisma = instanciaPrisma.obterConexao();

const NOTA_MINIMA = 1;
const NOTA_MAXIMA = 5;

class AvaliacaoRepository {

    /**
     * Registra ou atualiza a nota do usuario para um livro.
     *
     * So aceita livro que o usuario realmente alugou, em qualquer situacao:
     * com o exemplar em maos, ja devolvido ou com prazo vencido. E o que faz
     * o titulo continuar avaliavel depois da devolucao.
     */
    async avaliarLivro(idUsuario, idLivro, nota, comentario) {
        const notaNumerica = Number.parseInt(nota, 10);

        if (!Number.isInteger(notaNumerica) || notaNumerica < NOTA_MINIMA || notaNumerica > NOTA_MAXIMA) {
            throw new Error("Repository: A nota deve ser um número de 1 a 5!");
        }

        const emprestimo = await prisma.emprestimo.findFirst({
            where: { usuarioId: Number(idUsuario), livroId: Number(idLivro) },
        });

        if (!emprestimo) {
            throw new Error("Repository: Você só pode avaliar livros que já alugou!");
        }

        // Registro repetido substitui a nota anterior em vez de criar outra
        // linha, e a constraint unica (usuarioId, livroId) garante isso.
        return await prisma.avaliacao.upsert({
            where: {
                usuarioId_livroId: {
                    usuarioId: Number(idUsuario),
                    livroId: Number(idLivro),
                },
            },
            create: {
                usuarioId: Number(idUsuario),
                livroId: Number(idLivro),
                nota: notaNumerica,
                comentario: comentario?.trim() ? comentario.trim() : null,
            },
            update: {
                nota: notaNumerica,
                comentario: comentario?.trim() ? comentario.trim() : null,
            },
            include: { livro: { select: { id: true, titulo: true, autor: true } } },
        });
    }

    /** Notas dadas pelo usuario, com o titulo de cada uma. */
    async listarDoUsuario(idUsuario) {
        return await prisma.avaliacao.findMany({
            where: { usuarioId: Number(idUsuario) },
            orderBy: { atualizadoEm: "desc" },
            include: {
                livro: { select: { id: true, titulo: true, autor: true, editora: true } },
            },
        });
    }

    /** Títulos que o usuario já alugou e portanto pode avaliar. */
    async listarLivrosAvaliaveis(idUsuario) {
        const emprestimos = await prisma.emprestimo.findMany({
            where: { usuarioId: Number(idUsuario) },
            select: { livroId: true },
            distinct: ["livroId"],
        });
        return emprestimos.map((e) => e.livroId);
    }

    /**
     * Avaliacoes publicas de um livro, com o nome de quem avaliou.
     *
     * O select busca so `nomeUsuario`. Trazer o `email` junto exporia o
     * endereco institucional de quem avaliou para qualquer pessoa que abrir o
     * livro, e o endpoint nao exige login.
     */
    async listarPorLivro(idLivro) {
        return await prisma.avaliacao.findMany({
            where: { livroId: Number(idLivro) },
            orderBy: { atualizadoEm: "desc" },
            select: {
                id: true,
                nota: true,
                comentario: true,
                criadoEm: true,
                atualizadoEm: true,
                usuario: { select: { nomeUsuario: true } },
            },
        });
    }
}

export default AvaliacaoRepository;
