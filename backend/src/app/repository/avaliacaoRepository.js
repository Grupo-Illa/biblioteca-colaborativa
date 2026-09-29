import instanciaPrisma from "../../connection/instance.js";

const prisma = instanciaPrisma.getConnection();

/**
 * Recalcula media/total do livro a partir das avaliações.
 *
 * Guardamos o agregado em colunas em vez de calcular a cada listagem porque
 * o card precisa da nota em toda renderização; mas recalculamos sempre a
 * partir da fonte, então não existe média desatualizada.
 */
async function recalcularMedia(livroId) {
    const stats = await prisma.avaliacao.aggregate({
        where: { livroId },
        _avg: { nota: true },
        _count: { nota: true },
    });

    const media = stats._avg.nota ?? 0;
    const total = stats._count.nota;

    await prisma.livro.update({
        where: { id: livroId },
        data: {
            // arredonda para 1 casa: evita float feio no JSON (ex: 4.199999)
            mediaNotas: Math.round(media * 10) / 10,
            totalAvaliacoes: total,
        },
    });

    return { mediaNotas: Math.round(media * 10) / 10, totalAvaliacoes: total };
}

// ---------- Avaliações ----------

/**
 * Cria ou atualiza a avaliação do usuário sobre o livro.
 * O `@@unique([livroId, userEmail])` do schema permite o upsert direto.
 */
async function avaliarLivro(livroId, { email, nota, comentario }) {
    const livro = await prisma.livro.findUnique({ where: { id: Number(livroId) } });
    if (!livro) {
        throw Object.assign(new Error('Livro não encontrado!'), { status: 404 });
    }

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        throw Object.assign(new Error('A nota deve ser um número de 1 a 5!'), { status: 400 });
    }

    const texto = (comentario ?? "").trim();
    if (texto.length > 1000) {
        throw Object.assign(new Error('O comentário deve ter no máximo 1000 caracteres!'), { status: 400 });
    }

    const avaliacao = await prisma.avaliacao.upsert({
        where: { livroId_userEmail: { livroId: Number(livroId), userEmail: email } },
        create: {
            livroId: Number(livroId),
            userEmail: email,
            nota,
            comentario: texto || null,
        },
        update: { nota, comentario: texto || null },
    });

    const agregado = await recalcularMedia(Number(livroId));
    return { avaliacao, ...agregado };
}

function listarAvaliacoes(livroId) {
    return prisma.avaliacao.findMany({
        where: { livroId: Number(livroId) },
        orderBy: { createdAt: 'desc' },
    });
}

// ---------- Reservas ----------

/**
 * Entra na fila do livro.
 *
 * A posição é derivada (quantas reservas ativas são mais antigas que a minha),
 * e não um contador guardado — assim não existe número que possa dessincronizar
 * quando alguém cancela no meio.
 */
async function reservarLivro(livroId, email) {
    const livro = await prisma.livro.findUnique({ where: { id: Number(livroId) } });
    if (!livro) {
        throw Object.assign(new Error('Livro não encontrado!'), { status: 404 });
    }

    if (livro.alugadoPor === email) {
        throw Object.assign(
            new Error('Você já está com este livro, não precisa reservar.'),
            { status: 409 }
        );
    }

    // Reativar em vez de criar duplicata: quem cancelou e volta entra no fim
    // da fila, com createdAt novo, que é o comportamento esperado.
    const reserva = await prisma.reserva.upsert({
        where: { livroId_userEmail: { livroId: Number(livroId), userEmail: email } },
        create: { livroId: Number(livroId), userEmail: email, status: 'ATIVA' },
        update: { status: 'ATIVA', createdAt: new Date() },
    });

    const posicao = await posicaoNaFila(Number(livroId), email);
    return { reserva, ...posicao };
}

async function cancelarReserva(livroId, email) {
    const reserva = await prisma.reserva.upsert({
        where: { livroId_userEmail: { livroId: Number(livroId), userEmail: email } },
        create: { livroId: Number(livroId), userEmail: email, status: 'CANCELADA' },
        update: { status: 'CANCELADA' },
    });
    return reserva;
}

/** Quantas reservas ativas são mais antigas que a do usuário (base 0 + 1). */
async function posicaoNaFila(livroId, email) {
    const minha = await prisma.reserva.findUnique({
        where: { livroId_userEmail: { livroId, userEmail: email } },
    });

    if (!minha || minha.status !== 'ATIVA') {
        return { posicao: null, naFila: false, total: await contarFila(livroId) };
    }

    const anteriores = await prisma.reserva.count({
        where: {
            livroId,
            status: 'ATIVA',
            createdAt: { lt: minha.createdAt },
        },
    });

    return { posicao: anteriores + 1, naFila: true, total: await contarFila(livroId) };
}

function contarFila(livroId) {
    return prisma.reserva.count({ where: { livroId: Number(livroId), status: 'ATIVA' } });
}

/** Fila completa, só para o ADMIN ver quem está esperando. */
function listarFila(livroId) {
    return prisma.reserva.findMany({
        where: { livroId: Number(livroId), status: 'ATIVA' },
        orderBy: { createdAt: 'asc' },
    });
}

/**
 * Reservas do usuário com a situação atual de cada livro.
 *
 * `disponivelAgora` é o que permite avisar "o livro que você reservou já pode
 * ser pego": um livro devolvido continua na fila, e o membro da fila só descobre
 * que a vez dele chegou olhando aqui.
 */
async function listarMinhasReservas(email) {
    const reservas = await prisma.reserva.findMany({
        where: { userEmail: email, status: 'ATIVA' },
        orderBy: { createdAt: 'asc' },
        include: { livro: true },
    });

    return reservas.map((r) => {
        const livro = r.livro;
        return {
            id: r.id,
            createdAt: r.createdAt,
            livro: {
                id: livro.id,
                titulo: livro.titulo,
                autor: livro.autor,
                capa: livro.capa,
                categoria: livro.categoria,
                statusAluguel: livro.statusAluguel,
                // true = chegou a vez do usuário; o card deve oferecer "Alugar".
                disponivelAgora: livro.statusAluguel === 'DISPONIVEL',
                // quem está com ele agora, para a UI explicar o aguardo
                alugadoPor: livro.alugadoPor,
            },
        };
    });
}

/**
 * Chamado depois de uma devolução: devolve a situação da fila para o
 * chamador poder avisar. Com a regra escolhida ("libera e notifica"), a fila
 * continua ativa — quem estava na frente precisa clicar em Alugar para pegar.
 */
async function situacaoDaFila(livroId) {
    const [total, primeiro] = await Promise.all([
        contarFila(livroId),
        prisma.reserva.findFirst({
            where: { livroId: Number(livroId), status: 'ATIVA' },
            orderBy: { createdAt: 'asc' },
        }),
    ]);

    return { total, proximo: primeiro?.userEmail ?? null };
}

export default {
    avaliarLivro,
    listarAvaliacoes,
    reservarLivro,
    cancelarReserva,
    posicaoNaFila,
    contarFila,
    listarFila,
    listarMinhasReservas,
    situacaoDaFila,
    recalcularMedia,
};
