"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = "sucesso" | "erro" | "info"

type Toast = {
  id: number
  mensagem: string
  variante: ToastVariant
}

type ToastContextValue = {
  /** Mostra um toast. `info` some mais rápido porque é o menos urgente. */
  toast: (mensagem: string, variante?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const DURACAO_MS: Record<ToastVariant, number> = {
  sucesso: 3500,
  erro: 6000,
  info: 3000,
}

const ESTILO: Record<ToastVariant, { icone: typeof Info; classe: string }> = {
  sucesso: { icone: CheckCircle2, classe: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  erro: { icone: AlertCircle, classe: "border-destructive/40 bg-destructive/10 text-destructive" },
  info: { icone: Info, classe: "border-border bg-popover text-foreground" },
}

/**
 * Toasts mínimos, sem dependência externa. Monta um container `fixed` no
 * canto inferior; a lista é gerenciada aqui e some sozinha por timer.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  // contador monotônico: dois toasts no mesmo ms não podem colidir no id
  const proximoId = useRef(1)

  const remover = useCallback((id: number) => {
    setToasts((atuais) => atuais.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (mensagem: string, variante: ToastVariant = "info") => {
      const id = proximoId.current++
      setToasts((atuais) => [...atuais, { id, mensagem, variante }])
      setTimeout(() => remover(id), DURACAO_MS[variante])
    },
    [remover],
  )

  const valor = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={valor}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((t) => {
          const { icone: Icone, classe } = ESTILO[t.variante]
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm",
                "animate-fade-up",
                classe,
              )}
            >
              <Icone className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1 text-sm leading-relaxed">{t.mensagem}</p>
              <button
                type="button"
                onClick={() => remover(t.id)}
                aria-label="Fechar aviso"
                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>")
  return ctx
}
