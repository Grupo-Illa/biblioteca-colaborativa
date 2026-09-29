import express from 'express';
import BookController from "../controller/bookController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/authorization.js";

const bookRoutes = express.Router();
const controller = new BookController();

bookRoutes.post('/cadastrar', requireAuth, requireAdmin, controller.createController);
bookRoutes.get('/buscarTodos', controller.showController);
bookRoutes.get('/buscar/:id', controller.showByIdController);
bookRoutes.patch('/atualizar/:id', requireAuth, requireAdmin, controller.updateController);
bookRoutes.delete('/deletar/:id', requireAuth, requireAdmin, controller.deleteController);

// ---------- Empréstimos ----------
// requireAuth em todas: alugar e devolver exigem saber QUEM está agindo.
// A regra de quem pode devolver (dono ou ADMIN) fica no repositório.
bookRoutes.post('/alugar/:id', requireAuth, controller.rentController);
bookRoutes.post('/devolver/:id', requireAuth, controller.returnController);
bookRoutes.get('/meusEmprestimos', requireAuth, controller.myRentalsController);

// ADMIN forçando a devolução de um livro de outra pessoa.
bookRoutes.post('/forcar-devolucao/:id', requireAuth, requireAdmin, controller.setAvailabilityController);

// ---------- Avaliações ----------
// Exigem sessão porque a resposta traz o email de quem avaliou; deixar isso
// público entregaria a lista de e-mails da empresa para qualquer visitante.
// Caminho ação-primeiro, seguindo o padrão das outras rotas do projeto.
bookRoutes.post('/avaliacao/:id', requireAuth, controller.reviewController);
bookRoutes.get('/avaliacoes/:id', requireAuth, controller.listReviewsController);

// ---------- Reservas (fila do livro alugado) ----------
bookRoutes.post('/reservar/:id', requireAuth, controller.reserveController);
bookRoutes.delete('/reservar/:id', requireAuth, controller.cancelReserveController);
bookRoutes.get('/fila/:id', requireAuth, controller.queueController);
bookRoutes.get('/minhasReservas', requireAuth, controller.myReservationsController);

export default bookRoutes;
