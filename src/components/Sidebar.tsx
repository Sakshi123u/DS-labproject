import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Bell,
  Activity,
  Library,
  X,
} from 'lucide-react';

export type PageId = 'dashboard' | 'books' | 'borrow' | 'notifications' | 'system';

interface SidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
  notificationCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  isOpen,
  onClose,
  notificationCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
    },
    {
      id: 'books' as PageId,
      label: 'Books',
      icon: BookOpen,
      description: 'Catalog & inventory',
    },
    {
      id: 'borrow' as PageId,
      label: 'Borrow / Return',
      icon: ArrowLeftRight,
      description: 'Lending & returns',
    },
    {
      id: 'notifications' as PageId,
      label: 'Notifications',
      icon: Bell,
      badge: notificationCount > 0 ? notificationCount : undefined,
      description: 'System event log',
    },
    {
      id: 'system' as PageId,
      label: 'System Status',
      icon: Activity,
      description: 'Microservice health',
    },
  ];

  const handleSelect = (pageId: PageId) => {
    setActivePage(pageId);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center bg-slate-900">
              <Library className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                LibraFlow
              </span>
              <span className="text-[11px] text-slate-500 block leading-none">
                Distributed Library
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 md:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Main Menu
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums ${
                      isActive
                        ? 'bg-slate-800 text-slate-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Distributed system footer card */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-700 font-semibold mb-1">
            Distributed Architecture
          </div>
          <div className="text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between items-center">
              <span>Gateway:</span>
              <span className="font-mono text-[10px] text-slate-700">Port 8080</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Services:</span>
              <span className="font-mono text-[10px] text-slate-700">4001, 4002, 4003</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Database:</span>
              <span className="text-[10px] text-slate-700">MongoDB 7.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
