"use client";

import { BookOpen, Calendar, Heart, Layers, Star } from "lucide-react";
import Image from "next/image";
import { FormularioAvaliacao } from "@/components/library/avaliacao-formulario";
import { ListaAvaliacoes } from "@/components/library/lista-avaliacoes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Avaliacao, Livro } from "@/lib/api";
import { cn } from "@/lib/utils";

type DialogoDetalheLivroProps = {
  livro: Livro | null;
  favorito: boolean;
  aoAlternarFavorito: (id: string) => void;
  aoAlugar: (livro: Livro) => void;
  alugando: boolean;
  /** Este usuario tem ou teve exemplar deste titulo: pode avaliar. */
  podeAvaliar: boolean;
  avaliacaoExistente: Avaliacao | null;
  notaMedia: number | null;
  aoAvaliar: (livroId: number, nota: number, comentario: string) => void;
  enviandoAvaliacao: boolean;
  aberto: boolean;
  aoMudarAbertura: (aberto: boolean) => void;
};

export function DialogoDetalheLivro({
  livro,
  favorito,
  aoAlternarFavorito,
  aoAlugar,
  alugando,
  podeAvaliar,
  avaliacaoExistente,
  notaMedia,
  aoAvaliar,
  enviandoAvaliacao,
  aberto,
  aoMudarAbertura,
}: DialogoDetalheLivroProps) {
  // Sem livro disponivel o botao some, mas quem ja alugou continua podendo
  // avaliar: o bloqueio e do exemplar, nao da nota.
  const bloqueado = !livro || !livro.disponivel || podeAvaliar;
  if (!livro) return null;

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0">
        <div className="grid gap-0 sm:grid-cols-[200px_1fr]">
          {/* Capa */}
          <div className="relative hidden aspect-[3/4] sm:block">
            <Image
              src={livro.capa || "/placeholder.svg"}
              alt={`Capa do livro ${livro.titulo}`}
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>

          {/* Detalhes */}
          {/* max-h + overflow: sem isso, titulo com muitas avaliacoes estica o
              conteudo alem da tela e o overflow-hidden do DialogContent corta
              o rodape, incluindo o botao de devolver. */}
          <div className="flex max-h-[90vh] flex-col gap-4 overflow-y-auto p-6">
            <DialogHeader className="space-y-2">
              <span className="inline-flex w-fit items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                {livro.categoria}
              </span>
              {/* break-words: um título sem espaços, como um caminho de
                  arquivo ou um código, não teria onde quebrar e vazaria do
                  diálogo. */}
              <DialogTitle className="text-pretty break-words text-xl leading-tight">
                {livro.titulo}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">por {livro.autor}</p>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-3.5 fill-gold text-gold" />
                <span className="font-mono text-foreground">
                  {livro.nota.toFixed(1)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span className="font-mono">{livro.ano}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                <span className="font-mono">{livro.paginas} pág.</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-3.5" />
                <span className="font-mono">
                  {livro.copias} {livro.copias === 1 ? "cópia" : "cópias"}
                </span>
              </span>
            </div>

            <DialogDescription className="text-pretty leading-relaxed text-foreground/80">
              {livro.descricao ||
                "Nenhuma descrição disponível para este livro."}
            </DialogDescription>

            <div className="mt-auto flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={bloqueado || alugando}
                onClick={() => aoAlugar(livro)}
                className={cn(
                  "h-10 flex-1 rounded-lg text-sm font-medium transition-all",
                  !bloqueado && !alugando
                    ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                    : "cursor-not-allowed bg-secondary text-muted-foreground",
                )}
              >
                {alugando
                  ? "Alugando..."
                  : podeAvaliar
                    ? "Você já tem este exemplar"
                    : livro.disponivel
                      ? `Alugar agora · ${livro.copias} disp.`
                      : "Indisponível no momento"}
              </button>
              <button
                type="button"
                onClick={() => aoAlternarFavorito(livro.id)}
                aria-label={
                  favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"
                }
                aria-pressed={favorito}
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95",
                  favorito
                    ? "border-gold/40 bg-gold/10"
                    : "border-border bg-secondary hover:bg-accent",
                )}
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
            </div>

            {/* Só aparece para quem já alugou o título, e continua aparecendo
                depois da devolução, porque o que habilita é o emprestimo. */}
            {podeAvaliar && (
              <FormularioAvaliacao
                // key remonta o formulario a cada titulo, senao a nota em que o
                // usuario estava mexendo vazaria para o livro seguinte.
                key={`form-${livro.id}`}
                avaliacaoExistente={avaliacaoExistente}
                aoEnviar={(nota, comentario) =>
                  aoAvaliar(Number(livro.id), nota, comentario)
                }
                enviando={enviandoAvaliacao}
              />
            )}

            {/* As opinioes da equipe aparecem para qualquer leitor do titulo,
                alugado ou nao. */}
            <ListaAvaliacoes
              key={`lista-${livro.id}`}
              livroId={Number(livro.id)}
              notaMedia={notaMedia ?? livro.nota}
              quantidadeAvaliacoes={livro.quantidadeAvaliacoes}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
