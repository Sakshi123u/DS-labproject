import React, { useState } from 'react';
import {
  ArrowLeftRight,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle2,
  BookMarked,
  User,
} from 'lucide-react';
import { Book, BorrowRecord } from '../types';

interface BorrowPageProps {
  books: Book[];
  history: BorrowRecord[];
  loading: boolean;
  onBorrow: (studentName: string, bookId: string) => Promise<void>;
  onReturn: (borrowId: string) => Promise<void>;
}

export const BorrowPage: React.FC<BorrowPageProps> = ({
  books,
  history,
  loading,
  onBorrow,
  onReturn,
}) => {
  const [studentName, setStudentName] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);

  const selectedBook = books.find(b => b._id === selectedBookId);
  const isOutOfStock = selectedBook ? selectedBook.availableQuantity <= 0 : false;

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter student name' });
      return;
    }
    if (!selectedBookId) {
      setStatusMessage({ type: 'error', text: 'Please select a book from the list' });
      return;
    }
    if (isOutOfStock) {
      setStatusMessage({ type: 'error', text: `Cannot borrow: "${selectedBook?.title}" has 0 copies available` });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      await onBorrow(studentName.trim(), selectedBookId);
      setStatusMessage({
        type: 'success',
        text: `Successfully issued "${selectedBook?.title}" to ${studentName.trim()}! Inventory decremented on Book Service.`,
      });
      setStudentName('');
      setSelectedBookId('');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatusMessage({
        type: 'error',
        text: error.message || 'Failed to borrow book',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnClick = async (record: BorrowRecord) => {
    if (record.status === 'RETURNED') {
      setStatusMessage({ type: 'error', text: 'This book has already been marked as returned.' });
      return;
    }

    try {
      setReturningId(record._id);
      setStatusMessage(null);
      await onReturn(record._id);
      setStatusMessage({
        type: 'success',
        text: `Book "${record.bookTitle}" marked as returned by ${record.studentName}! Inventory incremented on Book Service.`,
      });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatusMessage({
        type: 'error',
        text: error.message || 'Failed to process return',
      });
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {/* Simple Borrowing Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <ArrowLeftRight className="w-5 h-5 text-slate-800" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Issue Book to Student</h2>
            <p className="text-xs text-slate-500">
              Dispatches transaction to Borrow Service (Port 4002) with atomic inventory update
            </p>
          </div>
        </div>

        <form onSubmit={handleBorrowSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sakshi Pandharkar"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Select Book */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Book *
              </label>
              <div className="relative">
                <BookMarked className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  required
                  value={selectedBookId}
                  onChange={e => setSelectedBookId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
                >
                  <option value="">-- Choose a book from inventory --</option>
                  {books.map(b => (
                    <option
                      key={b._id}
                      value={b._id}
                      disabled={b.availableQuantity <= 0}
                    >
                      {b.title} — ({b.availableQuantity} available){b.availableQuantity <= 0 ? ' [OUT OF STOCK]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Book Availability Preview */}
          {selectedBook && (
            <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              isOutOfStock ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div>
                <span className="font-semibold">{selectedBook.title}</span> by {selectedBook.author}
              </div>
              <div className="font-mono tabular-nums font-bold">
                {isOutOfStock ? '0 Available (Out of stock)' : `${selectedBook.availableQuantity} Available`}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !studentName.trim() || !selectedBookId || isOutOfStock}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{isSubmitting ? 'Borrowing...' : 'Borrow Book'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Borrowing History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Borrowing History & Active Loans</h2>
            <p className="text-xs text-slate-500">
              Real-time audit log from Borrow Service with Return transaction capability
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 font-medium">
            {history.length} records total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Book Title</th>
                <th className="px-5 py-3">Borrow Date</th>
                <th className="px-5 py-3">Return Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading borrowing history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No borrowing records found. Issue a book above to begin.
                  </td>
                </tr>
              ) : (
                history.map(record => {
                  const isActive = record.status === 'BORROWED';
                  const isProcessing = returningId === record._id;

                  return (
                    <tr
                      key={record._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {record.studentName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <div className="font-medium line-clamp-1">{record.bookTitle}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {record._id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(record.borrowDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {record.returnDate ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {new Date(record.returnDate).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Active loan</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold ${
                            isActive
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {isActive ? (
                          <button
                            onClick={() => handleReturnClick(record)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs"
                            title="Return this book and increase quantity"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                            <span>{isProcessing ? 'Returning...' : 'Return'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Returned
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
