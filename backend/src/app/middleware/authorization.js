/**
 * Depende do requireAuth: lê o role de req.user, que foi carregado do banco.
 * Precisa vir sempre depois de requireAuth na mesma rota — sozinho ele
 * confia em qualquer req.user.
 */
export function requireAdmin(req, res, next) {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Acesso negado! Apenas administradores podem realizar esta ação.' });
    }

    next();
}
