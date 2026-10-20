import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  BookmarkPlus,
  X,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Book } from '../types';

interface BooksPageProps {
  books: Book[];
  loading: boolean;
  onRefresh: () => void;
  onAddBook: (bookData: { title: string; author: string; category: string; availableQuantity: number }) => Promise<void>;
  onEditBook: (id: string, bookData: { title: string; author: string; category: string; availableQuantity: number }) => Promise<void>;
  onDeleteBook: (id: string) => Promise<void>;
  onBorrowBook: (studentName: string, bookId: string) => Promise<void>;
}

export const BooksPage: React.FC<BooksPageProps> = ({
  books,
  loading,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onBorrowBook,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [borrowingBook, setBorrowingBook] = useState<Book | null>(null);
  const [borrowStudentName, setBorrowStudentName] = useState('');

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    availableQuantity: 1,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive unique categories for clean filter
  const categories = Array.from(new Set(books.map(b => b.category || 'General'))).sort();

  // Filter books
  const filteredBooks = books.filter(b => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCat = categoryFilter === 'ALL' || b.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const openAddModal = () => {
    setFormData({
      title: '',
      author: '',
      category: 'Computer Engineering',
      availableQuantity: 3,
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      availableQuantity: book.availableQuantity,
    });
    setFormError('');
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      setFormError('Title and Author are required.');
      return;
    }
    if (formData.availableQuantity < 0) {
      setFormError('Available quantity cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      if (editingBook) {
        await onEditBook(editingBook._id, formData);
        setEditingBook(null);
      } else {
        await onAddBook(formData);
        setIsAddModalOpen(false);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormError(error.message || 'Failed to save book');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowingBook) return;
    if (!borrowStudentName.trim()) {
      setFormError('Student name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      await onBorrowBook(borrowStudentName.trim(), borrowingBook._id);
      setBorrowingBook(null);
      setBorrowStudentName('');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormError(error.message || 'Borrow failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, author, or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Add Book Button */}
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="px-5 py-3">Book Title</th>
                <th className="px-5 py-3">Author</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">Available Quantity</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && books.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    Loading books from Book Service (Port 4001)...
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">No books found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Click "Add New Book" to seed the catalog'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBooks.map(book => {
                  const isOutOfStock = book.availableQuantity <= 0;
                  return (
                    <tr
                      key={book._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {book.title}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {book._id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                        {book.author}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs text-slate-700">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-bold tabular-nums text-sm ${
                            isOutOfStock ? 'text-red-600' : 'text-slate-900'
                          }`}
                        >
                          {book.availableQuantity}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1">
                          {book.availableQuantity === 1 ? 'copy' : 'copies'}
                        </span>
                        {isOutOfStock && (
                          <span className="block text-[10px] text-red-500 font-medium">
                            Out of stock
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Borrow Action */}
                          <button
                            onClick={() => {
                              setBorrowingBook(book);
                              setBorrowStudentName('');
                              setFormError('');
                            }}
                            disabled={isOutOfStock}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                              isOutOfStock
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800'
                            }`}
                            title={isOutOfStock ? 'No copies available to borrow' : 'Issue to student'}
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>Borrow</span>
                          </button>

                          {/* Edit Action */}
                          <button
                            onClick={() => openEditModal(book)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit book details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Action */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                                onDeleteBook(book._id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete book from catalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      {(isAddModalOpen || editingBook) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingBook ? 'Edit Book Details' : 'Add New Book to Catalog'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingBook(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Operating Systems"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Andrew S. Tanenbaum"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.availableQuantity}
                    onChange={e => setFormData({ ...formData, availableQuantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBook(null);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingBook ? 'Save Changes' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Borrow Modal */}
      {borrowingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Issue Book to Student
              </h3>
              <button
                onClick={() => setBorrowingBook(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickBorrowSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Selected Book
                </span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {borrowingBook.title}
                </p>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <span>Author: {borrowingBook.author}</span>
                  <span aria-hidden="true">·</span>
                  <span>Stock: {borrowingBook.availableQuantity} copies</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={borrowStudentName}
                  onChange={e => setBorrowStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  autoFocus
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Issuing this book triggers an atomic inventory decrement on Book Service (Port 4001) and logs an event in Notification Service (Port 4003).
              </p>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBorrowingBook(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Borrow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
