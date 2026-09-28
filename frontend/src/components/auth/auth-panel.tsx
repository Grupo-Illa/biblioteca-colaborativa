"use client"

import { useState } from "react"
import { BookOpen, Mail, Lock, User as UserIcon, Calendar, Phone, Eye, EyeOff, LogIn, UserPlus } from "lucide-react"
import { registerUser, loginUser, type User } from "@/lib/api"
import { cn } from "@/lib/utils"

type Tab = "login" | "register"

type AuthPanelProps = {
  /** Chamado depois de autenticar com sucesso, recebe o usuário do servidor. */
  onAuthenticated: (user: User) => void
  /** Esconde o logo e o título — usado quando o painel já está dentro de uma tela com cabeçalho. */
  compact?: boolean
}

/**
 * Painel de Entrar/Cadastrar. O login é o mesmo para usuário e ADM: quem é
 * ADMIN só recebe recursos extras, decidido pelo backend a partir do banco,
 * nunca por algo que o navegador possa editar.
 */
export function AuthPanel({ onAuthenticated, compact = false }: AuthPanelProps) {
  const [tab, setTab] = useState<Tab>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    birthday: "",
    phone: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await loginUser(loginForm.email, loginForm.password)
    setLoading(false)
    if (result.user) {
      onAuthenticated(result.user)
    } else {
      setError(result.error || result.message || "Erro ao fazer login")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const emailRegex = /^[^\s@]+@grupoilla\.com\.br$/
    if (!emailRegex.test(registerForm.email)) {
      setError("Apenas emails institucionais @grupoilla.com.br são permitidos!")
      return
    }

    setLoading(true)
    const result = await registerUser(registerForm)
    setLoading(false)
    if (result.user) {
      setSuccess("Conta criada com sucesso! Faça login.")
      setTab("login")
      setLoginForm({ email: registerForm.email, password: "" })
      setRegisterForm({ username: "", email: "", password: "", birthday: "", phone: "" })
    } else {
      setError(result.error || result.message || "Erro ao criar conta")
    }
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-border bg-secondary/60 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold/50 focus:ring-2 focus:ring-gold/20"

  return (
    <div className={cn("w-full max-w-md", compact ? "" : "animate-fade-up")}>
      {!compact && (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {tab === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "login"
                ? "Entre com seu email e senha para acessar o acervo"
                : "Preencha os dados para se cadastrar na biblioteca"}
            </p>
          </div>
        </>
      )}

      <div className="mb-6 flex rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => {
            setTab("login")
            setError("")
            setSuccess("")
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            tab === "login"
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
            setTab("register")
            setError("")
            setSuccess("")
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            tab === "register"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <UserPlus className="size-4" />
          Cadastrar
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          {success}
        </div>
      )}

      {tab === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="login-email"
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="seu@grupoilla.com.br"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Sua senha"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="reg-username"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Nome de usuário
            </label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="reg-username"
                type="text"
                required
                value={registerForm.username}
                onChange={(e) => setRegisterForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="Seu nome"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reg-email"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="reg-email"
                type="email"
                required
                value={registerForm.email}
                onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="seu@grupoilla.com.br"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label
                htmlFor="reg-password"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="reg-birthday"
                className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Data de nasc.
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="reg-birthday"
                  type="date"
                  required
                  value={registerForm.birthday}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, birthday: e.target.value }))}
                  className={cn(inputClass, "[color-scheme:inherit]")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reg-phone"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Telefone{" "}
              <span className="font-normal lowercase text-muted-foreground/60">(opcional)</span>
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="reg-phone"
                type="tel"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
      )}
    </div>
  )
}
