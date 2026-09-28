"use client";

import { BookOpen, Heart, Library, LogIn, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { ModalAcervo } from "@/components/library/admin-book-modal";
import { MeusAlugueis } from "@/components/library/meus-alugueis";
import { AlternadorTema } from "@/components/library/theme-toggle";
import { Input } from "@/components/ui/input";
import type { Emprestimo, Usuario as UsuarioType } from "@/lib/api";
import { cn } from "@/lib/utils";

type PropsCabecalho = {
  busca: string;
  aoMudarBusca: (valor: string) => void;
  quantidadeFavoritos: number;
  mostrarSomenteFavoritos: boolean;
  aoAlternarFavoritos: () => void;
  alugueis: Emprestimo[];
  carregandoAlugueis: boolean;
  devolvendoId: number | null;
  aoDevolver: (idEmprestimo: number) => void;
};

export function Cabecalho({
  busca,
  aoMudarBusca,
  quantidadeFavoritos,
  mostrarSomenteFavoritos,
  aoAlternarFavoritos,
  alugueis,
  carregandoAlugueis,
  devolvendoId,
  aoDevolver,
}: PropsCabecalho) {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioType | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("acervo-usuario");
    if (guardado) {
      try {
        setUsuarioAtual(JSON.parse(guardado));
      } catch {}
    }
  }, []);

  const sair = () => {
    localStorage.removeItem("acervo-usuario");
    setUsuarioAtual(null);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-5" />
            </span>
            <div className="leading-none">
              <p className="font-mono text-sm font-semibold tracking-tight">
                Acervo
              </p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Biblioteca interna
              </p>
            </div>
          </a>

          <div className="relative ml-auto flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => aoMudarBusca(e.target.value)}
              placeholder="Buscar por tÃ­tulo ou autor..."
              aria-label="Buscar livros"
              className="h-10 rounded-full border-border bg-secondary/60 pl-9 pr-4 focus-visible:ring-gold/40"
            />
          </div>

          <button
            type="button"
            onClick={aoAlternarFavoritos}
            aria-pressed={mostrarSomenteFavoritos}
            className={cn(
              "relative inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all",
              mostrarSomenteFavoritos
                ? "border-gold/60 bg-gold/10 text-foreground"
                : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <Heart
              className={cn(
                "size-4 transition-colors",
                mostrarSomenteFavoritos && "fill-gold text-gold",
              )}
            />
            <span className="hidden sm:inline">Favoritos</span>
            {quantidadeFavoritos > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-semibold text-gold-foreground">
                {quantidadeFavoritos}
              </span>
            )}
          </button>
          {/* Fica junto dos demais controles do topo, visivel so para quem
              esta logado, porque lista algueis e pessoal. */}
          {usuarioAtual && (
            <MeusAlugueis
              alugueis={alugueis}
              carregando={carregandoAlugueis}
              devolvendoId={devolvendoId}
              aoDevolver={aoDevolver}
            />
          )}

          {usuarioAtual ? (
            <div className="group relative">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                <User className="size-4" />
                <span className="hidden sm:inline max-w-24 truncate">
                  {usuarioAtual.nomeUsuario}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 origin-top-right scale-95 rounded-xl border border-border bg-popover p-1 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
                {usuarioAtual.perfil === "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => setModalAberto(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Library className="size-4" />
                    Gerenciar acervo
                  </button>
                )}
                <button
                  type="button"
                  onClick={sair}
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

          <AlternadorTema />
        </div>
      </header>

      <ModalAcervo aberto={modalAberto} aoMudarAbertura={setModalAberto} />
    </>
  );
}
