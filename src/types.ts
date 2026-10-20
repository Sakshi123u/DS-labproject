export interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  availableQuantity: number;
  totalQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BorrowRecord {
  _id: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  borrowDate: string;
  returnDate?: string | null;
  status: 'BORROWED' | 'RETURNED';
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  type: 'BORROW' | 'RETURN' | 'INFO';
  message: string;
  studentName?: string;
  bookTitle?: string;
  timestamp: string;
}

export interface ServiceHealthItem {
  id: string;
  name: string;
  port: number;
  status: 'UP' | 'DOWN';
  latencyMs: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface SystemHealthResponse {
  overallStatus: 'HEALTHY' | 'DEGRADED';
  timestamp: string;
  totalDurationMs: number;
  services: ServiceHealthItem[];
}

export interface DashboardStats {
  totalBooks: number;
  availableCopies: number;
  borrowedBooks: number;
  totalStudents: number;
  recentBooks: Book[];
  recentActivity: BorrowRecord[];
}
