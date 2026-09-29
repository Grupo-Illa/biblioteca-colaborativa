import express from 'express';
import cors from 'cors';
import rotasLivros from './app/routes/bookRoutes.js';
import rotasUsuarios from './app/routes/userRoutes.js';
import rotasAlugueis from './app/routes/aluguelRoutes.js';
import rotasAvaliacoes from './app/routes/avaliacaoRoutes.js';

const aplicacao = express();
aplicacao.use(cors());
aplicacao.use(express.json());
aplicacao.use('/livros', rotasLivros);
aplicacao.use('/usuarios', rotasUsuarios);
aplicacao.use('/alugueis', rotasAlugueis);
aplicacao.use('/avaliacoes', rotasAvaliacoes);

const PORTA = process.env.PORTA || 3000;

aplicacao.get('/', (requisicao, resposta) => {
    resposta.json({ mensagem: 'API Biblioteca Colaborativa rodando!', versao: '2.0' });
});

aplicacao.listen(PORTA, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${PORTA}`);
});
