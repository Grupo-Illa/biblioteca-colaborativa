"use client";

import { Loader2, MessageSquare, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AvaliacaoEstrelas } from "@/components/library/avaliacao-estrelas";
import { type AvaliacaoPublica, listarAvaliacoesDoLivro } from "@/lib/api";

type PropsListaAvaliacoes = {
  livroId: number;
  notaMedia: number | null;
  quantidadeAvaliacoes: number;
};

function dataCurta(valor: string) {
  return new Date(valor).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Iniciais para o circulo com a letra do autor da avaliacao. */
function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Opinioes da equipe sobre um livro.
 *
 * Busca os dados ao montar, e quem chama passa key={livro.id}, entao trocar de
 * livro refaz a consulta. O resumo com a media fica sempre visivel, mesmo sem
 * nenhuma avaliacao, para o leitor nao achar que a secao quebrou.
 *
 * A lista rola, mas sem mostrar a barra: o no-scrollbar esconde o desenho e o
 * overflow continua valendo. O max-h e o que cria a rolagem, tambem para o
 * dialogo nao crescer alem da tela.
 */
export function ListaAvaliacoes({
  livroId,
  notaMedia,
  quantidadeAvaliacoes,
}: PropsListaAvaliacoes) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoPublica[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);

    listarAvaliacoesDoLivro(livroId).then((dados) => {
      // Fechar o dialogo rapido pode desmontar o componente antes da resposta;
      // sem esta guarda o estado seria setado em componente morto.
      if (cancelado) return;
      setAvaliacoes(dados);
      setCarregando(false);
    });

    return () => {
      cancelado = true;
    };
  }, [livroId]);

  return (
    <section className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="size-4 text-muted-foreground" />
          Avaliações da equipe
        </p>
        {quantidadeAvaliacoes > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AvaliacaoEstrelas nota={Math.round(notaMedia ?? 0)} />
            <span className="font-mono font-semibold text-foreground">
              {(notaMedia ?? 0).toFixed(1)}
            </span>
            <span>
              ({quantidadeAvaliacoes}{" "}
              {quantidadeAvaliacoes === 1 ? "avaliação" : "avaliações"})
            </span>
          </p>
        )}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Carregando avaliações...
        </div>
      ) : avaliacoes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ninguém avaliou este título ainda.
          {quantidadeAvaliacoes === 0 && " Seja o primeiro depois de alugar."}
        </p>
      ) : (
        <ul className="no-scrollbar mt-3 max-h-64 space-y-3 overflow-y-auto">
          {avaliacoes.map((avaliacao) => {
            return (
              <li
                key={avaliacao.id}
                className="rounded-lg border border-border bg-background/50 p-3"
              >
                <div className="flex gap-3">
                  {/* mt-0.5 alinha o circulo com a primeira linha do nome, e
                      nao com o topo da caixa. */}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold leading-none text-primary-foreground"
                  >
                    {iniciais(avaliacao.usuario.nomeUsuario)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium leading-snug">
                          {avaliacao.usuario.nomeUsuario}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                          {dataCurta(avaliacao.criadoEm)}
                        </p>
                      </div>
                      <AvaliacaoEstrelas
                        nota={avaliacao.nota}
                        className="mt-0.5 shrink-0"
                      />
                    </div>

                    {avaliacao.comentario && (
                      /* Icone em position absolute e recuo fixo no texto: com o
                         icone no fluxo, a segunda linha do comentario voltava
                         para a margem esquerda, fora do alinhamento.

                         break-words e o overflow-wrap: break-word. Sem ele, um
                         comentario sem nenhum espaco -- um link, um caminho de
                         arquivo, um codigo -- nao tinha ponto de quebra e a
                         linha vazava para fora do quadrado. */
                      <p className="relative mt-2 break-words pl-5 text-sm leading-relaxed text-foreground/80">
                        <MessageSquare className="absolute left-0 top-1 size-3.5 text-muted-foreground" />
                        <span className="text-pretty">
                          {avaliacao.comentario}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
