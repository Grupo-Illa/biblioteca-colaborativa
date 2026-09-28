"use client";

import { BookOpen, Calendar, Heart, Layers, Star } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Book } from "@/lib/api";
import { cn } from "@/lib/utils";

type BookDetailDialogProps = {
  book: Book | null;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onRent: (book: Book) => void;
  renting: boolean;
  /** Este usuario ja tem um exemplar deste titulo alugado. */
  jaAlugou: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookDetailDialog({
  book,
  isFavorite,
  onToggleFavorite,
  onRent,
  renting,
  jaAlugou,
  open,
  onOpenChange,
}: BookDetailDialogProps) {
  const bloqueado = !book || !book.available || jaAlugou;
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <div className="grid gap-0 sm:grid-cols-[200px_1fr]">
          {/* Cover */}
          <div className="relative hidden aspect-[3/4] sm:block">
            <Image
              src={book.cover || "/placeholder.svg"}
              alt={`Capa do livro ${book.title}`}
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="space-y-2">
              <span className="inline-flex w-fit items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                {book.category}
              </span>
              <DialogTitle className="text-pretty text-xl leading-tight">
                {book.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">por {book.author}</p>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-3.5 fill-gold text-gold" />
                <span className="font-mono font-medium text-foreground">
                  {book.rating.toFixed(1)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span className="font-mono">{book.year}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                {book.pages} pág.
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-3.5" />
                {book.copies} {book.copies === 1 ? "cópia" : "cópias"}
              </span>
            </div>

            <DialogDescription className="text-pretty leading-relaxed text-foreground/80">
              {book.description ||
                "Nenhuma descrição disponível para este livro."}
            </DialogDescription>

            <div className="mt-auto flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={bloqueado || renting}
                onClick={() => onRent(book)}
                className={cn(
                  "h-10 flex-1 rounded-lg text-sm font-medium transition-all",
                  !bloqueado && !renting
                    ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                    : "cursor-not-allowed bg-secondary text-muted-foreground",
                )}
              >
                {renting
                  ? "Alugando..."
                  : jaAlugou
                    ? "Você já tem este exemplar"
                    : book.available
                      ? `Alugar agora · ${book.copies} disp.`
                      : "Indisponível no momento"}
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorite(book.id)}
                aria-label={
                  isFavorite
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
                }
                aria-pressed={isFavorite}
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95",
                  isFavorite
                    ? "border-gold/40 bg-gold/10"
                    : "border-border bg-secondary hover:bg-accent",
                )}
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
