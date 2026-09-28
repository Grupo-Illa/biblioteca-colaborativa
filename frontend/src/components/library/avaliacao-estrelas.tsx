"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type PropsAvaliacaoEstrelas = {
  /** Nota atual. 0 significa "ainda nao avaliado". */
  nota: number;
  /** Ausente deixa o componente somente para leitura. */
  aoEscolher?: (nota: number) => void;
  className?: string;
};

// Lista fixa em vez de Array.from com indice: a key deixa de derivar do indice
// e o biome para de reclamar de noArrayIndexKey.
const VALORES = [1, 2, 3, 4, 5];
const TOTAL_ESTRELAS = VALORES.length;

/**
 * Seletor de nota de 1 a 5.
 *
 * O botao de cada estrela repete o valor no aria-label, entao o leitor de tela
 * anuncia a nota e nao apenas "estrela". Nota 0 nao e selecionavel de
 * proposito: querer limpar a nota nao faz sentido para o usuario.
 */
export function AvaliacaoEstrelas({
  nota,
  aoEscolher,
  className,
}: PropsAvaliacaoEstrelas) {
  const [previa, setPrevia] = useState<number | null>(null);
  const interativo = typeof aoEscolher === "function";
  const notaVisivel = previa ?? nota;

  // Somente-leitura usa <span>, e nao <fieldset>: fieldset e um agrupador de
  // formulario e o HTML proibe ele dentro de <p>, o que o React reclamava com
  // erro de hidratacao. Aqui ele so exibe a nota, e nao agrupar controles.
  if (!interativo) {
    return (
      <span
        className={cn("inline-flex items-center gap-0.5", className)}
        role="img"
        aria-label={`Nota ${nota} de ${TOTAL_ESTRELAS}`}
      >
        {VALORES.map((valor) => (
          <Star
            key={valor}
            aria-hidden="true"
            className={cn(
              "size-5",
              valor <= notaVisivel
                ? "fill-gold text-gold"
                : "text-muted-foreground/30",
            )}
          />
        ))}
      </span>
    );
  }

  return (
    // fieldset é o elemento semantico para o grupo de controles. Traz borda e
    // padding padrao, entao os utilitarios abaixo os zeram.
    <fieldset
      aria-label="Escolher nota"
      className={cn(
        "m-0 inline-flex items-center gap-0.5 border-0 p-0",
        className,
      )}
      onMouseLeave={() => setPrevia(null)}
    >
      {VALORES.map((valor) => (
        <button
          key={valor}
          type="button"
          onClick={() => aoEscolher(valor)}
          onMouseEnter={() => setPrevia(valor)}
          aria-label={`Dar ${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
          aria-pressed={nota === valor}
          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            aria-hidden="true"
            className={cn(
              "size-6 transition-colors",
              valor <= notaVisivel
                ? "fill-gold text-gold"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </fieldset>
  );
}
