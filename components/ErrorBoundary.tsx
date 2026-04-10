"use client";

import * as React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.handleReload = this.handleReload.bind(this);
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    console.error("Error boundary caught rendering error:", error);
  }

  private handleReload() {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-[family-name:var(--font-dm-serif-display)] text-3xl text-[var(--ink)]">Vigilo</p>
          <p className="mt-3 text-lg font-semibold text-[var(--ink)]">Something went wrong</p>
          <button
            className="mt-5 rounded-xl bg-[var(--red)] px-4 py-2 text-sm font-medium text-[var(--paper)]"
            onClick={this.handleReload}
            type="button"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
