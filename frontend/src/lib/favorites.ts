/**
 * Persistencia de favoritos no localStorage, atrelada ao usuario logado.
 *
 * O chave inclui o email para que dois usuarios no mesmo navegador nao
 * compartilhem a mesma lista. Sem usuario logado usa "anon".
 */

const PREFIXO = "acervo-favoritos";

function chave(email?: string) {
  return `${PREFIXO}:${email || "anon"}`;
}

export function lerFavoritos(email?: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const bruto = window.localStorage.getItem(chave(email));
    if (!bruto) return [];

    const parsed: unknown = JSON.parse(bruto);
    if (!Array.isArray(parsed)) return [];

    // Garante que so strings sobrevivam, evitando dado corrompido.
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function gravarFavoritos(email: string | undefined, ids: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(chave(email), JSON.stringify(ids));
  } catch {
    // Cota estourada ou modo privado: favoritar continua funcionando em memoria.
  }
}

export function usuarioAtualEmail(): string | undefined {
  if (typeof window === "undefined") return undefined;

  const stored = window.localStorage.getItem("acervo-user");
  if (!stored) return undefined;

  try {
    const user = JSON.parse(stored) as { email?: string };
    return user.email ?? undefined;
  } catch {
    return undefined;
  }
}
