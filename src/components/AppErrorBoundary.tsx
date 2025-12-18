import React from "react";

type State = {
  error: Error | null;
};

/**
 * Captura erros de runtime (tela branca) e exibe uma tela de recuperação.
 * Mantém o app navegável e garante que o erro apareça no console para diagnóstico.
 */
export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[AppErrorBoundary] runtime error:", error);
    console.error("[AppErrorBoundary] component stack:", info.componentStack);
  }

  private handleGoHome = () => {
    window.location.assign("/");
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background">
          <main className="container py-16">
            <section className="mx-auto max-w-2xl bg-card border border-border rounded-xl p-6 text-left">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Ocorreu um erro ao abrir esta página
              </h1>
              <p className="text-muted-foreground mb-4">
                Já registrei o erro no console para diagnóstico. Você pode recarregar ou voltar
                ao início.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={this.handleReload} className="btn-primary">
                  Recarregar
                </button>
                <button onClick={this.handleGoHome} className="btn-secondary">
                  Voltar ao início
                </button>
              </div>

              <details className="mt-5">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Detalhes técnicos
                </summary>
                <pre className="mt-3 text-xs whitespace-pre-wrap break-words bg-muted p-3 rounded-lg border border-border">
                  {this.state.error.message}
                </pre>
              </details>
            </section>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
