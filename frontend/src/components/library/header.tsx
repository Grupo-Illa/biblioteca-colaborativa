"use client"

import { useCallback, useEffect, useState } from "react"
import { BookOpen, Heart, Search, LogIn, LogOut, User, Library, BookMarked, Bookmark } from "lucide-react"
import { ThemeToggle } from "@/components/library/theme-toggle"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getMe, logoutUser, getMyRentals, getMyReservations } from "@/lib/api"
import type { User as UserType } from "@/lib/api"
import { AdminBookModal } from "@/components/library/admin-book-modal"
import { MyRentalsDialog } from "@/components/library/my-rentals-dialog"

type HeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  favoritesCount: number
  showFavoritesOnly: boolean
  onToggleFavorites: () => void
  onLogout: () => void
  /** Chamado depois de uma devolução, para a home recarregar o acervo. */
  onRentalChanged: () => void
  /**
   * Contador que a home incrementa a cada mudança no acervo. Os contadores
   * do atalho dependem dele porque `onRentalChanged` é uma referência estável
   * e nunca mudaria de identidade para disparar um efeito.
   */
  acervoRev: number
}

export function Header({
  query,
  onQueryChange,
  favoritesCount,
  showFavoritesOnly,
  onToggleFavorites,
  onLogout,
  onRentalChanged,
  acervoRev,
}: HeaderProps) {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [rentalsOpen, setRentalsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  // Contadores da "minha biblioteca", exibidos no atalho ao lado de Favoritos.
  const [alugados, setAlugados] = useState(0)
  const [reservados, setReservados] = useState(0)

  const carregarContadores = useCallback(async () => {
    const [meus, reservas] = await Promise.all([getMyRentals(), getMyReservations()])
    setAlugados(meus.length)
    setReservados(reservas.length)
  }, [])

  useEffect(() => {
    // O `role` vem do servidor, que lê o cookie httpOnly. O botão de admin
    // abaixo é só conveniência de UI — quem barra de verdade é o
    // requireAdmin no backend.
    getMe().then((me) => {
      setCurrentUser(me)
      if (me) carregarContadores()
    })
  }, [carregarContadores])

  // Sempre que a home sinaliza mudança no acervo, os contadores acompanham.
  useEffect(() => {
    if (currentUser) void carregarContadores()
  }, [acervoRev, currentUser, carregarContadores])

  useEffect(() => {
    // O `role` vem do servidor, que lê o cookie httpOnly. O botão de admin
    // abaixo é só conveniência de UI — quem barra de verdade é o
    // requireAdmin no backend.
    getMe().then(setCurrentUser)
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    setCurrentUser(null)
    setAlugados(0)
    setReservados(0)
    onLogout()
  }

  /** Abre a minha biblioteca pelo atalho do header. */
  function abrirBiblioteca() {
    setRentalsOpen(true)
    // Recarrega os contadores ao abrir, para refletir o estado atual.
    void carregarContadores()
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

          {currentUser && (
            <button
              type="button"
              onClick={abrirBiblioteca}
              aria-label={`Minha biblioteca: ${alugados} alugado(s), ${reservados} reserva(s)`}
              className={cn(
                "relative inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all",
                alugados > 0
                  ? "border-gold/60 bg-gold/10 text-foreground"
                  : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <BookMarked className="size-4" />
              <span className="hidden sm:inline">Meus livros</span>
              {alugados > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-semibold text-gold-foreground">
                  {alugados}
                </span>
              )}
              {reservados > 0 && (
                <span
                  className="flex min-w-5 items-center justify-center rounded-full border border-border bg-background px-1.5 text-[11px] font-semibold text-muted-foreground"
                  title={`${reservados} na fila`}
                >
                  <Bookmark className="size-2.5" />
                  {reservados}
                </span>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                <User className="size-4" />
                <span className="hidden sm:inline max-w-24 truncate">{currentUser.username}</span>
              </button>
              {userMenuOpen && (
                <>
                  {/* Fecha ao clicar fora */}
                  <button
                    type="button"
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setUserMenuOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-2 w-48 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-lg"
                  >
                    {currentUser.role === "ADMIN" && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAdminModalOpen(true)
                          setUserMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Library className="size-4" />
                        Gerenciar acervo
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setRentalsOpen(true)
                        setUserMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <BookMarked className="size-4" />
                      Meus empréstimos
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <LogOut className="size-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
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

      <AdminBookModal
        open={adminModalOpen}
        onOpenChange={setAdminModalOpen}
        onChanged={onRentalChanged}
      />
      <MyRentalsDialog
        open={rentalsOpen}
        onOpenChange={setRentalsOpen}
        onReturned={onRentalChanged}
      />
    </>
  )
}
