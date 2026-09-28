"use client"

import { useCallback, useEffect, useState } from "react"
import { BookOpen, Loader2, Plus, Pencil, Trash2, X, Search, Check, ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Livro, LivroPayload } from "@/lib/api"
import { getLivros, createBook, updateBook, deleteBook } from "@/lib/api"

type AdminBookModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormMode = "create" | "edit"

const emptyForm: LivroPayload = {
  titulo: "",
  autor: "",
  dataLancamento: "",
  editora: "",
  statusAluguel: "DISPONIVEL",
  quantidadeTotal: 1,
}

export function AdminBookModal({ open, onOpenChange }: AdminBookModalProps) {
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [formData, setFormData] = useState<LivroPayload>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fetchLivros = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLivros()
      setLivros(data)
    } catch {
      setError("Erro ao carregar livros")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchLivros()
      setFormOpen(false)
      setError("")
    }
  }, [open, fetchLivros])

  const filtered = livros.filter(
    (l) =>
      l.titulo.toLowerCase().includes(search.toLowerCase()) ||
      l.autor.toLowerCase().includes(search.toLowerCase()) ||
      l.editora.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreateForm() {
    setFormMode("create")
    setEditingId(null)
    setFormData(emptyForm)
    setFormOpen(true)
    setError("")
  }

  function openEditForm(livro: Livro) {
    setFormMode("edit")
    setEditingId(livro.id)
    setFormData({
      titulo: livro.titulo,
      autor: livro.autor,
      dataLancamento: livro.dataLancamento.split("T")[0],
      editora: livro.editora,
      statusAluguel: livro.statusAluguel,
      quantidadeTotal: livro.quantidadeTotal,
    })
    setFormOpen(true)
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const result =
      formMode === "create"
        ? await createBook(formData)
        : await updateBook(editingId!, formData)

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
    } else {
      setFormOpen(false)
      fetchLivros()
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir este livro?")) return
    setError("")
    const result = await deleteBook(id)
    if (result.error) {
      setError(result.error)
    } else {
      fetchLivros()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Gerenciar Acervo
            </DialogTitle>
            <DialogDescription>
              Visualize, cadastre, edite ou remova livros do acervo.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar na tabela..."
                className="h-9 w-full rounded-xl border border-border bg-secondary/60 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <Button onClick={openCreateForm} size="sm">
              <Plus className="size-4" />
              Novo livro
            </Button>
          </div>

          <div className="no-scrollbar flex-1 overflow-auto rounded-xl border border-border">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                Nenhum livro encontrado.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Título</th>
                    <th className="px-4 py-3">Autor</th>
                    <th className="px-4 py-3">Editora</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((livro) => (
                    <tr key={livro.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{livro.id}</td>
                      <td className="px-4 py-3 font-medium">{livro.titulo}</td>
                      <td className="px-4 py-3 text-muted-foreground">{livro.autor}</td>
                      <td className="px-4 py-3 text-muted-foreground">{livro.editora}</td>
                      <td className="px-4 py-3">
                        <Badge variant={livro.statusAluguel === "DISPONIVEL" ? "default" : "secondary"}>
                          {livro.statusAluguel === "DISPONIVEL" ? "Disponível" : "Alugado"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditForm(livro)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(livro.id)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Cadastrar livro" : "Editar livro"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Preencha os dados para adicionar um novo livro ao acervo."
                : "Altere as informações do livro selecionado."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Título
              </label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Título do livro"
                className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Autor
                </label>
                <input
                  type="text"
                  required
                  value={formData.autor}
                  onChange={(e) => setFormData((p) => ({ ...p, autor: e.target.value }))}
                  placeholder="Nome do autor"
                  className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Editora
                </label>
                <input
                  type="text"
                  required
                  value={formData.editora}
                  onChange={(e) => setFormData((p) => ({ ...p, editora: e.target.value }))}
                  placeholder="Editora"
                  className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  htmlFor="quantidadeTotal"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Exemplares
                </label>
                <input
                  id="quantidadeTotal"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={formData.quantidadeTotal ?? 1}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, quantidadeTotal: e.target.valueAsNumber }))
                  }
                  className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  Quantos exemplares deste título a biblioteca possui.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Data de lançamento
                </label>
                <input
                  type="date"
                  required
                  value={formData.dataLancamento}
                  onChange={(e) => setFormData((p) => ({ ...p, dataLancamento: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors [color-scheme:inherit] focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={formData.statusAluguel}
                    onChange={(e) => setFormData((p) => ({ ...p, statusAluguel: e.target.value as "DISPONIVEL" | "ALUGADO" }))}
                    className="h-10 w-full appearance-none rounded-xl border border-border bg-secondary/60 px-4 pr-10 text-sm outline-none transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                  >
                    <option value="DISPONIVEL">Disponível</option>
                    <option value="ALUGADO">Alugado</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {formMode === "create" ? "Cadastrar" : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
