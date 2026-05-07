import { Component, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

class PageErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* log only — do not reset; user must click "Tentar novamente" */ }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <p className="text-error text-sm font-medium">Ocorreu um erro ao carregar esta página.</p>
          <button
            className="mt-3 text-sm text-primary hover:underline"
            onClick={() => this.setState({ hasError: false })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-sidebar pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-container mx-auto px-4 py-6 lg:px-6">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
