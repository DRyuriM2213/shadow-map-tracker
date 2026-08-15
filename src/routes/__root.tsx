import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { MapAreaManager } from "@/components/MapAreaManager";

function NotFoundComponent() {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="dossier max-w-md rounded-sm p-8 text-center"><p className="stamp text-primary">Arquivo não localizado</p><h1 className="mt-2 font-display text-7xl font-bold text-foreground">404</h1><h2 className="mt-2 text-xl font-semibold text-foreground">Essa rota não existe no painel</h2><p className="mt-2 text-sm text-muted-foreground">O endereço pode ser antigo ou ter sido substituído pela versão V2.</p><Link to="/" className="mt-6 inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Voltar ao Painel do Mestre</Link></div></div>;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="dossier max-w-lg rounded-sm p-8 text-center"><p className="stamp text-destructive">Falha ao abrir esta tela</p><h1 className="mt-2 text-2xl font-semibold text-foreground">O restante da sessão continua salvo</h1><p className="mt-2 text-sm text-muted-foreground">Tente recarregar esta rota. Se o problema continuar, volte ao painel e use Imagens / Backup para exportar o estado antes de testar outra coisa.</p><details className="mt-4 rounded-sm border border-border p-3 text-left text-xs text-muted-foreground"><summary className="cursor-pointer">Detalhe técnico</summary><pre className="mt-2 whitespace-pre-wrap">{error.message}</pre></details><div className="mt-6 flex flex-wrap justify-center gap-2"><button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Tentar novamente</button><a href="/" className="inline-flex items-center justify-center rounded-sm border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">Voltar ao painel</a></div></div></div>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Operação Berço Vazio — Painel do Mestre" },
      { name: "description", content: "Painel privado do mestre para condução da campanha Operação Berço Vazio na Universidade Valença." },
      { name: "theme-color", content: "#211b19" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { property: "og:title", content: "Operação Berço Vazio — Painel do Mestre" },
      { property: "og:description", content: "Painel privado de condução da campanha." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return <QueryClientProvider client={queryClient}><Outlet /><MapAreaManager /></QueryClientProvider>;
}
