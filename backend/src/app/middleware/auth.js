import instanciaPrisma from '../../connection/instance.js';
import { CAMPOS_PUBLICOS } from '../repository/userRepository.js';
import { COOKIE_NAME, verifyToken } from '../utils/token.js';

const prisma = instanciaPrisma.getConnection();

/**
 * Exige um JWT válido no cookie de sessão e carrega o usuário em req.user.
 *
 * É o substituto direto do antigo header `x-user-email`, que qualquer um
 * podia forjar. O token é assinado com JWT_SECRET, então o cliente não tem
 * como fabricar um válido.
 *
 * Sempre relê o usuário do banco em vez de confiar no payload: assim mudar
 * o role ou excluir a conta vale imediatamente, sem esperar o token expirar.
 */
export async function requireAuth(req, res, next) {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
        return res.status(401).json({ message: 'Não autenticado!' });
    }

    let payload;
    try {
        payload = verifyToken(token);
    } catch (error) {
        const expirado = error.name === 'TokenExpiredError';
        return res.status(401).json({
            message: expirado
                ? 'Sessão expirada! Faça login novamente.'
                : 'Sessão inválida! Faça login novamente.',
        });
    }

    // `select` com a allowlist: nem o hash é lido do banco, então req.user
    // nunca carrega a senha. Vale a pena porque qualquer controller futuro
    // que faça `res.json(req.user)` sairia limpo por construção.
    const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: CAMPOS_PUBLICOS,
    });

    if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado!' });
    }

    req.user = user;
    next();
}
