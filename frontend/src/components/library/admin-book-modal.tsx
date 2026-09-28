"use client";

import {
  BookOpen,
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DadosLivro, LivroApi } from "@/lib/api";
import {
  atualizarLivro,
  buscarLivros,
  criarLivro,
  deletarLivro,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type PropsModalAcervo = {
  aberto: boolean;
  aoMudarAbertura: (aberto: boolean) => void;
};

type ModoFormulario = "criar" | "editar";

const formularioVazio: DadosLivro = {
  titulo: "",
  autor: "",
  dataLancamento: "",
  editora: "",
  statusAluguel: "DISPONIVEL",
  quantidadeTotal: 1,
};

export function ModalAcervo({ aberto, aoMudarAbertura }: PropsModalAcervo) {
  const [livros, setLivros] = useState<LivroApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState<ModoFormulario>("criar");
  const [dadosFormulario, setDadosFormulario] =
    useState<DadosLivro>(formularioVazio);
  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarLivros = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await buscarLivros();
      setLivros(dados);
    } catch {
      setErro("Erro ao carregar livros");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (aberto) {
      carregarLivros();
      setFormularioAberto(false);
      setErro("");
    }
  }, [aberto, carregarLivros]);

  const filtrados = livros.filter(
    (l) =>
      l.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      l.autor.toLowerCase().includes(busca.toLowerCase()) ||
      l.editora.toLowerCase().includes(busca.toLowerCase()),
  );

  function abrirFormularioCriacao() {
    setModoFormulario("criar");
    setIdEmEdicao(null);
    setDadosFormulario(formularioVazio);
    setFormularioAberto(true);
    setErro("");
  }

  function abrirFormularioEdicao(livro: LivroApi) {
    setModoFormulario("editar");
    setIdEmEdicao(livro.id);
    setDadosFormulario({
      titulo: livro.titulo,
      autor: livro.autor,
      dataLancamento: livro.dataLancamento.split("T")[0],
      editora: livro.editora,
      statusAluguel: livro.statusAluguel,
      quantidadeTotal: livro.quantidadeTotal,
    });
    setFormularioAberto(true);
    setErro("");
  }

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");

    const resultado =
      modoFormulario === "criar"
        ? await criarLivro(dadosFormulario)
        : await atualizarLivro(idEmEdicao!, dadosFormulario);

    setEnviando(false);

    if (resultado.erro) {
      // O backend manda a mensagem específica do erro de validação.
      setErro(resultado.mensagem || resultado.erro);
    } else {
      setFormularioAberto(false);
      carregarLivros();
    }
  }

  async function aoExcluir(id: number) {
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;
    setErro("");
    const resultado = await deletarLivro(id);
    if (resultado.erro) {
      setErro(resultado.mensagem || resultado.erro);
    } else {
      carregarLivros();
    }
  }

  return (
    <>
      <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
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

          {erro && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {erro}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar na tabela..."
                className="h-9 w-full rounded-xl border border-border bg-secondary/60 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <Button onClick={abrirFormularioCriacao} size="sm">
              <Plus className="size-4" />
              Novo livro
            </Button>
          </div>

          <div className="no-scrollbar flex-1 overflow-auto rounded-xl border border-border">
            {carregando ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : filtrados.length === 0 ? (
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
                    <th className="px-4 py-3">Exemplares</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((livro) => (
                    <tr
                      key={livro.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {livro.id}
                      </td>
                      <td className="px-4 py-3 font-medium">{livro.titulo}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {livro.autor}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {livro.editora}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {livro.quantidadeTotal - livro.quantidadeAlugada}/
                        {livro.quantidadeTotal}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            livro.statusAluguel === "DISPONIVEL"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {livro.statusAluguel === "DISPONIVEL"
                            ? "Disponível"
                            : "Alugado"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => abrirFormularioEdicao(livro)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => aoExcluir(livro.id)}
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

      {/* Formulário */}
      <Dialog open={formularioAberto} onOpenChange={setFormularioAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modoFormulario === "criar" ? "Cadastrar livro" : "Editar livro"}
            </DialogTitle>
            <DialogDescription>
              {modoFormulario === "criar"
                ? "Preencha os dados para adicionar um novo livro ao acervo."
                : "Altere as informações do livro selecionado."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={aoEnviar} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="campoTitulo"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Título
              </label>
              <input
                id="campoTitulo"
                type="text"
                required
                value={dadosFormulario.titulo}
                onChange={(e) =>
                  setDadosFormulario((p) => ({ ...p, titulo: e.target.value }))
                }
                placeholder="Título do livro"
                className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  htmlFor="campoAutor"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Autor
                </label>
                <input
                  id="campoAutor"
                  type="text"
                  required
                  value={dadosFormulario.autor}
                  onChange={(e) =>
                    setDadosFormulario((p) => ({ ...p, autor: e.target.value }))
                  }
                  placeholder="Nome do autor"
                  className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="campoEditora"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Editora
                </label>
                <input
                  id="campoEditora"
                  type="text"
                  required
                  value={dadosFormulario.editora}
                  onChange={(e) =>
                    setDadosFormulario((p) => ({
                      ...p,
                      editora: e.target.value,
                    }))
                  }
                  placeholder="Editora"
                  className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  htmlFor="campoQuantidadeTotal"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Exemplares
                </label>
                <input
                  id="campoQuantidadeTotal"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={dadosFormulario.quantidadeTotal ?? 1}
                  onChange={(e) =>
                    setDadosFormulario((p) => ({
                      ...p,
                      quantidadeTotal: e.target.valueAsNumber,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  Quantos exemplares deste título a biblioteca possui.
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="campoDataLancamento"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Data de lançamento
                </label>
                <input
                  id="campoDataLancamento"
                  type="date"
                  required
                  value={dadosFormulario.dataLancamento}
                  onChange={(e) =>
                    setDadosFormulario((p) => ({
                      ...p,
                      dataLancamento: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-border bg-secondary/60 px-4 text-sm outline-none transition-colors [color-scheme:inherit] focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="campoStatus"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Status
              </label>
              <div className="relative">
                <select
                  id="campoStatus"
                  value={dadosFormulario.statusAluguel}
                  onChange={(e) =>
                    setDadosFormulario((p) => ({
                      ...p,
                      statusAluguel: e.target.value as "DISPONIVEL" | "ALUGADO",
                    }))
                  }
                  className="h-10 w-full appearance-none rounded-xl border border-border bg-secondary/60 px-4 pr-10 text-sm outline-none transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                >
                  <option value="DISPONIVEL">Disponível</option>
                  <option value="ALUGADO">Alugado</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormularioAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando && <Loader2 className="size-4 animate-spin" />}
                {modoFormulario === "criar" ? "Cadastrar" : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
