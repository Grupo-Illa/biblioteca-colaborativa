"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StarInput } from "@/components/library/star-rating"
import type { Livro } from "@/lib/api"

type ReviewDialogProps = {
  livro: Livro
  /** Envia a devolução junto da avaliação. `undefined` = devolve sem avaliar. */
  onConfirm: (avaliacao: { nota: number; comentario: string } | undefined, livro: Livro) => void
  onClose: () => void
  busy: boolean
}

/**
 * Avaliação pós-devolução.
 *
 * Fica num componente próprio e só é montado quando o usuário pede, porque
 * dois <Dialog> modais vivos ao mesmo tempo fazem o Base UI fechar um ao
 * montar o outro — o modal principal da biblioteca fechava sozinho.
 */
export function ReviewDialog({ livro, onConfirm, onClose, busy }: ReviewDialogProps) {
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState("")

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Avaliar "{livro.titulo}"</DialogTitle>
          <DialogDescription>
            O que você achou? Sua nota e o comentário ficam visíveis para o time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sua nota
            </p>
            <StarInput value={nota} onChange={setNota} disabled={busy} />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="comentario-avaliacao"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Comentário{" "}
              <span className="font-normal normal-case text-muted-foreground/60">(opcional)</span>
            </label>
            <textarea
              id="comentario-avaliacao"
              value={comentario}
              onChange={(e) => setComentario(e.target.value.slice(0, 1000))}
              rows={4}
              maxLength={1000}
              disabled={busy}
              placeholder="O que marcou este livro para você?"
              className="w-full resize-none rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
            <p className="text-right font-mono text-xs text-muted-foreground">
              {comentario.length}/1000
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onConfirm(undefined, livro)}
            >
              Devolver sem avaliar
            </Button>
            <Button
              type="button"
              disabled={nota === 0 || busy}
              onClick={() => onConfirm({ nota, comentario }, livro)}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Devolver e avaliar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
