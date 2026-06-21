"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "critical" | "info";
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  addNotification: (title: string, message: string, type: SystemNotification["type"]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const now = new Date();
    return [
      {
        id: "init-alert-1",
        title: "System Online",
        message: "ParkOptic core monitoring initialized for Bengaluru Command Center.",
        type: "info",
        timestamp: new Date(now.getTime() - 1000 * 60 * 12), // 12 mins ago
        read: false,
      },
      {
        id: "init-alert-2",
        title: "Illegal Parking Alert",
        message: "Double parking obstruction reported near Brigade Road Junction.",
        type: "critical",
        timestamp: new Date(now.getTime() - 1000 * 60 * 3), // 3 mins ago
        read: false,
      }
    ];
  });

  const addNotification = useCallback((title: string, message: string, type: SystemNotification["type"]) => {
    const newNotif: SystemNotification = {
      id: `alert-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
