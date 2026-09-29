"use client";

import {
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cadastrarUsuario, entrar } from "@/lib/api";
import { cn } from "@/lib/utils";

type Aba = "login" | "cadastro";

export default function PaginaAutenticacao() {
  const roteador = useRouter();
  const [aba, setAba] = useState<Aba>("login");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [formularioLogin, setFormularioLogin] = useState({
    email: "",
    senha: "",
  });
  const [formularioCadastro, setFormularioCadastro] = useState({
    nomeUsuario: "",
    email: "",
    senha: "",
    dataNascimento: "",
    telefone: "",
  });

  const aoEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const resultado = await entrar(
      formularioLogin.email,
      formularioLogin.senha,
    );
    setCarregando(false);
    if (resultado.usuario) {
      localStorage.setItem("acervo-usuario", JSON.stringify(resultado.usuario));
      roteador.push("/");
    } else {
      setErro(resultado.erro || resultado.mensagem || "Erro ao fazer login");
    }
  };

  const aoCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const emailInstitucional = /^[^\s@]+@grupoilla\.com\.br$/;
    if (!emailInstitucional.test(formularioCadastro.email)) {
      setErro("Apenas emails institucionais @grupoilla.com.br são permitidos!");
      return;
    }

    setCarregando(true);
    const resultado = await cadastrarUsuario(formularioCadastro);
    setCarregando(false);
    if (resultado.usuario) {
      setSucesso("Conta criada com sucesso! Faça login.");
      setAba("login");
      setFormularioLogin({ email: formularioCadastro.email, senha: "" });
      setFormularioCadastro({
        nomeUsuario: "",
        email: "",
        senha: "",
        dataNascimento: "",
        telefone: "",
      });
    } else {
      setErro(resultado.erro || resultado.mensagem || "Erro ao criar conta");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2.5">
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
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Abas */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {aba === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {aba === "login"
                ? "Entre com seu email e senha para acessar o acervo"
                : "Preencha os dados para se cadastrar na biblioteca"}
            </p>
          </div>

          <div className="mb-6 flex rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => {
                setAba("login");
                setErro("");
                setSucesso("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                aba === "login"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LogIn className="size-4" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setAba("cadastro");
                setErro("");
                setSucesso("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                aba === "cadastro"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <UserPlus className="size-4" />
              Cadastrar
            </button>
          </div>

          {/* Erro / Sucesso */}
          {erro && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
              {sucesso}
            </div>
          )}

          {/* Formulário de login */}
          {aba === "login" && (
            <form onSubmit={aoEntrar} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="campoEmailLogin"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="campoEmailLogin"
                    type="email"
                    required
                    value={formularioLogin.email}
                    onChange={(e) =>
                      setFormularioLogin((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    placeholder="seu@grupoilla.com.br"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="campoSenhaLogin"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="campoSenhaLogin"
                    type={mostrarSenha ? "text" : "password"}
                    required
                    value={formularioLogin.senha}
                    onChange={(e) =>
                      setFormularioLogin((p) => ({
                        ...p,
                        senha: e.target.value,
                      }))
                    }
                    placeholder="Sua senha"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              >
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}

          {/* Formulário de cadastro */}
          {aba === "cadastro" && (
            <form onSubmit={aoCadastrar} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="campoNomeUsuario"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Nome de usuário
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="campoNomeUsuario"
                    type="text"
                    required
                    value={formularioCadastro.nomeUsuario}
                    onChange={(e) =>
                      setFormularioCadastro((p) => ({
                        ...p,
                        nomeUsuario: e.target.value,
                      }))
                    }
                    placeholder="Seu nome"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="campoEmailCadastro"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="campoEmailCadastro"
                    type="email"
                    required
                    value={formularioCadastro.email}
                    onChange={(e) =>
                      setFormularioCadastro((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    placeholder="seu@grupoilla.com.br"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    htmlFor="campoSenhaCadastro"
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="campoSenhaCadastro"
                      type={mostrarSenha ? "text" : "password"}
                      required
                      value={formularioCadastro.senha}
                      onChange={(e) =>
                        setFormularioCadastro((p) => ({
                          ...p,
                          senha: e.target.value,
                        }))
                      }
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="campoDataNascimento"
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Data de nasc.
                  </label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="campoDataNascimento"
                      type="date"
                      required
                      value={formularioCadastro.dataNascimento}
                      onChange={(e) =>
                        setFormularioCadastro((p) => ({
                          ...p,
                          dataNascimento: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors [color-scheme:inherit] focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="campoTelefone"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Telefone{" "}
                  <span className="font-normal lowercase text-muted-foreground/60">
                    (opcional)
                  </span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="campoTelefone"
                    type="tel"
                    value={formularioCadastro.telefone}
                    onChange={(e) =>
                      setFormularioCadastro((p) => ({
                        ...p,
                        telefone: e.target.value,
                      }))
                    }
                    placeholder="(11) 99999-9999"
                    className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              >
                {carregando ? "Criando conta..." : "Criar conta"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <a
              href="/"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Voltar para o acervo
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
