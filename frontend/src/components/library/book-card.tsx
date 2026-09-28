"use client";

import { useEffect, useState } from "react";
import { Heart, Star as StarIcon, Undo2, ListOrdered, Check } from "lucide-react";
import type { Book } from "@/lib/api";
import { getReviews, getQueue, reserveBook, cancelReservation, type Avaliacao } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/library/star-rating";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type BookCardProps = {
  book: Book;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (book: Book) => void;
  onRent: (id: string) => void;
  onReturn: (id: string) => void;
  /** Email do usuário logado, para saber se ele é o dono do empréstimo. */
  currentUserEmail: string | null;
  isAdmin: boolean;
  /** Livro em trânsito: desabilita o botão para não haver clique duplo. */
  pending: boolean;
  /** Reservar/sair da fila muda o contador de "meus livros" no header. */
  onQueueChanged: () => void
  index: number;
};

export function BookCard({
  book,
  isFavorite,
  onToggleFavorite,
  onOpen,
  onRent,
  onReturn,
  currentUserEmail,
  isAdmin,
  pending,
  onQueueChanged,
  index,
}: BookCardProps) {
  const { toast } = useToast();
  // Quem pode devolver: quem alugou, ou um ADMIN (que pode forçar).
  const podeDevolver =
    !book.available && (isAdmin || book.rentedBy === currentUserEmail);

  // Situação da fila deste livro, buscada só quando ele está alugado.
  const [fila, setFila] = useState<{ posicao: number | null; naFila: boolean; total: number }>({
    posicao: null,
    naFila: false,
    total: 0,
  });
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  useEffect(() => {
    if (book.available) return;
    let cancelado = false;
    getQueue(Number(book.id)).then((d) => {
      if (!cancelado) setFila(d);
    });
    return () => {
      cancelado = true;
    };
  }, [book.id, book.available]);

  useEffect(() => {
    let cancelado = false;
    getReviews(Number(book.id)).then((rs) => {
      if (!cancelado) setAvaliacoes(rs);
    });
    return () => {
      cancelado = true;
    };
  }, [book.id, book.rating]);

  async function handleReservar() {
    const r = await reserveBook(Number(book.id));
    if (r.error) {
      toast(r.message, "erro");
      return;
    }
    toast(`Reserva registrada. Você está na posição ${r.posicao ?? 1} da fila.`, "sucesso");
    setFila((f) => ({ ...f, naFila: true, posicao: r.posicao ?? f.total + 1, total: f.total + 1 }));
    onQueueChanged();
  }

  async function handleSairDaFila() {
    const r = await cancelReservation(Number(book.id));
    if (r.error) {
      toast(r.message, "erro");
      return;
    }
    toast("Você saiu da fila.", "info");
    setFila((f) => ({ ...f, naFila: false, posicao: null, total: Math.max(0, f.total - 1) }));
    onQueueChanged();
  }

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
        {/*
          Capa vem de uma URL digitada pelo ADMIN, então usamos <img> puro em
          vez do <Image> do Next: ele exige que o host esteja em remotePatterns
          e a lista não pode ser prevista. O onError cai na imagem padrão
          quando a URL está quebrada.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={book.cover || "/placeholder.svg"}
          alt={`Capa do livro ${book.title}`}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder.svg";
          }}
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
          <StarRating nota={book.rating} total={book.totalRatings} showCount={false} />
          <span className="font-mono">{book.year}</span>
        </div>

        {/* Badge de disponibilidade: verde quando livre, laranja quando
            alugado. Fica sempre visível, não só no hover. */}
        <div>
          {book.available ? (
            <Badge variant="success">Disponível</Badge>
          ) : (
            <Badge variant="warning" className="max-w-full">
              <span className="truncate">Alugado</span>
              {isAdmin && book.rentedBy && (
                <span className="opacity-70">· {book.rentedBy}</span>
              )}
            </Badge>
          )}
        </div>

        {/* Comentários de quem já devolveu o livro. */}
        {avaliacoes.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-border bg-secondary/40 p-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {avaliacoes.length} avaliação(ões)
            </p>
            {avaliacoes.slice(0, 1).map((a) => (
              <div key={a.id} className="space-y-0.5">
                <StarRating nota={a.nota} total={0} showCount={false} />
                {a.comentario && (
                  <p className="text-xs leading-relaxed text-muted-foreground">“{a.comentario}”</p>
                )}
              </div>
            ))}
            {avaliacoes.length > 1 && (
              <p className="text-[11px] text-muted-foreground/70">
                +{avaliacoes.length - 1} outra(s) — abra o livro para ver
              </p>
            )}
          </div>
        )}

        {book.available ? (
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              onRent(book.id);
            }}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all",
              pending
                ? "cursor-wait bg-primary/60 text-primary-foreground"
                : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]",
            )}
          >
            Alugar
          </button>
        ) : podeDevolver ? (
          <button
            type="button"
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              onReturn(book.id);
            }}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all",
              pending
                ? "cursor-wait bg-secondary text-muted-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
            )}
          >
            <Undo2 className="size-4" />
            Devolver livro
          </button>
        ) : (
          <p className="rounded-lg bg-secondary/60 px-3 py-2 text-center text-xs text-muted-foreground">
            Alugado por outra pessoa
          </p>
        )}

        {/* Fila de reserva, só para quem não tem o livro. */}
        {!book.available && !podeDevolver && (
          <div className="flex items-center gap-2">
            {fila.naFila ? (
              <>
                <Badge variant="secondary" className="flex-1 justify-center">
                  <ListOrdered className="size-3" />
                  {fila.posicao ? `${fila.posicao}º na fila` : "na fila"}
                </Badge>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSairDaFila();
                  }}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  sair
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReservar();
                }}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent text-sm font-medium transition-all hover:bg-secondary active:scale-[0.98]"
              >
                <ListOrdered className="size-4" />
                {fila.total > 0 ? `Reservar (${fila.total} na fila)` : "Reservar"}
              </button>
            )}
          </div>
        )}

        {fila.naFila && !book.available && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
            <Check className="size-3" />
            Avisamos quando ele voltar
          </p>
        )}
      </div>
    </article>
  );
}
