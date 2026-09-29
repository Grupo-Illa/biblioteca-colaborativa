"use client"

import { useRouter } from "next/navigation"
import { BookOpen } from "lucide-react"
import { AuthPanel } from "@/components/auth/auth-panel"

export default function AuthPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-5" />
            </span>
            <div className="leading-none">
              <p className="font-mono text-sm font-semibold tracking-tight">Acervo</p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">Biblioteca interna</p>
            </div>
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <AuthPanel onAuthenticated={() => router.push("/")} />

        <p className="absolute bottom-8 text-center text-xs text-muted-foreground">
          <a href="/" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Voltar para o acervo
          </a>
        </p>
      </main>
    </div>
  )
}
