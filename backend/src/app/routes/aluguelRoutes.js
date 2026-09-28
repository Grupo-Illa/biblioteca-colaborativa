import express from 'express';
import AluguelController from "../controller/aluguelController.js";
import { exigirAutenticacao } from "../middleware/authorization.js";

const rotasAluguel = express.Router();
const controller = new AluguelController();

// Alugar e devolver valem para qualquer usuario logado, nao so para admin.
rotasAluguel.post('/alugar/:id', exigirAutenticacao, controller.alugarController);
rotasAluguel.get('/meus', exigirAutenticacao, controller.listarMeusController);
rotasAluguel.post('/:id/devolver', exigirAutenticacao, controller.devolverController);

export default rotasAluguel;
