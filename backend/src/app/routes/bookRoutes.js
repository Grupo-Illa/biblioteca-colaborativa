import express from 'express';
import LivroController from "../controller/bookController.js";
import { exigirAdmin } from "../middleware/authorization.js";

const rotasLivros = express.Router();
const controller = new LivroController();

rotasLivros.post('/cadastrar', exigirAdmin, controller.criarController);
rotasLivros.get('/buscarTodos', controller.listarController);
rotasLivros.get('/buscar/:id', controller.buscarPorIdController);
rotasLivros.patch('/atualizar/:id', exigirAdmin, controller.atualizarController);
rotasLivros.delete('/deletar/:id', exigirAdmin, controller.deletarController);

export default rotasLivros;
