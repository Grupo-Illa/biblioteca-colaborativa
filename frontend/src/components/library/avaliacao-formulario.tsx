"use client";

import { Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { AvaliacaoEstrelas } from "@/components/library/avaliacao-estrelas";
import type { Avaliacao } from "@/lib/api";
import { cn } from "@/lib/utils";

type PropsFormularioAvaliacao = {
  /** Avaliacao ja existente deste usuario para este titulo, se houver. */
  avaliacaoExistente: Avaliacao | null;
  aoEnviar: (nota: number, comentario: string) => void;
  enviando: boolean;
};

const LIMITE_COMENTARIO = 500;

/**
 * Formulario que so aparece para quem ja alugou o titulo.
 *
 * A nota do usuario vem preenchida, entao reavaliar o mesmo livro troca a nota
 * em vez de criar uma segunda. O livro continua avaliavel depois da devolucao,
 * porque quem habilita isto e o emprestimo e nao o estoque. A media da equipe
 * fica a cargo do ListaAvaliacoes, que aparece para todo leitor.
 */
export function FormularioAvaliacao({
  avaliacaoExistente,
  aoEnviar,
  enviando,
}: PropsFormularioAvaliacao) {
  // Estado inicial vindo do que ja existe. O dialogo passa key={livro.id},
  // entao trocar de livro remonta o componente e o estado recomeca certo: sem
  // isso, a nota que o usuario estava digitando vazaria para o proximo titulo.
  const [nota, setNota] = useState(avaliacaoExistente?.nota ?? 0);
  const [comentario, setComentario] = useState(
    avaliacaoExistente?.comentario ?? "",
  );

  const podeEnviar = nota > 0 && !enviando;

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="text-sm font-medium">
        {avaliacaoExistente ? "Sua avaliação" : "Avalie este livro"}
      </p>
      {avaliacaoExistente && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Enviar de novo substitui a nota que você deu antes.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <AvaliacaoEstrelas nota={nota} aoEscolher={setNota} />
        {nota > 0 && (
          <span className="text-xs text-muted-foreground">
            {nota === 1 ? "1 estrela" : `${nota} estrelas`}
          </span>
        )}
      </div>

      <div className="mt-3 relative">
        <MessageSquare className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={LIMITE_COMENTARIO}
          rows={2}
          placeholder="O que achou do livro? (opcional)"
          className="w-full resize-none rounded-xl border border-border bg-background/60 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
        />
      </div>
      <p className="mt-1 text-right text-[11px] text-muted-foreground">
        {comentario.length}/{LIMITE_COMENTARIO}
      </p>

      <button
        type="button"
        disabled={!podeEnviar}
        onClick={() => aoEnviar(nota, comentario)}
        className={cn(
          "mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all",
          podeEnviar
            ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
            : "cursor-not-allowed bg-secondary text-muted-foreground",
        )}
      >
        {enviando ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando...
          </>
        ) : avaliacaoExistente ? (
          "Atualizar avaliação"
        ) : (
          "Enviar avaliação"
        )}
      </button>

      {nota === 0 && !enviando && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Escolha uma nota para habilitar o envio.
        </p>
      )}
    </div>
  );
}
