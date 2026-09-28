import instanciaPrisma from "../../connection/instance.js";

const prisma = instanciaPrisma.getConnection();

// Prazo padrao do aluguel. Ajustavel por .env sem mexer no codigo.
const DIAS_ALUGUEL = Number.parseInt(process.env.DIAS_ALUGUEL ?? "14", 10);
const MS_POR_DIA = 86_400_000;

/**
 * Encerra os alugueis cujo prazo passou e devolve as copias ao estoque.
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
async function liberarCopia(tx, livroId) {    const livro = await tx.livro.findUnique({ where: { id: Number(livroId) } });

    if (!livro) return null;

    // Math.max evita contador negativo caso o livro ja tivesse sido removido.
    const quantidadeAlugada = Math.max(0, livro.quantidadeAlugada - 1);
    const statusAluguel =
        quantidadeAlugada >= livro.quantidadeTotal ? "ALUGADO" : "DISPONIVEL";

    return await tx.livro.update({
        where: { id: Number(livroId) },
        data: { quantidadeAlugada, statusAluguel },
    });
}

class AluguelRepository {
    /**
     * Aluga um exemplar para o usuario.
     *
     * Tudo dentro de uma transacao porque tres coisas precisam ser coerentes
     * juntas: nao repetir titulo para o mesmo usuario, nao passar do estoque
     * e nao liberar um aluguel que ja venceu.
     */
    async rentBook(userId, livroId) {
        return await prisma.$transaction(async (tx) => {
            await encerrarVencidos(tx);

            const livro = await tx.livro.findUnique({
                where: { id: Number(livroId) },
            });

            if (!livro) {
                throw new Error("Repository: Livro não encontrado!");
            }

            const jaAlugado = await tx.emprestimo.findFirst({
                where: { userId: Number(userId), livroId: Number(livroId), status: "ATIVO" },
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
                    userId: Number(userId),
                    livroId: Number(livroId),
                    prazoDevolucao: new Date(Date.now() + DIAS_ALUGUEL * MS_POR_DIA),
                },
            });

            const quantidadeAlugada = livro.quantidadeAlugada + 1;
            const statusAluguel =
                quantidadeAlugada >= livro.quantidadeTotal ? "ALUGADO" : "DISPONIVEL";

            await tx.livro.update({
                where: { id: Number(livroId) },
                data: { quantidadeAlugada, statusAluguel },
            });

            return {
                emprestimo,
                livro,
                disponiveis: livro.quantidadeTotal - quantidadeAlugada,
            };
        });
    }

    /** Lista os alugueis do usuario, encerrando antes os que ja venceram. */
    async listByUser(userId) {
        return await prisma.$transaction(async (tx) => {
            await encerrarVencidos(tx);

            return await tx.emprestimo.findMany({
                where: { userId: Number(userId) },
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

    /** Devolucao feita pelo proprio usuario. */
    async returnBook(userId, emprestimoId) {
        return await prisma.$transaction(async (tx) => {
            await encerrarVencidos(tx);

            const emprestimo = await tx.emprestimo.findUnique({
                where: { id: Number(emprestimoId) },
            });

            if (!emprestimo) {
                throw new Error("Repository: Aluguel não encontrado!");
            }

            if (emprestimo.userId !== Number(userId)) {
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

            // Releitura obrigatoria: `emprestimo` ainda e a versao anterior ao
            // update, e devolve-lo faria a API responder status ATIVO logo
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