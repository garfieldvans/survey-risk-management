import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Notification } from '../api/types';

const POLL_INTERVAL = 60_000; // 60s polling

export function useNotifications(enabled = true) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.notifications.filter((n: Notification) => !n.readAt).length);
    } catch {
      // silent
    }
  }, [enabled]);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    await api.post('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }, []);

  return { notifications, unreadCount, markAllRead, refresh: fetchNotifications };
}