import express from 'express';
import AluguelController from "../controller/aluguelController.js";
import { requireAuth } from "../middleware/authorization.js";

const aluguelRoutes = express.Router();
const controller = new AluguelController();

// Alugar e devolver valem para qualquer usuario logado, nao so para admin.
aluguelRoutes.post('/alugar/:id', requireAuth, controller.rentController);
aluguelRoutes.get('/meus', requireAuth, controller.listMineController);
aluguelRoutes.post('/:id/devolver', requireAuth, controller.returnController);

export default aluguelRoutes;
