import React from 'react';
import { Menu, RefreshCw, Layers } from 'lucide-react';
import { PageId } from './Sidebar';

interface NavbarProps {
  activePage: PageId;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Consolidated microservice metrics and recent activities',
  },
  books: {
    title: 'Books Catalog',
    subtitle: 'Book inventory management and search (Book Service: Port 4001)',
  },
  borrow: {
    title: 'Borrow & Return',
    subtitle: 'Lending workflows and transaction records (Borrow Service: Port 4002)',
  },
  notifications: {
    title: 'System Notifications',
    subtitle: 'Automated event stream (Notification Service: Port 4003)',
  },
  system: {
    title: 'System Status',
    subtitle: 'Microservice health checks and distributed communication topology',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing,
}) => {
  const current = pageTitles[activePage];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>LibraFlow</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-semibold">{current.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight hidden sm:block">
            {current.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 text-xs text-slate-600 bg-slate-100 rounded-md">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>4 Services Connected</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
          title="Refresh current data from backend"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : 'text-slate-500'}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
};
