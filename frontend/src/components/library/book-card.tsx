"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import type { Book } from "@/lib/api";
import { cn } from "@/lib/utils";

type BookCardProps = {
  book: Book;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (book: Book) => void;
  onRent: (book: Book) => void;
  renting?: boolean;
  /** Este usuario ja tem um exemplar deste titulo alugado. */
  jaAlugou?: boolean;
  index: number;
};

export function BookCard({
  book,
  isFavorite,
  onToggleFavorite,
  onOpen,
  onRent,
  renting = false,
  jaAlugou = false,
  index,
}: BookCardProps) {
  // Bloqueado quando nao ha exemplar ou quando o proprio usuario ja tem um.
  const bloqueado = !book.available || jaAlugou;
  return (
    <article
      onClick={() => onOpen(book)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(book);
        }
      }}
      className="group animate-fade-up relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <Image
          src={book.cover || "/placeholder.svg"}
          alt={`Capa do livro ${book.title}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

        <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
          {book.category}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(book.id);
          }}
          aria-label={
            isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm transition-all hover:scale-110 hover:bg-background"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              isFavorite
                ? "animate-heart-pop fill-gold text-gold"
                : "text-muted-foreground",
            )}
          />
        </button>

        {!book.available && (
          <span className="absolute bottom-3 left-3 rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-medium text-background">
            Indisponível
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1 space-y-1">
          <h3 className="text-pretty font-medium leading-snug">{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-gold text-gold" />
            <span className="font-mono font-medium text-foreground">
              {book.rating.toFixed(1)}
            </span>
          </span>
          <span className="font-mono">{book.year}</span>
          <span>{book.pages} pág.</span>
        </div>

        <button
          type="button"
          disabled={bloqueado || renting}
          onClick={(e) => {
            // O card inteiro abre o detalhe; o botao precisa parar a propagacao.
            e.stopPropagation();
            onRent(book);
          }}
          className={cn(
            "h-9 rounded-lg text-sm font-medium transition-all",
            !bloqueado && !renting
              ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
              : "cursor-not-allowed bg-secondary text-muted-foreground",
          )}
        >
          {renting
            ? "Alugando..."
            : jaAlugou
              ? "Você já alugou"
              : book.available
                ? `Alugar · ${book.copies} disp.`
                : "Indisponível"}
        </button>
      </div>
    </article>
  );
}
