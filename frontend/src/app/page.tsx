"use client";

import { BookOpen, BookX, LogOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import { BookCard } from "@/components/library/book-card";
import { BookDetailDialog } from "@/components/library/book-detail-dialog";
import {
  FilterPanel,
  type SortOption,
} from "@/components/library/filter-panel";
import { Header } from "@/components/library/header";
import {
  type Book,
  getBooks,
  getMe,
  logoutUser,
  rentBook,
  returnBook,
  type User,
} from "@/lib/api";
import type { AvailabilityFilter } from "@/components/library/filter-panel";
import { useToast } from "@/components/ui/toast";

/** Chave dos favoritos no navegador. O `acervo-user` NÃO é usado: o `role`
 *  guardado no localStorage era exatamente o que permitia forjar admin. */
const FAVORITOS_KEY = "acervo-favoritos";

/** Lê os favoritos do localStorage. IDs são guardados como texto. */
function lerFavoritos(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(FAVORITOS_KEY);
    if (!bruto) return [];
    const parsed: unknown = JSON.parse(bruto);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function gravarFavoritos(ids: string[]) {
  try {
    window.localStorage.setItem(FAVORITOS_KEY, JSON.stringify(ids));
  } catch {
    // Modo privado / quota cheia: a lista segue funcionando na sessão.
  }
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  // null = ainda estamos perguntando ao servidor se há sessão. Sem isso a
  // tela piscaria o formulário de login para quem já está autenticado.
  const [checkingSession, setCheckingSession] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availability, setAvailability] = useState<AvailabilityFilter>("todos");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortOption>("relevancia");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // Livro em voo: enquanto a request não volta, o botão fica desabilitado
  // para o usuário não disparar dois aluguéis do mesmo título.
  const [pendingBookId, setPendingBookId] = useState<string | null>(null);
  // Incrementado a cada recarga do acervo; o header usa para atualizar
  // os contadores de "meus livros" e "reservas".
  const [acervoRev, setAcervoRev] = useState(0);
  const { toast } = useToast();

  /** Recarrega o acervo. Chamado após alugar, devolver, reservar ou editar. */
  const recarregarAcervo = useCallback(async () => {
    const data = await getBooks();
    setBooks(data);
    // Sinaliza ao header que o acervo mudou, para os contadores de
    // "meus livros" e "reservas" não ficarem velhos.
    setAcervoRev((n) => n + 1);
  }, []);

  // ---------- Empréstimos ----------

  const handleRent = async (id: string) => {
    const livro = books.find((b) => b.id === id);
    if (!livro) return;

    setPendingBookId(id);
    const result = await rentBook(Number(id));
    setPendingBookId(null);

    if (result.error) {
      toast(result.message, "erro");
      return;
    }

    toast(`"${livro.title}" alugado. Boa leitura!`, "sucesso");
    await recarregarAcervo();
  };

  const handleReturn = async (id: string) => {
    const livro = books.find((b) => b.id === id);
    if (!livro) return;

    setPendingBookId(id);
    const result = await returnBook(Number(id));
    setPendingBookId(null);

    if (result.error) {
      toast(result.message, "erro");
      return;
    }

    toast(`"${livro.title}" devolvido.`, "sucesso");
    await recarregarAcervo();
  };

  // Os favoritos sobrevivem ao reload. Carregamos uma vez, depois de a sessão
  // estar resolvida, para não piscar a lista vazia no primeiro render.
  useEffect(() => {
    if (checkingSession) return;
    setFavorites(lerFavoritos());
    setFavoritesLoaded(true);
  }, [checkingSession]);

  // Cada mudança de favorito vai para o localStorage.
  useEffect(() => {
    if (!favoritesLoaded) return;
    gravarFavoritos(favorites);
  }, [favorites, favoritesLoaded]);

  // O `role` vem do servidor, que lê o cookie httpOnly. O botão de admin no
  // header é só conveniência de UI — quem barra de verdade é o requireAdmin
  // no backend.
  const loadSession = useCallback(async () => {
    setCheckingSession(true);
    const me = await getMe();
    setUser(me);
    setCheckingSession(false);
    return me;
  }, []);

  useEffect(() => {
    (async () => {
      const me = await loadSession();
      // O acervo só é buscado depois de saber que há sessão: sem login a
      // tela mostra o painel de acesso, não a lista de livros.
      if (me) {
        const data = await getBooks();
        setBooks(data);
        setLoading(false);
      }
    })();
  }, [loadSession]);

  const handleAuthenticated = async () => {
    await loadSession();
    const data = await getBooks();
    setBooks(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setBooks([]);
    // Os favoritos são locais por definição: continuam aqui para o próximo login.
    setFavorites([]);
    setShowFavoritesOnly(false);
    setQuery("");
    setSelectedCategories([]);
    setAvailability("todos");
    setMinRating(0);
    setSort("relevancia");
  };

  const categories = useMemo(() => {
    const unique = new Set(books.map((b) => b.category));
    return Array.from(unique).sort();
  }, [books]);

  const openBook = (book: Book) => {
    setSelectedBook(book);
    setDetailOpen(true);
  };

  const toggleCategory = (category: string) =>
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );

  const toggleFavorite = (id: string) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );

  const resetFilters = () => {
    setSelectedCategories([]);
    setAvailability("todos");
    setMinRating(0);
    setSort("relevancia");
    setQuery("");
    setShowFavoritesOnly(false);
  };

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = books.filter((book) => {
      if (showFavoritesOnly && !favorites.includes(book.id)) return false;
      if (q && !`${book.title} ${book.author}`.toLowerCase().includes(q))
        return false;
      if (
        selectedCategories.length &&
        !selectedCategories.includes(book.category)
      )
        return false;
      if (availability === "disponiveis" && !book.available) return false;
      if (availability === "indisponiveis" && book.available) return false;
      if (book.rating < minRating) return false;
      return true;
    });

    const sorted = [...result];
    switch (sort) {
      case "avaliacao":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "recentes":
        sorted.sort((a, b) => b.year - a.year);
        break;
      case "titulo":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
        break;
    }
    return sorted;
  }, [
    query,
    selectedCategories,
    availability,
    minRating,
    sort,
    showFavoritesOnly,
    favorites,
    books,
  ]);

  // ---------- Portão: sem sessão, a tela inicial é o acesso ----------
  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Verificando sessão...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
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
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <AuthPanel onAuthenticated={handleAuthenticated} />
            <p className="mt-8 text-center text-xs text-muted-foreground">
              O acervo é restrito à equipe. Entre com seu email institucional
              para ver os títulos disponíveis.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ---------- Acervo ----------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando acervo...</p>
      </div>
    );
  }

  const semLivros = books.length === 0;

  return (
    <div className="min-h-screen">
      <Header
        query={query}
        onQueryChange={setQuery}
        favoritesCount={favorites.length}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly((v) => !v)}
        onLogout={handleLogout}
        onRentalChanged={recarregarAcervo}
        acervoRev={acervoRev}
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-gold" />
            {books.filter((b) => b.available).length} títulos disponíveis agora
          </span>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Descubra seu próximo livro no acervo da equipe
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Explore a coleção interna, refine por editora e disponibilidade, e
            guarde seus favoritos para alugar quando quiser.
          </p>
        </section>

        {semLivros ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <BookOpen className="size-6" />
            </span>
            <p className="mt-4 font-medium">O acervo ainda está vazio</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Nenhum livro cadastrado até o momento.
              {user.role === "ADMIN"
                ? " Use “Gerenciar acervo” no menu do seu usuário para cadastrar o primeiro."
                : " Assim que a biblioteca cadastrar os títulos, eles aparecem aqui."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
            <div className="lg:top-24 lg:self-start">
              <FilterPanel
                categories={categories}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                availability={availability}
                onAvailabilityChange={setAvailability}
                minRating={minRating}
                onMinRatingChange={setMinRating}
                sort={sort}
                onSortChange={setSort}
                onReset={resetFilters}
                resultCount={filteredBooks.length}
              />
            </div>

            <div>
              {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                  {filteredBooks.map((book, index) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      index={index}
                      isFavorite={favorites.includes(book.id)}
                      onToggleFavorite={toggleFavorite}
                      onOpen={openBook}
                      onRent={handleRent}
                      onReturn={handleReturn}
                      currentUserEmail={user.email}
                      isAdmin={user.role === "ADMIN"}
                      pending={pendingBookId === book.id}
                      onQueueChanged={recarregarAcervo}
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
                    onClick={resetFilters}
                    className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BookDetailDialog
        book={selectedBook}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isFavorite={selectedBook ? favorites.includes(selectedBook.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}

