"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type SortOption = "relevancia" | "avaliacao" | "recentes" | "titulo";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevancia", label: "Relevância" },
  { value: "avaliacao", label: "Avaliação" },
  { value: "recentes", label: "Recentes" },
  { value: "titulo", label: "Título" },
];

type FilterPanelProps = {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  availableOnly: boolean;
  onAvailableOnlyChange: (value: boolean) => void;
  minRating: number;
  onMinRatingChange: (value: number) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  onReset: () => void;
  resultCount: number;
  categories: string[];
};

export function FilterPanel({
  selectedCategories,
  onToggleCategory,
  availableOnly,
  onAvailableOnlyChange,
  minRating,
  onMinRatingChange,
  sort,
  onSortChange,
  onReset,
  resultCount,
  categories,
}: FilterPanelProps) {
  return (
    <aside className="flex flex-col gap-6 rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-gold" />
          <h2 className="text-sm font-semibold">Filtros</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          Limpar
        </button>
      </div>

      {/* Ordenação */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Ordenar por
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSortChange(option.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                sort === option.value
                  ? "border-gold/60 bg-gold/10 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Categorias */}
      {categories.length > 0 && (
        <>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Categorias
            </p>
            <div className="space-y-1">
              {categories.map((category) => {
                const checked = selectedCategories.includes(category);
                return (
                  <label
                    key={category}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                      checked
                        ? "text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleCategory(category)}
                      className="data-[state=checked]:border-gold data-[state=checked]:bg-gold data-[state=checked]:text-gold-foreground"
                    />
                    {category}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="h-px bg-border" />
        </>
      )}

      {/* Avaliação mínima */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Avaliação mínima
          </p>
          <span className="font-mono text-xs font-semibold text-gold">
            {minRating.toFixed(1)}
          </span>
        </div>
        <Slider
          value={[minRating]}
          min={0}
          max={5}
          step={0.5}
          onValueChange={(v) => {
            // @base-ui/react emite `number` em sliders de valor unico
            // (Thumb unico => values.length === 1 => range === false),
            // enquanto o Radix emite `[number]`. Accepta os dois formatos.
            const next = Array.isArray(v) ? v[0] : v;
            if (typeof next === "number" && !Number.isNaN(next)) {
              onMinRatingChange(next);
            }
          }}
          aria-label="Avaliação mínima"
        />
      </div>

      <div className="h-px bg-border" />

      {/* Disponibilidade */}
      <label className="flex cursor-pointer items-center justify-between">
        <span className="text-sm">Somente disponíveis</span>
        <Switch
          checked={availableOnly}
          onCheckedChange={onAvailableOnlyChange}
          aria-label="Mostrar somente livros disponíveis"
        />
      </label>

      <div className="rounded-lg bg-secondary/50 px-3 py-2.5 text-center text-xs text-muted-foreground">
        <span className="font-mono font-semibold text-foreground">
          {resultCount}
        </span>{" "}
        {resultCount === 1 ? "livro encontrado" : "livros encontrados"}
      </div>
    </aside>
  );
}
