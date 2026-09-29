import express from 'express';
import AvaliacaoController from "../controller/avaliacaoController.js";
import { exigirAutenticacao } from "../middleware/authorization.js";

const rotasAvaliacao = express.Router();
const controller = new AvaliacaoController();

// Avaliar exige estar logado e ter alugado o titulo, mas nao exige admin.
rotasAvaliacao.post('/', exigirAutenticacao, controller.avaliarController);
rotasAvaliacao.get('/minhas', exigirAutenticacao, controller.listarMinhasController);
rotasAvaliacao.get('/livros-avaliaveis', exigirAutenticacao, controller.listarLivrosAvaliaveisController);

// Ler as avaliacoes de um livro e publico, igual a listagem do acervo.
rotasAvaliacao.get('/livro/:id', controller.listarPorLivroController);

export default rotasAvaliacao;
