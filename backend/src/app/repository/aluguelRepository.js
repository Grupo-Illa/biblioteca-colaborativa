import instanciaPrisma from "../../connection/instance.js";

const prisma = instanciaPrisma.obterConexao();

// Prazo padrao do aluguel. Ajustavel por .env sem mexer no codigo.
const DIAS_ALUGUEL = Number.parseInt(process.env.DIAS_ALUGUEL ?? "14", 10);
const MS_POR_DIA = 86_400_000;

/**
 * Encerra os aluguéis cujo prazo passou e devolve as cópias ao estoque.
 *
 * Roda dentro da transação de quem chama, para que a leitura de estoque
 * nunca aconteça em cima de um prazo que já venceu. Sem isso o exemplar
 * ficaria ocupado para sempre, já que não existe cron no projeto.
 */
async function encerrarVencidos(tx) {
    const agora = new Date();

    const vencidos = await tx.emprestimo.findMany({
        where: { status: "ATIVO", prazoDevolucao: { lt: agora } },
        select: { id: true, livroId: true },
    });

    for (const vencido of vencidos) {
        await tx.emprestimo.update({
            where: { id: vencido.id },
            data: { status: "VENCIDO", dataDevolucao: agora },
        });
        await liberarCopia(tx, vencido.livroId);
    }

    return vencidos.length;
}

/** Devolve uma unidade ao estoque e recalcula o status agregado do livro. */
async function liberarCopia(tx, idLivro) {
    const livro = await tx.livro.findUnique({ where: { id: Number(idLivro) } });

    if (!livro) return null;

    // Math.max evita contador negativo caso o livro já tivesse sido removido.
    const quantidadeAlugada = Math.max(0, livro.quantidadeAlugada - 1);
    const statusAluguel =
        quantidadeAlugada >= livro.quantidadeTotal ? "ALUGADO" : "DISPONIVEL";

    return await tx.livro.update({
        where: { id: Number(idLivro) },
        data: { quantidadeAlugada, statusAluguel },
    });
}

class AluguelRepository {
    /**
     * Aluga um exemplar para o usuário.
     *
     * Tudo dentro de uma transação porque três coisas precisam ser coerentes
     * juntas: não repetir título para o mesmo usuário, não passar do estoque
     * e não liberar um aluguel que já venceu.
     */
    async alugarLivro(idUsuario, idLivro) {
        return await prisma.$transaction(async (tx) => {
            await encerrarVencidos(tx);

            const livro = await tx.livro.findUnique({
                where: { id: Number(idLivro) },
            });

            if (!livro) {
                throw new Error("Repository: Livro não encontrado!");
            }

            const jaAlugado = await tx.emprestimo.findFirst({
                where: {
                    usuarioId: Number(idUsuario),
                    livroId: Number(idLivro),
                    status: "ATIVO",
                },
            });

            if (jaAlugado) {
                throw new Error("Repository: Você já alugou este livro e ainda não devolveu!");
            }

            const disponiveis = livro.quantidadeTotal - livro.quantidadeAlugada;

            if (disponiveis <= 0) {
                throw new Error("Repository: Não há cópias disponíveis deste livro!");
            }

            const emprestimo = await tx.emprestimo.create({
                data: {
                    usuarioId: Number(idUsuario),
                    livroId: Number(idLivro),
                    prazoDevolucao: new Date(Date.now() + DIAS_ALUGUEL * MS_POR_DIA),
                },
            });

            const quantidadeAlugada = livro.quantidadeAlugada + 1;
            const statusAluguel =
                quantidadeAlugada >= livro.quantidadeTotal ? "ALUGADO" : "DISPONIVEL";

            await tx.livro.update({
                where: { id: Number(idLivro) },
                data: { quantidadeAlugada, statusAluguel },
            });

            return {
                emprestimo,
                livro,
                disponiveis: livro.quantidadeTotal - quantidadeAlugada,
            };
        });
    }

    /** Lista os aluguéis do usuário, encerrando antes os que já venceram. */
    async listarPorUsuario(idUsuario) {
        return await prisma.$transaction(async (tx) => {
            await encerrarVencidos(tx);

            return await tx.emprestimo.findMany({
                where: { usuarioId: Number(idUsuario) },
                orderBy: { dataAluguel: "desc" },
                include: {
                    livro: {
                        select: {
                            id: true,
                            titulo: true,
                            autor: true,
                            editora: true,
                            quantidadeTotal: true,
                            quantidadeAlugada: true,
                        },
                    },
                },
            });
        });
    }

    /** Devolução feita pelo próprio usuário. */
    async devolverLivro(idUsuario, idEmprestimo) {
        return await prisma.$transaction(async (tx) => {
            await encerrarVencidos(tx);

            const emprestimo = await tx.emprestimo.findUnique({
                where: { id: Number(idEmprestimo) },
            });

            if (!emprestimo) {
                throw new Error("Repository: Aluguel não encontrado!");
            }

            if (emprestimo.usuarioId !== Number(idUsuario)) {
                throw new Error("Repository: Este aluguel não pertence a você!");
            }

            if (emprestimo.status !== "ATIVO") {
                throw new Error("Repository: Este aluguel já foi encerrado!");
            }

            await tx.emprestimo.update({
                where: { id: emprestimo.id },
                data: { status: "DEVOLVIDO", dataDevolucao: new Date() },
            });

            const livro = await liberarCopia(tx, emprestimo.livroId);

            // Releitura obrigatória: `emprestimo` ainda é a versão anterior ao
            // update, e devolvê-lo faria a API responder status ATIVO logo
            // depois de devolver o livro.
            const atualizado = await tx.emprestimo.findUnique({
                where: { id: emprestimo.id },
            });

            return { emprestimo: atualizado, livro };
        });
    }
}

export { encerrarVencidos, liberarCopia };
export default AluguelRepository;
