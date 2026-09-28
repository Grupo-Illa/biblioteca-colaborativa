import instanciaPrisma from '../../connection/instance.js';

/**
 * Seed do acervo: 5 livros por categoria.
 *
 * As categorias ficam AQUI, e não são descobertas do banco. A versão anterior
 * lia `distinct categoria` da tabela Livro, o que funciona só para categorias
 * que já têm livros — uma categoria nova nunca apareceria, porque nada a
 * referencia ainda. Assumir a lista aqui é o que permite criar categoria nova.
 *
 * Idempotente: roda quantas vezes quiser sem duplicar, pulando título+autor
 * que já existem.
 *
 * Para adicionar uma categoria: um nome novo na chave de ACERVO com 5 livros.
 *
 * Todos entram DISPONIVEL. Um livro ALUGADO sem `alugadoPor` seria estado
 * incoerente, já que o dono do empréstimo vem do aluguel.
 */

const prisma = instanciaPrisma.getConnection();

const ACERVO = {
    Geral: [
        { titulo: 'O Tempo e o Vento', autor: 'Luiz Veríssimo', editora: 'Companhia das Letras', ano: 2013 },
        { titulo: 'Dom Casmurro', autor: 'Machado de Assis', editora: 'Penguin Books', ano: 2004 },
        { titulo: 'A Hora da Estrela', autor: 'Clarice Lispector', editora: 'Ática', ano: 2015 },
        { titulo: 'Cem Anos de Solidão', autor: 'Gabriel García Márquez', editora: 'Record', ano: 2018 },
        { titulo: 'Grande Sertão: Veredas', autor: 'João Guimarães Rosa', editora: 'Companhia das Letras', ano: 2017 },
    ],

    Ficção: [
        { titulo: 'O Nome da Rosa', autor: 'Umberto Eco', editora: 'Bompacho', ano: 2011 },
        { titulo: '1984', autor: 'George Orwell', editora: 'Companhia das Letras', ano: 2013 },
        { titulo: 'Fahrenheit 451', autor: 'Ray Bradbury', editora: 'Arqueiro', ano: 2015 },
        { titulo: 'O Hobbit', autor: 'J. R. R. Tolkien', editora: 'Martins Fontes', ano: 2017 },
        { titulo: 'A Garota do Trem', autor: 'Paula Hawkins', editora: 'Intrínseca', ano: 2016 },
    ],

    Biografia: [
        { titulo: 'Steve Jobs', autor: 'Walter Isaacson', editora: 'Companhia das Letras', ano: 2012 },
        { titulo: 'Certamente Você Está Brincando, Sr. Feynman!', autor: 'Richard Feynman', editora: 'Editora Vozes', ano: 2019 },
        { titulo: 'Marie Curie', autor: 'Pierre Curie', editora: 'Elsevier', ano: 2011 },
        { titulo: 'Leonardo da Vinci', autor: 'Walter Pater', editora: 'Encyclopaedia Britannica', ano: 2015 },
        { titulo: 'Long Walk to Freedom', autor: 'Nelson Mandela', editora: 'Plural', ano: 2014 },
    ],

    Ciência: [
        { titulo: 'Uma Breve História de Quase Tudo', autor: 'Bill Bryson', editora: 'Companhia das Letras', ano: 2004 },
        { titulo: 'Cosmos', autor: 'Carl Sagan', editora: 'Companhia das Letras', ano: 2011 },
        { titulo: 'A Origem das Espécies', autor: 'Charles Darwin', editora: 'Martinus Fontes', ano: 2009 },
        { titulo: 'O Gene Egoísta', autor: 'Richard Dawkins', editora: 'Nova Fronteira', ano: 2018 },
        { titulo: 'Breve História da Ciência', autor: 'John Gribbin', editora: 'Zed', ano: 2019 },
    ],

    História: [
        { titulo: 'Sapiens', autor: 'Yuval Noah Harari', editora: 'Companhia das Letras', ano: 2018 },
        { titulo: 'SPQR', autor: 'Mary Beard', editora: 'Companhia das Letras', ano: 2015 },
        { titulo: 'A Queda do Império Romano', autor: 'Edward Gibbon', editora: 'Penguin Books', ano: 2010 },
        { titulo: 'História do Brasil', autor: 'Boris Fausto', editora: 'Editora USP', ano: 2012 },
        { titulo: 'O Século Longo', autor: 'Felipe Fernández-Armesto', editora: 'Estação', ano: 2010 },
    ],

    Negócios: [
        { titulo: 'De Zero a Um', autor: 'Peter Thiel', editora: 'Companhia das Letras', ano: 2014 },
        { titulo: 'Startup Enxuto', autor: 'Eric Ries', editora: 'Cia das Letras', ano: 2012 },
        { titulo: 'De Bom a Excelente', autor: 'Jim Collins', editora: 'Campus', ano: 2005 },
        { titulo: 'Pai Rico, Pai Pobre', autor: 'Robert T. Kiyosaki', editora: 'Suma', ano: 2012 },
        { titulo: 'A Arte da Guerra', autor: 'Sun Tzu', editora: 'Leitura', ano: 2015 },
    ],

    Tecnologia: [
        { titulo: 'Clean Code', autor: 'Robert C. Martin', editora: 'Prentice Hall', ano: 2008 },
        { titulo: 'Padrões de Projeto', autor: 'Erich Gamma', editora: 'Bookman', ano: 2007 },
        { titulo: 'Arquitetura Limpa', autor: 'Robert C. Martin', editora: 'Alta Books', ano: 2017 },
        { titulo: 'Engenharia de Software', autor: 'Ian Sommerville', editora: 'Pearson', ano: 2019 },
        { titulo: 'Site Reliability Engineering', autor: 'Betsy Beyer', editora: 'Artmed', ano: 2016 },
    ],
};

async function seedAcervo() {
    const categorias = Object.keys(ACERVO);
    console.log(`Categorias no seed: ${categorias.length}\n`);

    let criados = 0;
    let ignorados = 0;

    for (const categoria of categorias) {
        const livros = ACERVO[categoria];
        let criadosAqui = 0;

        for (const livro of livros) {
            const existe = await prisma.livro.findFirst({
                where: { titulo: livro.titulo, autor: livro.autor },
            });

            if (existe) {
                ignorados++;
                continue;
            }

            await prisma.livro.create({
                data: {
                    titulo: livro.titulo,
                    autor: livro.autor,
                    editora: livro.editora,
                    categoria,
                    dataLancamento: new Date(`${livro.ano}-01-01`),
                    statusAluguel: 'DISPONIVEL',
                },
            });
            criados++;
            criadosAqui++;
        }

        console.log(`  ${categoria.padEnd(12)} ${criadosAqui} criado(s) de ${livros.length}`);
    }

    const total = await prisma.livro.count();
    console.log(`\nAcervo: ${criados} criado(s), ${ignorados} já existente(s). Total na tabela: ${total}.`);
}

export default seedAcervo;

// permite rodar direto: node src/app/seeds/bookSeedCategorias.js
if (process.argv[1] && process.argv[1].endsWith('bookSeedCategorias.js')) {
    seedAcervo()
        .then(() => prisma.$disconnect())
        .catch(async (error) => {
            console.error('Erro no seed:', error);
            await prisma.$disconnect();
            process.exit(1);
        });
}
