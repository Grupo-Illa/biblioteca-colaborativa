-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
-- CreateEnum
CREATE TYPE "StatusAluguel" AS ENUM ('DISPONIVEL', 'ALUGADO');
-- CreateTable
CREATE TABLE "Livro" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "autor" VARCHAR(255) NOT NULL,
    "dataLancamento" DATE NOT NULL,
    "editora" VARCHAR(255) NOT NULL,
    "statusAluguel" "StatusAluguel" NOT NULL DEFAULT 'DISPONIVEL',
    "quantidadeAlugada" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Livro_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "birthday" DATE NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "phone" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
