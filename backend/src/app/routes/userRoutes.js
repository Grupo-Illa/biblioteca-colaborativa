import express from 'express';
import userController from "../controller/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/authorization.js";

const userRoutes = express.Router();
const controller = new userController;

userRoutes.post('/cadastrar', controller.createController);
userRoutes.post('/login', controller.loginController);
userRoutes.post('/logout', controller.logoutController);

// Lê a sessão atual. O frontend usa para decidir se mostra o acervo,
// o painel de acesso, ou o botão de admin.
userRoutes.get('/me', requireAuth, controller.meController);

// Lista de usuários: só admin.
userRoutes.get('/buscarTodos', requireAuth, requireAdmin, controller.showController);

// Admin em qualquer conta, usuário comum apenas na própria (checado no controller).
userRoutes.patch('/atualizarUsuario/:id', requireAuth, controller.updateController);

userRoutes.delete('/deletarUsuario/:id', requireAuth, requireAdmin, controller.deleteController);

export default userRoutes;
