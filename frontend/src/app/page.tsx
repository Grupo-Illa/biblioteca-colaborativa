"use client";

import { BookX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartaoLivro } from "@/components/library/book-card";
import { DialogoDetalheLivro } from "@/components/library/book-detail-dialog";
import {
  type OpcaoOrdenacao,
  PainelFiltros,
} from "@/components/library/filter-panel";
import { Cabecalho } from "@/components/library/header";
import {
  type Avaliacao,
  alugarLivro as alugarLivroNaApi,
  avaliarLivro as avaliarLivroNaApi,
  devolverAluguel,
  type Emprestimo,
  getMeusAlugueis,
  getMinhasAvaliacoes,
  type Livro,
  listarLivros,
} from "@/lib/api";
import {
  gravarFavoritos,
  lerFavoritos,
  usuarioAtualEmail,
} from "@/lib/favorites";
import { cn } from "@/lib/utils";

export default function Pagina() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    string[]
  >([]);
  const [somenteDisponiveis, setSomenteDisponiveis] = useState(false);
  const [notaMinima, setNotaMinima] = useState(0);
  const [ordenacao, setOrdenacao] = useState<OpcaoOrdenacao>("relevancia");
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [mostrarSomenteFavoritos, setMostrarSomenteFavoritos] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState<Livro | null>(null);
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [alugandoId, setAlugandoId] = useState<string | null>(null);
  const [alugueis, setAlugueis] = useState<Emprestimo[]>([]);
  const [carregandoAlugueis, setCarregandoAlugueis] = useState(false);
  const [devolvendoId, setDevolvendoId] = useState<number | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [idsLivrosAvaliaveis, setIdsLivrosAvaliaveis] = useState<number[]>([]);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [aviso, setAviso] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  // Carrega os favoritos do usuario logado ao abrir a pagina.
  useEffect(() => {
    setFavoritos(lerFavoritos(usuarioAtualEmail()));
  }, []);

  // Persiste a cada mudanca, inclusive quando o usuario troca de conta.
  useEffect(() => {
    gravarFavoritos(usuarioAtualEmail(), favoritos);
  }, [favoritos]);

  useEffect(() => {
    listarLivros().then((dados) => {
      setLivros(dados);
      setCarregando(false);
    });
  }, []);

  const categorias = useMemo(() => {
    const unicas = new Set(livros.map((l) => l.categoria));
    return Array.from(unicas).sort();
  }, [livros]);

  const abrirLivro = (livro: Livro) => {
    setLivroSelecionado(livro);
    setDetalheAberto(true);
  };

  // Recarrega a lista para refletir a nova quantidade disponivel.
  const recarregarLivros = useCallback(async () => {
    const dados = await listarLivros();
    setLivros(dados);
  }, []);

  // Só há aluguel para quem está logado. Sem token a API responde 401 e o
  // catch do getMeusAlugueis devolve lista vazia, então não há erro visível.
  const recarregarAlugueis = useCallback(async () => {
    if (!usuarioAtualEmail()) {
      setAlugueis([]);
      return;
    }
    setCarregandoAlugueis(true);
    const dados = await getMeusAlugueis();
    setAlugueis(dados);
    setCarregandoAlugueis(false);
  }, []);

  // Títulos que o usuário já alugou, em qualquer situação. É o que mantém a
  // avaliação disponível mesmo depois de devolver o exemplar.
  const recarregarAvaliacoes = useCallback(async () => {
    if (!usuarioAtualEmail()) {
      setAvaliacoes([]);
      setIdsLivrosAvaliaveis([]);
      return;
    }
    const { idsLivrosAvaliaveis: ids, avaliacoes: notas } =
      await getMinhasAvaliacoes();
    setIdsLivrosAvaliaveis(ids);
    setAvaliacoes(notas);
  }, []);

  useEffect(() => {
    recarregarAlugueis();
    recarregarAvaliacoes();
  }, [recarregarAlugueis, recarregarAvaliacoes]);

  /** Registro do usuário para um livro, se ele já deu nota. */
  const avaliacaoPorLivro = useMemo(() => {
    const mapa = new Map<number, Avaliacao>();
    for (const avaliacao of avaliacoes) {
      mapa.set(avaliacao.livroId, avaliacao);
    }
    return mapa;
  }, [avaliacoes]);

  const avaliar = async (idLivro: number, nota: number, comentario: string) => {
    setEnviandoAvaliacao(true);
    try {
      const resultado = await avaliarLivroNaApi(idLivro, nota, comentario);

      // A nota altera a média do livro, então o card precisa da lista nova.
      await Promise.all([recarregarLivros(), recarregarAvaliacoes()]);

      setAviso({
        tipo: resultado.erro ? "erro" : "sucesso",
        texto: resultado.mensagem,
      });

      if (!resultado.erro) {
        setLivroSelecionado(null);
        setDetalheAberto(false);
      }
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const alugarLivro = async (livro: Livro) => {
    setAlugandoId(livro.id);
    try {
      const resultado = await alugarLivroNaApi(Number(livro.id));

      // precisa recarregar os três lados: o estoque do livro, a lista do topo
      // e a lista de títulos avaliáveis, que acabou de ganhar este livro
      await Promise.all([
        recarregarLivros(),
        recarregarAlugueis(),
        recarregarAvaliacoes(),
      ]);

      if (resultado.erro) {
        setAviso({ tipo: "erro", texto: resultado.mensagem });
        return;
      }

      const prazo = resultado.data?.prazoDevolucao
        ? new Date(resultado.data.prazoDevolucao).toLocaleDateString("pt-BR")
        : null;

      setAviso({
        tipo: "sucesso",
        texto: `"${livro.titulo}" alugado. Restam ${resultado.disponiveis} cópia(s).${
          prazo ? ` Devolva até ${prazo}.` : ""
        }`,
      });

      setLivroSelecionado(null);
      setDetalheAberto(false);
    } finally {
      setAlugandoId(null);
    }
  };

  const devolver = async (idEmprestimo: number) => {
    setDevolvendoId(idEmprestimo);
    try {
      const resultado = await devolverAluguel(idEmprestimo);

      // o estoque volta a crescer, entao os três lados mudam de novo
      await Promise.all([
        recarregarLivros(),
        recarregarAlugueis(),
        recarregarAvaliacoes(),
      ]);

      setAviso({
        tipo: resultado.erro ? "erro" : "sucesso",
        texto: resultado.erro
          ? resultado.mensagem
          : `${resultado.mensagem} Exemplar disponível novamente.`,
      });
    } finally {
      setDevolvendoId(null);
    }
  };

  const alternarCategoria = (categoria: string) =>
    setCategoriasSelecionadas((anterior) =>
      anterior.includes(categoria)
        ? anterior.filter((c) => c !== categoria)
        : [...anterior, categoria],
    );

  const alternarFavorito = (id: string) =>
    setFavoritos((anterior) =>
      anterior.includes(id)
        ? anterior.filter((f) => f !== id)
        : [...anterior, id],
    );

  const limparFiltros = () => {
    setBusca("");
    setCategoriasSelecionadas([]);
    setSomenteDisponiveis(false);
    setNotaMinima(0);
    setOrdenacao("relevancia");
    setMostrarSomenteFavoritos(false);
  };

  const livrosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    let resultado = livros.filter((l) => {
      if (termo && !`${l.titulo} ${l.autor}`.toLowerCase().includes(termo))
        return false;
      if (categoriasSelecionadas.length > 0)
        return categoriasSelecionadas.includes(l.categoria);
      // Guarda contra notaMinima ser undefined: a comparação com undefined
      // daria false e o filtro nunca cortaria nada.
      if (notaMinima > 0 && l.nota < notaMinima) return false;
      return true;
    });

    if (somenteDisponiveis) resultado = resultado.filter((l) => l.disponivel);
    if (mostrarSomenteFavoritos)
      resultado = resultado.filter((l) => favoritos.includes(l.id));

    const ordenados = [...resultado];
    switch (ordenacao) {
      case "avaliacao":
        ordenados.sort((a, b) => b.nota - a.nota);
        break;
      case "titulo":
        ordenados.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
        break;
      case "recentes":
        ordenados.sort((a, b) => b.ano - a.ano);
        break;
      default:
        break;
    }
    return ordenados;
  }, [
    busca,
    categoriasSelecionadas,
    somenteDisponiveis,
    mostrarSomenteFavoritos,
    favoritos,
    notaMinima,
    ordenacao,
    livros,
  ]);

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando acervo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Cabecalho
        busca={busca}
        aoMudarBusca={setBusca}
        quantidadeFavoritos={favoritos.length}
        mostrarSomenteFavoritos={mostrarSomenteFavoritos}
        aoAlternarFavoritos={() => setMostrarSomenteFavoritos((v) => !v)}
        alugueis={alugueis}
        carregandoAlugueis={carregandoAlugueis}
        devolvendoId={devolvendoId}
        aoDevolver={devolver}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {aviso && (
          // <output> ja carrega role="status", e o biome sinaliza o div com
          // role="status" como uso incorreto de papel.
          <output
            className={cn(
              "mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm",
              aviso.tipo === "sucesso"
                ? "border-gold/40 bg-gold/10 text-foreground"
                : "border-destructive/40 bg-destructive/10 text-foreground",
            )}
          >
            <span>{aviso.texto}</span>
            <button
              type="button"
              onClick={() => setAviso(null)}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Fechar
            </button>
          </output>
        )}
        {/* Apresentação */}
        <section className="mb-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-gold" />
            {livros.filter((l) => l.disponivel).length} títulos disponíveis
            agora
          </span>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Descubra seu próximo livro no acervo da equipe
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Explore a coleção interna, refine por editora e disponibilidade, e
            guarde seus favoritos para alugar quando quiser.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <div className="lg:top-24 lg:self-start">
            <PainelFiltros
              categorias={categorias}
              categoriasSelecionadas={categoriasSelecionadas}
              aoAlternarCategoria={alternarCategoria}
              somenteDisponiveis={somenteDisponiveis}
              aoMudarSomenteDisponiveis={setSomenteDisponiveis}
              notaMinima={notaMinima}
              aoMudarNotaMinima={setNotaMinima}
              ordenacao={ordenacao}
              aoMudarOrdenacao={setOrdenacao}
              aoLimpar={limparFiltros}
              quantidadeResultados={livrosFiltrados.length}
            />
          </div>

          <div>
            {livrosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {livrosFiltrados.map((livro, indice) => (
                  <CartaoLivro
                    key={livro.id}
                    livro={livro}
                    indice={indice}
                    favorito={favoritos.includes(livro.id)}
                    aoAlternarFavorito={alternarFavorito}
                    aoAbrir={abrirLivro}
                    aoAlugar={alugarLivro}
                    alugando={alugandoId === livro.id}
                    podeAvaliar={idsLivrosAvaliaveis.includes(Number(livro.id))}
                    jaAvaliou={avaliacaoPorLivro.has(Number(livro.id))}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <BookX className="size-6" />
                </span>
                <p className="mt-4 font-medium">Nenhum livro encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tente ajustar os filtros ou limpar a busca.
                </p>
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <DialogoDetalheLivro
        livro={livroSelecionado}
        aberto={detalheAberto}
        aoMudarAbertura={setDetalheAberto}
        favorito={
          livroSelecionado ? favoritos.includes(livroSelecionado.id) : false
        }
        aoAlternarFavorito={alternarFavorito}
        aoAlugar={alugarLivro}
        alugando={alugandoId === livroSelecionado?.id}
        podeAvaliar={
          livroSelecionado
            ? idsLivrosAvaliaveis.includes(Number(livroSelecionado.id))
            : false
        }
        avaliacaoExistente={
          livroSelecionado
            ? (avaliacaoPorLivro.get(Number(livroSelecionado.id)) ?? null)
            : null
        }
        notaMedia={livroSelecionado?.nota ?? null}
        aoAvaliar={avaliar}
        enviandoAvaliacao={enviandoAvaliacao}
      />
    </div>
  );
}
