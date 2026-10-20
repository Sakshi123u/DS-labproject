import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Sidebar, PageId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { BorrowPage } from './pages/BorrowPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import {
  Book,
  BorrowRecord,
  NotificationItem,
  SystemHealthResponse,
  DashboardStats,
} from './types';

// In AI Studio and Docker/Nginx, relative '/api' points to the API Gateway
const API_BASE = '/api';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowHistory, setBorrowHistory] = useState<BorrowRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);

  // Loading states
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingBorrow, setLoadingBorrow] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Fetch Dashboard Stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      const res = await axios.get<DashboardStats>(`${API_BASE}/dashboard/stats`);
      setDashboardStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // Fetch Books
  const fetchBooks = useCallback(async () => {
    try {
      setLoadingBooks(true);
      const res = await axios.get<Book[]>(`${API_BASE}/books`);
      setBooks(res.data);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  // Fetch Borrow History
  const fetchBorrowHistory = useCallback(async () => {
    try {
      setLoadingBorrow(true);
      const res = await axios.get<BorrowRecord[]>(`${API_BASE}/borrow/history`);
      setBorrowHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch borrow history:', err);
    } finally {
      setLoadingBorrow(false);
    }
  }, []);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const res = await axios.get<NotificationItem[]>(`${API_BASE}/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Fetch System Health
  const fetchSystemHealth = useCallback(async () => {
    try {
      setLoadingHealth(true);
      const res = await axios.get<SystemHealthResponse>(`${API_BASE}/system/health`);
      setSystemHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  // Master refresh function
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      fetchDashboardStats(),
      fetchBooks(),
      fetchBorrowHistory(),
      fetchNotifications(),
      fetchSystemHealth(),
    ]);
    setIsRefreshing(false);
  }, [
    fetchDashboardStats,
    fetchBooks,
    fetchBorrowHistory,
    fetchNotifications,
    fetchSystemHealth,
  ]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // CRUD & Action Handlers
  const handleAddBook = async (bookData: {
    title: string;
    author: string;
    category: string;
    availableQuantity: number;
  }) => {
    const res = await axios.post(`${API_BASE}/books`, bookData);
    if (res.data) {
      setBooks(prev => [res.data, ...prev]);
      fetchDashboardStats();
    }
  };

  const handleEditBook = async (
    id: string,
    bookData: {
      title: string;
      author: string;
      category: string;
      availableQuantity: number;
    }
  ) => {
    const res = await axios.put(`${API_BASE}/books/${id}`, bookData);
    if (res.data) {
      setBooks(prev => prev.map(b => (b._id === id ? res.data : b)));
      fetchDashboardStats();
    }
  };

  const handleDeleteBook = async (id: string) => {
    await axios.delete(`${API_BASE}/books/${id}`);
    setBooks(prev => prev.filter(b => b._id !== id));
    fetchDashboardStats();
  };

  const handleBorrowBook = async (studentName: string, bookId: string) => {
    const res = await axios.post(`${API_BASE}/borrow`, { studentName, bookId });
    if (res.data) {
      // Re-fetch books to reflect updated inventory & history
      await Promise.allSettled([
        fetchBooks(),
        fetchBorrowHistory(),
        fetchNotifications(),
        fetchDashboardStats(),
      ]);
    }
  };

  const handleReturnBook = async (borrowId: string) => {
    const res = await axios.post(`${API_BASE}/return/${borrowId}`);
    if (res.data) {
      await Promise.allSettled([
        fetchBooks(),
        fetchBorrowHistory(),
        fetchNotifications(),
        fetchDashboardStats(),
      ]);
    }
  };

  const handleClearNotifications = async () => {
    await axios.delete(`${API_BASE}/notifications`);
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        notificationCount={notifications.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Navbar
          activePage={activePage}
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onRefresh={refreshAll}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              stats={dashboardStats}
              loading={loadingDashboard}
              onNavigate={page => setActivePage(page)}
            />
          )}

          {activePage === 'books' && (
            <BooksPage
              books={books}
              loading={loadingBooks}
              onRefresh={fetchBooks}
              onAddBook={handleAddBook}
              onEditBook={handleEditBook}
              onDeleteBook={handleDeleteBook}
              onBorrowBook={handleBorrowBook}
            />
          )}

          {activePage === 'borrow' && (
            <BorrowPage
              books={books}
              history={borrowHistory}
              loading={loadingBorrow}
              onBorrow={handleBorrowBook}
              onReturn={handleReturnBook}
            />
          )}

          {activePage === 'notifications' && (
            <NotificationsPage
              notifications={notifications}
              loading={loadingNotifications}
              onRefresh={fetchNotifications}
              onClearAll={handleClearNotifications}
            />
          )}

          {activePage === 'system' && (
            <SystemStatusPage
              health={systemHealth}
              loading={loadingHealth}
              onRefreshHealth={fetchSystemHealth}
            />
          )}
        </main>
      </div>
    </div>
  );
}
