import express from 'express';
import UsuarioController from "../controller/userController.js";

const rotasUsuario = express.Router();
const controller = new UsuarioController();

rotasUsuario.post('/cadastrar', controller.criarController);
rotasUsuario.post('/login', controller.loginController);
rotasUsuario.get('/buscarTodos', controller.listarController);
rotasUsuario.patch('/atualizarUsuario/:id', controller.atualizarController);
rotasUsuario.delete('/deletarUsuario/:id', controller.deletarController);

export default rotasUsuario;
