import userRepository from "../repository/userRepository.js";
import bcrypt from "bcrypt"
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js'

const {createUser, showAllUsers, updateUser, deleteUser, findByEmail} = new userRepository();

// Domínio institucional: cadastro, login e edição de email passam por aqui.
const EMAIL_REGEX = /^[^\s@]+@grupoilla\.com\.br$/;
const ERRO_EMAIL = 'Apenas emails institucionais @grupoilla.com.br são permitidos!';


class userController{
    async loginController(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email e senha são obrigatórios!' });
            }

            // O mesmo domínio institucional do cadastro. Sem esta checagem,
            // um email de fora cai no "Usuário inválido!" genérico e a pessoa
            // não entende que o problema é o domínio, não a senha.
            if (!EMAIL_REGEX.test(email)) {
                return res.status(400).json({ message: ERRO_EMAIL });
            }

            const user = await findByEmail(email)
            if (!user) {
                return res.status(401).json({ message: 'Usuário inválido!' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Senha incorreta!' })
            }

            // O token vai num cookie httpOnly: o JavaScript da página não
            // consegue ler nem forjar. Por isso o `role` deixa de ser uma
            // afirmação do navegador e passa a vir do banco.
            setAuthCookie(res, generateToken(user));

            // Única desestruturação que sobrou no arquivo, e é necessária:
            // findByEmail precisa devolver o hash para o bcrypt.compare.
            const { password: _, ...userData } = user;
            return res.status(200).json({ message: 'Login realizado com sucesso!', user: userData });

        } catch (error) {
            return res.status(500).json({
                message: 'Erro ao fazer login!',
                error: error.message
            });
        }
    }

    async logoutController(req, res) {
        clearAuthCookie(res);
        return res.status(200).json({ message: 'Sessão encerrada!' });
    }

    async meController(req, res) {
        // requireAuth já autenticou e populou req.user, e o middleware usa a
        // allowlist CAMPOS_PUBLICOS — o hash nem chega a ser lido do banco.
        return res.status(200).json({ user: req.user });
    }

    async createController(req, res) {
        try {
            const data = req.body;
            if (data.birthday) {
                data.birthday = new Date(data.birthday);
            }

            if (!data.username || !data.password || !data.email || !data.birthday) {
                return res.status(400).json({message: 'Parâmetros insuficientes para criar usuário!'})
            }

            if (!EMAIL_REGEX.test(data.email)) {
                return res.status(400).json({ message: ERRO_EMAIL });
            }

            // createUser já devolve o registro com a allowlist aplicada.
            const user = await createUser(data);
            res.status(200).json({message: 'Usuário criado!', user})
            
        } catch (error) {
            res.status(500).json({
                message: 'Erro ao criar usuário!',
                error: error.message
            });
        }
    }

    async showController(req, res) {
        try {
            const user = await showAllUsers();
            res.json(user)    
        } catch (error) {
            res.status(500).json({
                message: 'Controller: Erro ao acessar a tabela!',
                error: error.message
            })
            // console.error(error);
        }
    }

    async updateController(req, res) {
        try {
            const {id} = req.params;
            const data = req.body;
            const userId = parseInt(id, 10); //parseInt para garantir que é um número e não uma string
            
            if (isNaN(userId)) {
                return res.status(400).json({message: 'ID inválido!'});
            };

            if (data.email && !EMAIL_REGEX.test(data.email)) {
                return res.status(400).json({ message: ERRO_EMAIL });
            }

            // Usuário comum só mexe na própria conta; admin em qualquer uma.
            // Sem isso, qualquer logado edita a conta dos outros.
            if (req.user.id !== userId && req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Acesso negado! Você só pode alterar a sua própria conta.' });
            }

            // `role` e `id` do body são descartados de propósito: sem isso
            // qualquer usuário se promove a ADMIN pelo próprio endpoint.
            const { role: _role, id: _id, ...safeData } = data;

            const user = await updateUser(userId, safeData); 

            res.status(200).json({message: 'Usuário atualizado!', user})
        } catch (error) {
            res.status(500).json({
                message: 'Controller: Erro ao atualizar usuário!',
                error: error.message
            })
        }
    }

    async deleteController(req, res) {
        try {
            const {id} = req.params;
            if (id === null || id === undefined) {
                return res.status(400).json({message: 'Não foi possivel deletar o usuário! ID Obrigatório.'})
            };
            const userId = parseInt(id, 10);
            if (isNaN(userId)) {
                return res.status(400).json({message: 'ID inválido!'});
            };

            if (userId === req.user.id) {
                return res.status(400).json({ message: 'Não é possível deletar a própria conta!' });
            }

            const result = await deleteUser(parseInt(id));
            res.status(200).json(result.message) //message é necessario para q o front entenda que deu certo

        } catch (error) {
            res.status(500).json({
                message: 'Controller: Erro ao deletar usuário!',
                error: error.message
            })
        }
    }
}

export default userController;