"use client";

import { Moon, Sun } from "lucide-react";
import { useTema } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function AlternadorTema() {
  const { tema, alternarTema } = useTema();
  const escuro = tema === "dark";

  return (
    <button
      type="button"
      onClick={alternarTema}
      role="switch"
      aria-checked={escuro}
      aria-label="Alternar tema claro e escuro"
      className="group relative inline-flex h-9 w-16 items-center rounded-full border border-border bg-secondary px-1 transition-colors hover:border-gold/50"
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          escuro ? "translate-x-7" : "translate-x-0",
        )}
      >
        <Sun
          className={cn(
            "absolute size-4 text-gold transition-all duration-300",
            escuro
              ? "scale-0 opacity-0 rotate-90"
              : "scale-100 opacity-100 rotate-0",
          )}
        />
        <Moon
          className={cn(
            "absolute size-4 text-gold transition-all duration-300",
            escuro
              ? "scale-100 opacity-100 rotate-0"
              : "scale-0 opacity-0 -rotate-90",
          )}
        />
      </span>
    </button>
  );
}
