import express from 'express';
import cors from 'cors';
import bookRoutes from './app/routes/bookRoutes.js';
import userRoutes from './app/routes/userRoutes.js';
import aluguelRoutes from './app/routes/aluguelRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/livros', bookRoutes);
app.use('/usuarios', userRoutes);
app.use('/alugueis', aluguelRoutes);

const DOOR = process.env.DOOR || 3000;

app.get('/', (req, res) => {
    res.json({ message: 'API Biblioteca Colaborativa rodando!', versao: '2.0' });
});

app.listen(DOOR, () => {
    console.log(`✅ Servidor rodando em: http://localhost:${DOOR}`);
});
