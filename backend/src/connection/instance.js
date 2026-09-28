import { PrismaClient } from "@prisma/client";

class instanciaPrisma {
    // Instancia unica, criada sob demanda no primeiro uso.
    static ClientePrisma = null

    static obterConexao() {
        if (!this.ClientePrisma) {
            this.ClientePrisma = new PrismaClient()
        }
        return this.ClientePrisma;
    }
}

export default instanciaPrisma;
