"use client"

import { BookOpen, Heart, Library, LogIn, Search, User } from "lucide-react"
import { useEffect, useState } from "react"
import { AdminBookModal } from "@/components/library/admin-book-modal"
import { MeusAlugueis } from "@/components/library/meus-alugueis"
import { ThemeToggle } from "@/components/library/theme-toggle"
import { Input } from "@/components/ui/input"
import type { Emprestimo, User as UserType } from "@/lib/api"
import { cn } from "@/lib/utils"

type HeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  favoritesCount: number
  showFavoritesOnly: boolean
  onToggleFavorites: () => void
  alugueis: Emprestimo[]
  carregandoAlugueis: boolean
  devolvendoId: number | null
  onDevolver: (emprestimoId: number) => void
}

export function Header({
  query,
  onQueryChange,
  favoritesCount,
  showFavoritesOnly,
  onToggleFavorites,
  alugueis,
  carregandoAlugueis,
  devolvendoId,
  onDevolver,
}: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [adminModalOpen, setAdminModalOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("acervo-user")
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("acervo-user")
    setCurrentUser(null)
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-5" />
            </span>
            <div className="leading-none">
              <p className="font-mono text-sm font-semibold tracking-tight">Acervo</p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">Biblioteca interna</p>
            </div>
          </a>

          <div className="relative ml-auto flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar por título ou autor..."
              aria-label="Buscar livros"
              className="h-10 rounded-full border-border bg-secondary/60 pl-9 pr-4 focus-visible:ring-gold/40"
            />
          </div>

          <button
            type="button"
            onClick={onToggleFavorites}
            aria-pressed={showFavoritesOnly}
            className={cn(
              "relative inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all",
              showFavoritesOnly
                ? "border-gold/60 bg-gold/10 text-foreground"
                : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <Heart
              className={cn("size-4 transition-colors", showFavoritesOnly && "fill-gold text-gold")}
            />
            <span className="hidden sm:inline">Favoritos</span>
            {favoritesCount > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-semibold text-gold-foreground">
                {favoritesCount}
              </span>
            )}
          </button>
          {/* Fica junto dos demais controles do topo, visivel so para quem
              esta logado, porque lista algueis e pessoal. */}
          {currentUser && (
            <MeusAlugueis
              alugueis={alugueis}
              carregando={carregandoAlugueis}
              devolvendoId={devolvendoId}
              onDevolver={onDevolver}
            />
          )}

          {currentUser ? (
            <div className="group relative">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                <User className="size-4" />
                <span className="hidden sm:inline max-w-24 truncate">{currentUser.username}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 origin-top-right scale-95 rounded-xl border border-border bg-popover p-1 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
                {currentUser.role === "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Library className="size-4" />
                    Gerenciar acervo
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <a
              href="/auth"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline">Entrar</span>
            </a>
          )}

          <ThemeToggle />
        </div>
      </header>

      <AdminBookModal open={adminModalOpen} onOpenChange={setAdminModalOpen} />
    </>
  )
}
