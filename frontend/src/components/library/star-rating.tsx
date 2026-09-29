"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

/** Exibição somente-leitura das notas. */
export function StarRating({
  nota,
  total,
  className,
  showCount = true,
}: {
  nota: number
  total?: number
  className?: string
  showCount?: boolean
}) {
  const inteiro = Math.round(nota)

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={total ? `${nota.toFixed(1)} de 5 em ${total} avaliação(ões)` : "Ainda sem avaliações"}
    >
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i <= inteiro ? "fill-gold text-gold" : "text-muted-foreground/30",
            )}
          />
        ))}
      </span>
      {showCount && (
        <span className="font-mono text-xs text-muted-foreground">
          {total ? `${nota.toFixed(1)} (${total})` : "sem notas"}
        </span>
      )}
      {/* Leitor de tela: as estrelas puras não anunciam a nota. */}
      <span className="sr-only">
        {total ? `Nota ${nota.toFixed(1)} de 5, ${total} avaliações` : "Sem avaliações"}
      </span>
    </span>
  )
}

/**
 * Entrada de nota por estrelas.
 *
 * O input real é um conjunto de radio buttons (um por nota), que é o que dá
 * navegação por teclado e leitores de tela corretamente — um div com onClick
 * seria acessível só por mouse.
 */
export function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (nota: number) => void
  disabled?: boolean
}) {
  // "hover" separado do valor confirmado, para o usuário poder pré-visualizar
  // a nota sem precisar clicar para confirmar.
  const [hover, setHover] = useState(0)
  const exibida = hover || value

  return (
    <div
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((nota) => {
        const ativa = nota <= exibida
        return (
          <label
            key={nota}
            className={cn(
              "relative cursor-pointer transition-transform",
              disabled && "cursor-not-allowed opacity-60",
              !disabled && "hover:scale-110",
            )}
            onMouseEnter={() => !disabled && setHover(nota)}
          >
            <input
              type="radio"
              name="nota"
              value={nota}
              checked={value === nota}
              disabled={disabled}
              onChange={() => onChange(nota)}
              className="peer sr-only"
            />
            <Star
              className={cn(
                "size-7 transition-colors",
                ativa ? "fill-gold text-gold" : "text-muted-foreground/30",
                "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50",
              )}
            />
            <span className="sr-only">{nota} {nota === 1 ? "estrela" : "estrelas"}</span>
          </label>
        )
      })}
      {value > 0 && (
        <span className="ml-1 font-mono text-xs text-muted-foreground">{value}/5</span>
      )}
    </div>
  )
}
