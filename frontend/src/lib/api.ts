export type Livro = {
  id: number;
  titulo: string;
  autor: string;
  dataLancamento: string;
  editora: string;
  statusAluguel: "DISPONIVEL" | "ALUGADO";
  quantidadeTotal: number;
  quantidadeAlugada: number;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  year: number;
  rating: number;
  available: boolean;
  copies: number;
  pages: number;
  description: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function mapLivroToBook(livro: Livro): Book {
  // Disponiveis e o total menos o que ja foi alugado. Antes o campo "copies"
  // recebia quantidadeAlugada, o que exibia o alugado como se fosse disponivel.
  const disponiveis = Math.max(
    0,
    (livro.quantidadeTotal ?? 1) - (livro.quantidadeAlugada ?? 0),
  );

  return {
    id: String(livro.id),
    title: livro.titulo,
    author: livro.autor,
    category: livro.editora,
    cover: "/placeholder.svg",
    year: new Date(livro.dataLancamento).getFullYear(),
    rating: 0,
    available: disponiveis > 0,
    copies: disponiveis,
    pages: 0,
    description: "",
  };
}

export async function getBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_BASE}/livros/buscarTodos`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const livros: Livro[] = await res.json();
    return livros.map(mapLivroToBook);
  } catch {
    return [];
  }
}

export type User = {
  id: number;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  birthday: string;
  phone?: string;
};

export type LivroPayload = {
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
  userId: number;
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

type AuthResponse = {
  message: string;
  user?: User;
  error?: string;
};

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  birthday: string;
  phone?: string;
}): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/usuarios/cadastrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

function getAdminHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const stored = localStorage.getItem("acervo-user");
  const user: User | null = stored ? JSON.parse(stored) : null;
  return {
    "Content-Type": "application/json",
    "x-user-email": user?.email ?? "",
  };
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const stored = localStorage.getItem("acervo-user");
  const user: User | null = stored ? JSON.parse(stored) : null;
  return {
    "Content-Type": "application/json",
    "x-user-email": user?.email ?? "",
  };
}

export async function getLivros(): Promise<Livro[]> {
  const res = await fetch(`${API_BASE}/livros/buscarTodos`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

export async function createBook(data: LivroPayload): Promise<{ message: string; data?: Livro; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/livros/cadastrar`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

export async function updateBook(id: number, data: Partial<LivroPayload>): Promise<{ message: string; data?: Livro; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/livros/atualizar/${id}`, {
      method: "PATCH",
      headers: getAdminHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

export async function deleteBook(id: number): Promise<{ message: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/livros/deletar/${id}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

export type AluguelResponse = {
  message: string;
  data?: Emprestimo;
  disponiveis?: number;
  error?: string;
};

export async function rentBook(id: number): Promise<AluguelResponse> {
  try {
    const res = await fetch(`${API_BASE}/alugueis/alugar/${id}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

/** Alugueis do usuario logado, incluindo os ja devolvidos ou vencidos. */
export async function getMeusAlugueis(): Promise<Emprestimo[]> {
  try {
    const res = await fetch(`${API_BASE}/alugueis/meus`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

export async function devolverAluguel(id: number): Promise<AluguelResponse> {
  try {
    const res = await fetch(`${API_BASE}/alugueis/${id}/devolver`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}
