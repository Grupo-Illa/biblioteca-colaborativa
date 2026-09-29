"use client";

import { BookMarked, Check, Clock, Loader2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Emprestimo } from "@/lib/api";
import { cn } from "@/lib/utils";

type PropsMeusAlugueis = {
  alugueis: Emprestimo[];
  carregando: boolean;
  devolvendoId: number | null;
  aoDevolver: (idEmprestimo: number) => void;
};

const MS_POR_DIA = 86_400_000;

/**
 * Dias INTEIROS que faltam, com piso em 0.
 *
 * Usa round de proposito, e nao ceil nem floor. O prazo e calculado com o
 * relogio do servidor e o contador roda no browser, entao uma diferenca de
 * milissegundos entre as duas maquinas basta para o valor real ficar em
 * 14.0001 ou 13.9999 num aluguel de 14 dias. Com ceil aparecia "15 dias" e
 * com floor aparecia "13 dias". Round mantem o numero correto e ainda deixa
 * a ultima metade do dia cair em "Vence hoje".
 */
function diasRestantes(prazo: string, agora: number) {
  const restante = new Date(prazo).getTime() - agora;
  return Math.max(0, Math.round(restante / MS_POR_DIA));
}

function descricaoPrazo(
  prazo: string,
  status: Emprestimo["status"],
  agora: number,
) {
  if (status !== "ATIVO") return null;

  const dias = diasRestantes(prazo, agora);

  if (dias === 0) return "Vence hoje";

  const quando = new Date(prazo).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return `${dias} ${dias === 1 ? "dia" : "dias"} · até ${quando}`;
}

export function MeusAlugueis({
  alugueis,
  carregando,
  devolvendoId,
  aoDevolver,
}: PropsMeusAlugueis) {
  const [aberto, setAberto] = useState(false);

  // Avanca a cada minuto para a contagem nao congelar na data de montagem.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  const ativos = alugueis.filter((a) => a.status === "ATIVO");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all",
          ativos.length > 0
            ? "border-gold/50 bg-gold/10 text-foreground"
            : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground",
        )}
      >
        <BookMarked className="size-4" />
        <span className="hidden sm:inline">Meus aluguéis</span>
        {ativos.length > 0 && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {ativos.length}
          </span>
        )}
      </button>

      {aberto && (
        <>
          {/* Fecha ao clicar fora, sem capturar o scroll da pagina. */}
          <button
            type="button"
            aria-label="Fechar"
            tabIndex={-1}
            onClick={() => setAberto(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] origin-top-right rounded-2xl border border-border bg-popover p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-semibold">Livros alugados</p>
              {ativos.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {ativos.length} ativo{ativos.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {carregando ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando...
              </div>
            ) : ativos.length === 0 ? (
              <p className="px-1 py-8 text-center text-sm text-muted-foreground">
                Você não tem livros alugados no momento.
              </p>
            ) : (
              <ul className="no-scrollbar max-h-80 space-y-2 overflow-auto">
                {ativos.map((aluguel) => {
                  const prazo = descricaoPrazo(
                    aluguel.prazoDevolucao,
                    aluguel.status,
                    agora,
                  );
                  const urgente =
                    diasRestantes(aluguel.prazoDevolucao, agora) <= 2;
                  const devolvendo = devolvendoId === aluguel.id;

                  return (
                    <li
                      key={aluguel.id}
                      className="rounded-xl border border-border bg-secondary/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {aluguel.livro.titulo}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {aluguel.livro.autor}
                          </p>
                        </div>
                        <BookMarked className="size-4 shrink-0 text-muted-foreground" />
                      </div>

                      {prazo && (
                        <p
                          className={cn(
                            "mt-2 inline-flex items-center gap-1.5 text-xs",
                            urgente
                              ? "text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          <Clock className="size-3.5" />
                          {prazo}
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={devolvendo}
                        onClick={() => aoDevolver(aluguel.id)}
                        className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {devolvendo ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Devolvendo...
                          </>
                        ) : (
                          <>
                            <Undo2 className="size-3.5" />
                            Devolver livro
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {ativos.length === 0 && !carregando && (
              <p className="mt-2 flex items-start gap-1.5 border-t border-border px-1 pt-2 text-[11px] text-muted-foreground">
                <Check className="mt-px size-3 shrink-0" />
                Você não tem exemplares pendentes. Alugue um novo título quando
                quiser.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
