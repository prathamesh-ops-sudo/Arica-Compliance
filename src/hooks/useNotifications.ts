import { useState, useEffect, useCallback } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Mention Alert",
      message: "TechCrunch mentioned your brand in a new article",
      type: "info",
      read: false,
      createdAt: new Date(),
    },
    {
      id: "2",
      title: "Sentiment Spike Detected",
      message: "Positive sentiment increased by 15% in the last hour",
      type: "success",
      read: false,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: "3",
      title: "Weekly Report Ready",
      message: "Your weekly analytics report is available for download",
      type: "info",
      read: true,
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    setNotifications((prev) => [
      {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date(),
      },
      ...prev,
    ]);
  }, []);

  // Simulate socket 'newAlert' events
  useEffect(() => {
    const interval = setInterval(() => {
      // Placeholder for socket connection - production-safe logging
      if (import.meta.env.DEV) {
        console.log("Checking for new alerts...");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
}
