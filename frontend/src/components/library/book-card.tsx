"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import type { Livro } from "@/lib/api";
import { cn } from "@/lib/utils";

type CartaoLivroProps = {
  livro: Livro;
  favorito: boolean;
  aoAlternarFavorito: (id: string) => void;
  aoAbrir: (livro: Livro) => void;
  aoAlugar: (livro: Livro) => void;
  alugando?: boolean;
  /** Este usuario tem ou teve exemplar deste titulo: pode avaliar. */
  podeAvaliar?: boolean;
  /** Este usuario ja deu nota para este titulo. */
  jaAvaliou?: boolean;
  indice: number;
};

export function CartaoLivro({
  livro,
  favorito,
  aoAlternarFavorito,
  aoAbrir,
  aoAlugar,
  alugando = false,
  podeAvaliar = false,
  jaAvaliou = false,
  indice,
}: CartaoLivroProps) {
  // Bloqueado quando nao ha exemplar e o usuario nao tem nada a fazer ali:
  // quem ja alugou continua com acao, porque ainda pode avaliar.
  const semAcao = !livro.disponivel && !podeAvaliar;

  return (
    <article
      onClick={() => aoAbrir(livro)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          aoAbrir(livro);
        }
      }}
      className="group animate-fade-up relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ animationDelay: `${Math.min(indice * 60, 480)}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <Image
          src={livro.capa || "/placeholder.svg"}
          alt={`Capa do livro ${livro.titulo}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
          {livro.categoria}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            aoAlternarFavorito(livro.id);
          }}
          aria-label={
            favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
          aria-pressed={favorito}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm transition-all hover:scale-110 hover:bg-background"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              favorito
                ? "animate-heart-pop fill-gold text-gold"
                : "text-muted-foreground",
            )}
          />
        </button>

        {!livro.disponivel && (
          <span className="absolute bottom-3 left-3 rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-background">
            Indisponível
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1 space-y-1">
          {/* break-words evita que um título sem espaços estoure o card. */}
          <h3 className="text-pretty break-words font-medium leading-snug">
            {livro.titulo}
          </h3>
          <p className="text-sm text-muted-foreground">{livro.autor}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star
              className={cn(
                "size-3.5",
                livro.quantidadeAvaliacoes > 0
                  ? "fill-gold text-gold"
                  : "text-muted-foreground/40",
              )}
            />
            {livro.quantidadeAvaliacoes > 0 ? (
              <span className="font-mono font-medium text-foreground">
                {livro.nota.toFixed(1)}
              </span>
            ) : (
              <span className="text-muted-foreground/60">sem nota</span>
            )}
          </span>
          <span className="font-mono">{livro.ano}</span>
          <span>{livro.paginas} pág.</span>
        </div>

        <button
          type="button"
          disabled={semAcao || (alugando && !podeAvaliar)}
          onClick={(e) => {
            // O card inteiro abre o detalhe; o botao precisa parar a propagacao.
            e.stopPropagation();
            // Quem ja alugou nao pode alugar de novo, mas o formulario de nota
            // vive no detalhe. O botao abre o detalhe em vez de ficar morto.
            if (podeAvaliar) {
              aoAbrir(livro);
              return;
            }
            aoAlugar(livro);
          }}
          className={cn(
            "h-9 rounded-lg text-sm font-medium transition-all",
            !semAcao && !alugando
              ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
              : "cursor-not-allowed bg-secondary text-muted-foreground",
          )}
        >
          {alugando
            ? "Alugando..."
            : podeAvaliar
              ? jaAvaliou
                ? "Ver minha avaliação"
                : "Avaliar este livro"
              : livro.disponivel
                ? `Alugar · ${livro.copias} disp.`
                : "Indisponível"}
        </button>
      </div>
    </article>
  );
}
