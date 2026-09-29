/**
 * Formato que o backend devolve em /livros. Ainda espelha o schema do Prisma,
 * por isso os nomes seguem o mesmo padrao de caixa alta.
 */
export type LivroApi = {
  id: number;
  titulo: string;
  autor: string;
  dataLancamento: string;
  editora: string;
  statusAluguel: "DISPONIVEL" | "ALUGADO";
  quantidadeTotal: number;
  quantidadeAlugada: number;
  /** Media das avaliacoes. null quando ninguem avaliou o titulo ainda. */
  notaMedia: number | null;
  quantidadeAvaliacoes: number;
};

/** Formato usado pelos componentes de tela. */
export type Livro = {
  id: string;
  titulo: string;
  autor: string;
  categoria: string;
  capa: string;
  ano: number;
  nota: number;
  quantidadeAvaliacoes: number;
  disponivel: boolean;
  copias: number;
  paginas: number;
  descricao: string;
};

const BASE_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function mapearParaLivro(livro: LivroApi): Livro {
  // Disponiveis e o total menos o que ja foi alugado. Antes o campo "copias"
  // recebia quantidadeAlugada, o que exibia o alugado como se fosse disponivel.
  const disponiveis = Math.max(
    0,
    (livro.quantidadeTotal ?? 1) - (livro.quantidadeAlugada ?? 0),
  );

  return {
    id: String(livro.id),
    titulo: livro.titulo,
    autor: livro.autor,
    categoria: livro.editora,
    capa: "/placeholder.svg",
    ano: new Date(livro.dataLancamento).getFullYear(),
    // Titulo sem avaliacao alguma precisa virar 0, e nao null, porque o card
    // e o filtro de nota minima fazem conta aritmetica com este campo.
    nota: livro.notaMedia ?? 0,
    quantidadeAvaliacoes: livro.quantidadeAvaliacoes ?? 0,
    disponivel: disponiveis > 0,
    copias: disponiveis,
    paginas: 0,
    descricao: "",
  };
}

export async function listarLivros(): Promise<Livro[]> {
  try {
    const resposta = await fetch(`${BASE_API}/livros/buscarTodos`, {
      next: { revalidate: 30 },
    });
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    const livros: LivroApi[] = await resposta.json();
    return livros.map(mapearParaLivro);
  } catch {
    return [];
  }
}

export type Usuario = {
  id: number;
  nomeUsuario: string;
  email: string;
  perfil: "USUARIO" | "ADMIN";
  dataNascimento: string;
  telefone?: string;
};

export type DadosLivro = {
  titulo: string;
  autor: string;
  dataLancamento: string;
  editora: string;
  statusAluguel?: "DISPONIVEL" | "ALUGADO";
  /** Quantos exemplares a biblioteca possui. Definido pelo admin no cadastro. */
  quantidadeTotal?: number;
};

export type StatusEmprestimo = "ATIVO" | "DEVOLVIDO" | "VENCIDO";

export type Emprestimo = {
  id: number;
  usuarioId: number;
  livroId: number;
  dataAluguel: string;
  prazoDevolucao: string;
  dataDevolucao: string | null;
  status: StatusEmprestimo;
  livro: {
    id: number;
    titulo: string;
    autor: string;
    editora: string;
    quantidadeTotal: number;
    quantidadeAlugada: number;
  };
};

type RespostaAutenticacao = {
  mensagem: string;
  usuario?: Usuario;
  erro?: string;
};

export async function cadastrarUsuario(dados: {
  nomeUsuario: string;
  email: string;
  senha: string;
  dataNascimento: string;
  telefone?: string;
}): Promise<RespostaAutenticacao> {
  try {
    const resposta = await fetch(`${BASE_API}/usuarios/cadastrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    return await resposta.json();
  } catch {
    return { mensagem: "Erro de conexão com o servidor", erro: "rede" };
  }
}

export async function entrar(
  email: string,
  senha: string,
): Promise<RespostaAutenticacao> {
  try {
    const resposta = await fetch(`${BASE_API}/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    return await resposta.json();
  } catch {
    return { mensagem: "Erro de conexão com o servidor", erro: "rede" };
  }
}

/**
 * O backend identifica o usuario pelo header, nao por token. As duas funcoes
 * abaixo sao iguais hoje; a separacao existe para o dia em que uma delas
 * passar a exigir perfil ADMIN.
 */
function cabecalhosDeAutenticacao(): Record<string, string> {
  if (typeof window === "undefined")
    return { "Content-Type": "application/json" };
  const guardado = localStorage.getItem("acervo-usuario");
  const usuario: Usuario | null = guardado ? JSON.parse(guardado) : null;
  return {
    "Content-Type": "application/json",
    "x-usuario-email": usuario?.email ?? "",
  };
}

function cabecalhosDeAdministrador(): Record<string, string> {
  return cabecalhosDeAutenticacao();
}

export async function buscarLivros(): Promise<LivroApi[]> {
  const resposta = await fetch(`${BASE_API}/livros/buscarTodos`, {
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
  return resposta.json();
}

export async function criarLivro(
  dados: DadosLivro,
): Promise<{ mensagem: string; data?: LivroApi; erro?: string }> {
  try {
    const resposta = await fetch(`${BASE_API}/livros/cadastrar`, {
      method: "POST",
      headers: cabecalhosDeAdministrador(),
      body: JSON.stringify(dados),
    });
    return await resposta.json();
  } catch {
    return { mensagem: "Erro de conexão com o servidor", erro: "rede" };
  }
}

export async function atualizarLivro(
  id: number,
  dados: Partial<DadosLivro>,
): Promise<{ mensagem: string; data?: LivroApi; erro?: string }> {
  try {
    const resposta = await fetch(`${BASE_API}/livros/atualizar/${id}`, {
      method: "PATCH",
      headers: cabecalhosDeAdministrador(),
      body: JSON.stringify(dados),
    });
    return await resposta.json();
  } catch {
    return { mensagem: "Erro de conexão com o servidor", erro: "rede" };
  }
}

export async function deletarLivro(
  id: number,
): Promise<{ mensagem: string; erro?: string }> {
  try {
    const resposta = await fetch(`${BASE_API}/livros/deletar/${id}`, {
      method: "DELETE",
      headers: cabecalhosDeAdministrador(),
    });
    return await resposta.json();
  } catch {
    return { mensagem: "Erro de conexão com o servidor", erro: "rede" };
  }
}

export type RespostaAluguel = {
  mensagem: string;
  data?: Emprestimo;
  disponiveis?: number;
  erro?: string;
};

export async function alugarLivro(id: number): Promise<RespostaAluguel> {
  try {
    const resposta = await fetch(`${BASE_API}/alugueis/alugar/${id}`, {
      method: "POST",
      headers: cabecalhosDeAutenticacao(),
    });
    return await resposta.json();
  } catch {
    return { mensagem: "Erro de conexão com o servidor", erro: "rede" };
  }
}

/** Alugueis do usuario logado, incluindo os ja devolvidos ou vencidos. */
export async function getMeusAlugueis(): Promise<Emprestimo[]> {
  try {
    const resposta = await fetch(`${BASE_API}/alugueis/meus`, {
      headers: cabecalhosDeAutenticacao(),
      cache: "no-store",
    });
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    return await resposta.json();
  } catch {
    return [];
  }
}

export async function devolverAluguel(id: number): Promise<RespostaAluguel> {
  try {
    const resposta = await fetch(`${BASE_API}/alugueis/${id}/devolver`, {
      method: "POST",
      headers: cabecalhosDeAutenticacao(),
    });
    return await resposta.json();
  } catch {
    return { mensagem: "Erro de conexão com o servidor", erro: "rede" };
  }
}

export type Avaliacao = {
  id: number;
  usuarioId: number;
  livroId: number;
  nota: number;
  comentario: string | null;
  criadoEm: string;
  atualizadoEm: string;
  livro: {
    id: number;
    titulo: string;
    autor: string;
    editora: string;
  };
};

export type RespostaAvaliacao = {
  mensagem: string;
  data?: Avaliacao;
  erro?: string;
};

/** Registra a nota. Chamar de novo substitui a nota anterior do mesmo titulo. */
export async function avaliarLivro(
  livroId: number,
  nota: number,
  comentario?: string,
): Promise<RespostaAvaliacao> {
  try {
    const resposta = await fetch(`${BASE_API}/avaliacoes`, {
      method: "POST",
      headers: cabecalhosDeAutenticacao(),
      body: JSON.stringify({ livroId, nota, comentario }),
    });
    return await resposta.json();
  } catch {
    return { mensagem: "Erro de conexão com o servidor", erro: "rede" };
  }
}

/**
 * Avaliacoes do usuario e a lista de titulos que ele pode avaliar.
 *
 * Vem num endpoint so porque a tela precisa dos dois: os ids dizem onde o
 * formulario de nota aparece e as avaliacoes preenchem as estrelas ja dadas.
 */
export async function getMinhasAvaliacoes(): Promise<{
  idsLivrosAvaliaveis: number[];
  avaliacoes: Avaliacao[];
}> {
  const vazio = { idsLivrosAvaliaveis: [], avaliacoes: [] };
  try {
    const resposta = await fetch(`${BASE_API}/avaliacoes/livros-avaliaveis`, {
      headers: cabecalhosDeAutenticacao(),
      cache: "no-store",
    });
    if (!resposta.ok) return vazio;
    return await resposta.json();
  } catch {
    return vazio;
  }
}

/** Avaliacao publica de um livro, com o nome de quem deixou a nota. */
export type AvaliacaoPublica = {
  id: number;
  nota: number;
  comentario: string | null;
  criadoEm: string;
  atualizadoEm: string;
  usuario: { nomeUsuario: string };
};

/**
 * Opnioes da equipe sobre um livro. Nao exige login, por isso usa BASE_API
 * direto e sem o header de autenticacao.
 */
export async function listarAvaliacoesDoLivro(
  livroId: number,
): Promise<AvaliacaoPublica[]> {
  try {
    const resposta = await fetch(`${BASE_API}/avaliacoes/livro/${livroId}`, {
      cache: "no-store",
    });
    if (!resposta.ok) return [];
    return await resposta.json();
  } catch {
    return [];
  }
}
