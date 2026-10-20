import React, { useState } from 'react';
import {
  Bell,
  Trash2,
  BookmarkCheck,
  RotateCcw,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  loading: boolean;
  onRefresh: () => void;
  onClearAll: () => Promise<void>;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  loading,
  onRefresh,
  onClearAll,
}) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    if (notifications.length === 0) return;
    if (confirm('Clear all notifications from the database?')) {
      try {
        setIsClearing(true);
        await onClearAll();
      } finally {
        setIsClearing(false);
      }
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'BORROW':
        return <BookmarkCheck className="w-4 h-4 text-amber-600" />;
      case 'RETURN':
        return <RotateCcw className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card with actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-bold text-slate-900">
              Automated Notification Stream
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Generated autonomously by Notification Service (Port 4003) via asynchronous inter-service REST calls
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClear}
            disabled={isClearing || notifications.length === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'Clearing...' : 'Clear All'}</span>
          </button>
        </div>
      </div>

      {/* Notification Stream List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Fetching notifications from Notification Service...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Events will appear automatically when books are borrowed or returned.
            </p>
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item._id}
              className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700 uppercase text-[10px] tracking-wider">
                    {item.type}
                  </span>
                  {item.studentName && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Student: {item.studentName}</span>
                    </>
                  )}
                  {item.bookTitle && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">Book: {item.bookTitle}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
