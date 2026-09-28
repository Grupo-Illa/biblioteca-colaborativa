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

    const analisado: unknown = JSON.parse(bruto);
    if (!Array.isArray(analisado)) return [];

    // Garante que so strings sobrevivam, evitando dado corrompido.
    return analisado.filter((id): id is string => typeof id === "string");
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
  const guardado = localStorage.getItem("acervo-usuario");
  if (!guardado) return undefined;

  try {
    const usuario = JSON.parse(guardado) as { email?: string };
    return usuario.email ?? undefined;
  } catch {
    return undefined;
  }
}
