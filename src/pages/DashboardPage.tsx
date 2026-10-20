import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  BookmarkCheck,
  Users,
  ArrowRight,
  Clock,
  PlusCircle,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { PageId } from '../components/Sidebar';

interface DashboardPageProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (page: PageId) => void;
  onQuickBorrow?: (bookId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  loading,
  onNavigate,
}) => {
  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-white rounded-xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white rounded-xl border border-slate-200 p-5 animate-pulse" />
          <div className="h-72 bg-white rounded-xl border border-slate-200 p-5 animate-pulse" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Books',
      value: stats?.totalBooks ?? 0,
      icon: BookOpen,
      subtext: 'Unique titles in catalog',
      accent: 'text-blue-600',
    },
    {
      title: 'Available Copies',
      value: stats?.availableCopies ?? 0,
      icon: CheckCircle2,
      subtext: 'Ready on shelf to borrow',
      accent: 'text-emerald-600',
    },
    {
      title: 'Borrowed Books',
      value: stats?.borrowedBooks ?? 0,
      icon: BookmarkCheck,
      subtext: 'Currently issued to students',
      accent: 'text-amber-600',
    },
    {
      title: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      subtext: 'Unique active borrowers',
      accent: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg bg-slate-50 ${kpi.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {kpi.value}
              </div>
              <p className="text-xs text-slate-500 mt-1">{kpi.subtext}</p>
            </div>
          );
        })}
      </section>

      {/* Quick Action Banner */}
      <section className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold">LibraFlow Operational Console</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Demonstrating inter-service REST calls between Book Service (4001) & Borrow Service (4002)
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('books')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add New Book
          </button>
          <button
            onClick={() => onNavigate('borrow')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            Issue / Return
          </button>
        </div>
      </section>

      {/* Two-column layout for Recent Books and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Added Books */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recently Added Books</h2>
              <p className="text-xs text-slate-500">Latest titles logged in Book Service</p>
            </div>
            <button
              onClick={() => onNavigate('books')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(!stats?.recentBooks || stats.recentBooks.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No books recorded in the catalog yet.
              </div>
            ) : (
              stats.recentBooks.map(book => (
                <div
                  key={book._id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <h3 className="text-sm font-medium text-slate-900 truncate">
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="truncate">{book.author}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-600 font-medium">{book.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-slate-700 font-mono tabular-nums block">
                      {book.availableQuantity} copies
                    </span>
                    <span className="text-[11px] text-slate-500">available</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Borrowing Activity */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Borrowing Activity</h2>
              <p className="text-xs text-slate-500">Transactions processed by Borrow Service</p>
            </div>
            <button
              onClick={() => onNavigate('borrow')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <span>History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No borrowing activity recorded yet.
              </div>
            ) : (
              stats.recentActivity.map(act => (
                <div
                  key={act._id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {act.studentName}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${
                          act.status === 'BORROWED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {act.bookTitle}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(act.borrowDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
