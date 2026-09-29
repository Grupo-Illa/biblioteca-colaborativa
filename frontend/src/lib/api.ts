export type Livro = {
  id: number;
  titulo: string;
  autor: string;
  dataLancamento: string;
  editora: string;
  /** Faceta usada nos filtros da home. */
  categoria: string;
  /** URL da capa; null usa a imagem padrão. */
  capa: string | null;
  statusAluguel: "DISPONIVEL" | "ALUGADO";
  /** Email de quem está com o livro; null quando disponível. */
  alugadoPor: string | null;
  /** ISO string de quando aluguel; null quando disponível. */
  alugadoEm: string | null;
  /** Média das notas (0 quando ninguém avaliou). */
  mediaNotas: number;
  totalAvaliacoes: number;
  quantidadeAlugada: number;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  cover: string;
  year: number;
  available: boolean;
  copies: number;
  pages: number;
  description: string;
  /** Email de quem alugou; null quando disponível. */
  rentedBy: string | null;
  /** ISO string do aluguel; null quando disponível. */
  rentedAt: string | null;
  /** Nota média vinda do banco, não mais um 0 fixo. */
  rating: number;
  totalRatings: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Capa padrão quando o livro não tem URL cadastrada. */
const CAPA_PADRAO = "/placeholder.svg";

function mapLivroToBook(livro: Livro): Book {
  return {
    id: String(livro.id),
    title: livro.titulo,
    author: livro.autor,
    category: livro.categoria,
    cover: livro.capa?.trim() || CAPA_PADRAO,
    year: new Date(livro.dataLancamento).getFullYear(),
    rating: livro.mediaNotas ?? 0,
    totalRatings: livro.totalAvaliacoes ?? 0,
    available: livro.statusAluguel === "DISPONIVEL",
    copies: livro.quantidadeAlugada,
    pages: 0,
    description: "",
    rentedBy: livro.alugadoPor ?? null,
    rentedAt: livro.alugadoEm ?? null,
  };
}

export async function getBooks(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_BASE}/livros/buscarTodos`, {
      next: { revalidate: 30 },
      credentials: "include",
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
  categoria?: string;
  /** URL http(s) da capa. Vazio = usar a imagem padrão. */
  capa?: string;
  statusAluguel?: "DISPONIVEL" | "ALUGADO";
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
      credentials: "include",
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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

/**
 * Quem sou eu agora? A resposta vem do servidor, que lê o cookie httpOnly e
 * consulta o banco. Antes o `role` era lido do localStorage, que qualquer
 * pessoa podia editar para se declarar ADMIN.
 */
export async function getMe(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/usuarios/me`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data: { user: User } = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE}/usuarios/logout`, { method: "POST", credentials: "include" });
  } catch {
    // O logout local acontece de todo jeito; cookie órfão expira sozinho.
  }
}

export async function getLivros(): Promise<Livro[]> {
  const res = await fetch(`${API_BASE}/livros/buscarTodos`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

export async function createBook(data: LivroPayload): Promise<{ message: string; data?: Livro; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/livros/cadastrar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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
      credentials: "include",
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

// ---------- Empréstimos ----------

/** Resposta de uma ação de empréstimo. `data` traz o livro já atualizado. */
export type AcaoLivro = { message: string; data?: Livro; error?: string };

/**
 * Aluga o livro para o usuário do cookie. O backend decide o dono a partir da
 * sessão, então não enviamos email nenhum no body.
 */
export async function rentBook(id: number): Promise<AcaoLivro> {
  try {
    const res = await fetch(`${API_BASE}/livros/alugar/${id}`, {
      method: "POST",
      credentials: "include",
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

/**
 * Devolve o livro. Aceito pelo dono do empréstimo ou por um ADMIN.
 * A avaliação é opcional e vai no mesmo corpo — o backend grava junto,
 * porque a devolução é o que prova que a pessoa leu o livro.
 */
export async function returnBook(
  id: number,
  avaliacao?: { nota: number; comentario?: string },
): Promise<AcaoLivro & { fila?: { total: number; proximo: string | null } }> {
  try {
    const res = await fetch(`${API_BASE}/livros/devolver/${id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(avaliacao ?? {}),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

/** Livros que o usuário logado tem alugados no momento. */
export async function getMyRentals(): Promise<Livro[]> {
  try {
    const res = await fetch(`${API_BASE}/livros/meusEmprestimos`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** ADMIN: força a devolução de um livro, mesmo que seja de outra pessoa. */
export async function forceReturnBook(id: number): Promise<AcaoLivro> {
  try {
    const res = await fetch(`${API_BASE}/livros/forcar-devolucao/${id}`, {
      method: "POST",
      credentials: "include",
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

// ---------- Avaliações ----------

export type Avaliacao = {
  id: number;
  livroId: number;
  userEmail: string;
  nota: number;
  comentario: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getReviews(id: number): Promise<Avaliacao[]> {
  try {
    const res = await fetch(`${API_BASE}/livros/avaliacoes/${id}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Cria ou atualiza a nota do usuário logado sobre o livro. */
export async function reviewBook(
  id: number,
  nota: number,
  comentario?: string,
): Promise<{ message: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/livros/avaliacao/${id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota, comentario: comentario?.trim() || undefined }),
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

// ---------- Reservas (fila) ----------

export type MinhaReserva = {
  id: number;
  createdAt: string;
  livro: {
    id: number;
    titulo: string;
    autor: string;
    capa: string | null;
    categoria: string;
    statusAluguel: "DISPONIVEL" | "ALUGADO";
    /** true = chegou a vez; o card deve oferecer "Alugar". */
    disponivelAgora: boolean;
    /** Quem está com ele agora, para explicar o aguardo. */
    alugadoPor: string | null;
  };
};

export async function getMyReservations(): Promise<MinhaReserva[]> {
  try {
    const res = await fetch(`${API_BASE}/livros/minhasReservas`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function reserveBook(
  id: number,
): Promise<{ message: string; posicao?: number | null; naFila?: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/livros/reservar/${id}`, {
      method: "POST",
      credentials: "include",
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

export async function cancelReservation(
  id: number,
): Promise<{ message: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/livros/reservar/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return await res.json();
  } catch {
    return { message: "Erro de conexão com o servidor", error: "network" };
  }
}

/** Posição do usuário logado na fila de um livro, e o total de gente. */
export async function getQueue(
  id: number,
): Promise<{ posicao: number | null; naFila: boolean; total: number }> {
  try {
    const res = await fetch(`${API_BASE}/livros/fila/${id}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { posicao: null, naFila: false, total: 0 };
    return await res.json();
  } catch {
    return { posicao: null, naFila: false, total: 0 };
  }
}
