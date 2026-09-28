import instanciaPrisma from "../../connection/instance.js";

const prisma = instanciaPrisma.getConnection();

export async function requireAuth(req, res, next) {
    try {
        const userEmail = req.headers['x-user-email'];

        if (!userEmail) {
            return res.status(401).json({ message: 'Usuário não autenticado!' });
        }

        const user = await prisma.user.findUnique({ where: { email: userEmail } });

        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado!' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao verificar autenticação!',
            error: error.message
        });
    }
}

export async function requireAdmin(req, res, next) {
    try {
        const userEmail = req.headers['x-user-email'];

        if (!userEmail) {
            return res.status(401).json({ message: 'Usuário não autenticado!' });
        }

        const user = await prisma.user.findUnique({ where: { email: userEmail } });

        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado!' });
        }

        if (user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Acesso negado! Apenas administradores podem realizar esta ação.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({
            message: 'Erro ao verificar permissões!',
            error: error.message
        });
    }
}
