-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('ATIVA', 'CANCELADA');

-- AlterTable
ALTER TABLE "Livro" ADD COLUMN     "mediaNotas" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" SERIAL NOT NULL,
    "livroId" INTEGER NOT NULL,
    "userEmail" VARCHAR(255) NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "livroId" INTEGER NOT NULL,
    "userEmail" VARCHAR(255) NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'ATIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Avaliacao_livroId_idx" ON "Avaliacao"("livroId");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_livroId_userEmail_key" ON "Avaliacao"("livroId", "userEmail");

-- CreateIndex
CREATE INDEX "Reserva_livroId_status_idx" ON "Reserva"("livroId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_livroId_userEmail_key" ON "Reserva"("livroId", "userEmail");

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
