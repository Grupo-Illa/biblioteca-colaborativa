"use client"

import { useCallback, useEffect, useState } from "react"
import { BookOpen, Loader2, Undo2, CalendarDays, ListOrdered, X, Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { ReviewDialog } from "@/components/library/review-dialog"
import {
  getMyRentals,
  returnBook,
  getMyReservations,
  reserveBook,
  cancelReservation,
  type Livro,
  type MinhaReserva,
} from "@/lib/api"

type Tab = "emprestimos" | "reservas"

type MyRentalsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Avisa a tela inicial para recarregar o acervo depois de uma devolução. */
  onReturned: () => void
}

/** "2026-09-28T20:03:53.642Z" -> "28/09/2026" */
function formatarData(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR")
}

export function MyRentalsDialog({ open, onOpenChange, onReturned }: MyRentalsDialogProps) {
  const [tab, setTab] = useState<Tab>("emprestimos")
  const [livros, setLivros] = useState<Livro[]>([])
  const [reservas, setReservas] = useState<MinhaReserva[]>([])
  const [loading, setLoading] = useState(true)
  const [ocupado, setOcupado] = useState<number | null>(null)

  // Estado da avaliação do livro que está sendo devolvido.
  const [avaliando, setAvaliando] = useState<Livro | null>(null)

  const { toast } = useToast()

  const carregar = useCallback(async () => {
    setLoading(true)
    const [meus, minhasReservas] = await Promise.all([getMyRentals(), getMyReservations()])
    setLivros(meus)
    setReservas(minhasReservas)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) {
      // Ao abrir, avisa se algum livro da fila voltou a ficar disponível.
      // É a "notificação da fila": sem push, o aviso aparece aqui.
      getMyReservations().then((rs) => {
        const voltou = rs.filter((r) => r.livro.disponivelAgora)
        if (voltou.length > 0) {
          const primeiro = voltou[0].livro.titulo
          toast(
            voltou.length === 1
              ? `"${primeiro}" que você reservou já está disponível.`
              : `${voltou.length} livros da sua fila já estão disponíveis.`,
            "info",
          )
        }
      })
      carregar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, carregar])

  function abrirAvaliacao(livro: Livro) {
    setAvaliando(livro)
  }

  function fecharAvaliacao() {
    setAvaliando(null)
  }

  /**
   * Devolve. Com avaliação se o usuário deu nota; sem se devolveu direto.
   * Mesmo endpoint nos dois casos — o backend trata a avaliação como opcional.
   */
  async function handleReturn(
    livro: Livro,
    avaliacao?: { nota: number; comentario: string },
  ) {
    setOcupado(livro.id)
    const result = await returnBook(livro.id, avaliacao)
    setOcupado(null)

    if (result.error) {
      toast(result.message, "erro")
      return
    }

    toast(
      avaliacao ? `"${livro.titulo}" devolvido e avaliado.` : `"${livro.titulo}" devolvido.`,
      "sucesso",
    )

    // Se havia fila, a pessoa da frente precisa saber que já pode pegar.
    if (result.fila && result.fila.total > 0) {
      toast(
        `${result.fila.total} pessoa(s) na fila deste título já podem pegá-lo.`,
        "info",
      )
    }

    fecharAvaliacao()
    await carregar()
    onReturned()
  }

  async function handleCancelReservation(reserva: MinhaReserva) {
    setOcupado(reserva.livro.id)
    const result = await cancelReservation(reserva.livro.id)
    setOcupado(null)

    if (result.error) {
      toast(result.message, "erro")
      return
    }
    toast("Reserva cancelada.", "sucesso")
    await carregar()
    onReturned()
  }

  /** Chegou a vez: o usuário reserva e aluga em seguida. */
  async function handleGrab(reserva: MinhaReserva) {
    setOcupado(reserva.livro.id)
    const result = await reserveBook(reserva.livro.id)
    setOcupado(null)

    if (result.error) {
      toast(result.message, "erro")
      return
    }
    toast(`Reserva confirmada para "${reserva.livro.titulo}". Vá até o catálogo para alugar.`, "sucesso")
    await carregar()
    onReturned()
  }

  const listaVazia =
    tab === "emprestimos" ? (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <BookOpen className="size-6" />
        </span>
        <p className="mt-4 font-medium">Você não tem livros alugados</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Alugue um título no acervo e ele aparece aqui.
        </p>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ListOrdered className="size-6" />
        </span>
        <p className="mt-4 font-medium">Você não está em nenhuma fila</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Reserve um título alugado e avise a fila quando ele voltar.
        </p>
      </div>
    )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Minha Biblioteca
            </DialogTitle>
            <DialogDescription>
              Livros que você tem em mãos e os que estão na sua fila de reserva.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4 flex rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setTab("emprestimos")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                tab === "emprestimos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="size-4" />
              Meus empréstimos
              {livros.length > 0 && (
                <span className="rounded-full bg-gold px-1.5 text-[11px] font-semibold text-gold-foreground">
                  {livros.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab("reservas")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                tab === "reservas"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListOrdered className="size-4" />
              Minhas reservas
              {reservas.length > 0 && (
                <span className="rounded-full bg-gold px-1.5 text-[11px] font-semibold text-gold-foreground">
                  {reservas.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : tab === "emprestimos" ? (
              livros.length === 0 ? (
                listaVazia
              ) : (
                <ul className="space-y-2">
                  {livros.map((livro) => (
                    <li
                      key={livro.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={livro.capa?.trim() || "/placeholder.svg"}
                        alt=""
                        className="size-16 w-11 shrink-0 rounded-lg border border-border object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{livro.titulo}</p>
                        <p className="truncate text-sm text-muted-foreground">{livro.autor}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge variant="warning">Alugado</Badge>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="size-3" />
                            desde {formatarData(livro.alugadoEm)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={ocupado === livro.id}
                          onClick={() => handleReturn(livro)}
                        >
                          {ocupado === livro.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Undo2 className="size-4" />
                          )}
                          Devolver
                        </Button>
                        <button
                          type="button"
                          onClick={() => abrirAvaliacao(livro)}
                          className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                        >
                          devolver e avaliar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : reservas.length === 0 ? (
              listaVazia
            ) : (
              <ul className="space-y-2">
                {reservas.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.livro.capa?.trim() || "/placeholder.svg"}
                      alt=""
                      className="size-16 w-11 shrink-0 rounded-lg border border-border object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.livro.titulo}</p>
                      <p className="truncate text-sm text-muted-foreground">{r.livro.autor}</p>
                      <div className="mt-1.5">
                        {r.livro.disponivelAgora ? (
                          <Badge variant="success">Chegou a vez — disponível</Badge>
                        ) : (
                          <Badge variant="secondary">
                            na fila · com {r.livro.alugadoPor ?? "outra pessoa"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {r.livro.disponivelAgora ? (
                        <Button
                          size="sm"
                          disabled={ocupado === r.livro.id}
                          onClick={() => handleGrab(r)}
                        >
                          {ocupado === r.livro.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Star className="size-4" />
                          )}
                          Alugar agora
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">aguardando devolução</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancelReservation(r)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                      >
                        <X className="size-3" />
                        sair da fila
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/*
        Avaliação em componente próprio e montado só quando necessário:
        dois <Dialog> modais vivos ao mesmo tempo fazem o Base UI fechar um
        quando o outro monta, e o modal principal fechava sozinho.
      */}
      {avaliando && (
        <ReviewDialog
          livro={avaliando}
          busy={ocupado === avaliando.id}
          onClose={fecharAvaliacao}
          onConfirm={(avaliacao, livro) => handleReturn(livro, avaliacao)}
        />
      )}
    </>
  )
}
