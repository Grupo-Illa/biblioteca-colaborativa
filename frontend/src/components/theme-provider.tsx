"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Tema = "light" | "dark";

type ValorContextoTema = {
  tema: Tema;
  alternarTema: () => void;
};

const ContextoTema = createContext<ValorContextoTema | undefined>(undefined);

export function ProvedorTema({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("dark");

  useEffect(() => {
    const guardado = (typeof window !== "undefined" &&
      window.localStorage.getItem("acervo-tema")) as Tema | null;
    const inicial: Tema =
      guardado ??
      (window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark");
    setTema(inicial);
  }, []);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.add("theme-transition");
    raiz.classList.toggle("dark", tema === "dark");
    raiz.classList.toggle("light", tema === "light");
    window.localStorage.setItem("acervo-tema", tema);
    const temporizador = window.setTimeout(
      () => raiz.classList.remove("theme-transition"),
      450,
    );
    return () => window.clearTimeout(temporizador);
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((anterior) => (anterior === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ContextoTema.Provider value={{ tema, alternarTema }}>
      {children}
    </ContextoTema.Provider>
  );
}

export function useTema() {
  const contexto = useContext(ContextoTema);
  if (!contexto)
    throw new Error("useTema precisa ser usado dentro de ProvedorTema");
  return contexto;
}
