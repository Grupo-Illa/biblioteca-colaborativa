-- AlterTable
ALTER TABLE "Livro" ADD COLUMN     "capa" VARCHAR(500),
ADD COLUMN     "categoria" VARCHAR(120) NOT NULL DEFAULT 'Geral';
