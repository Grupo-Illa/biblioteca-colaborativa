import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const COOKIE_NAME = 'acervo_token';

if (!SECRET) {
    throw new Error('JWT_SECRET nao definido! Configure o arquivo .env do backend.');
}

/**
 * O token carrega so identificadores, nunca dados sensiveis. O `role` aqui
 * e apenas cache: o middleware relê o usuario do banco, entao rebaixar um
 * admin tem efeito no request seguinte, sem esperar o token expirar.
 */
export function generateToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        SECRET,
        { expiresIn: EXPIRES_IN }
    );
}

/** Lança TokenExpiredError / JsonWebTokenError em token inválido. */
export function verifyToken(token) {
    return jwt.verify(token, SECRET);
}

export function setAuthCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24,
        path: '/',
    });
}

export function clearAuthCookie(res) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
}
