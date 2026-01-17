"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Bell, CheckCheck, Filter } from "lucide-react";
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import PageLoader from "@/components/ui/PageLoader";

interface Notification {
    id: string;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

const supabase = createClient();

export default function NotificationsPage() {
    const { user, loading } = useUserRole();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    // Parse notification message to extract sender name and content
    const parseNotificationMessage = (message: string): { senderName: string; content: string } => {
        // Match pattern: [email](name): content
        const match = message.match(/^\[([^\]]+)\]\(([^)]+)\):\s*(.*)$/);
        if (match) {
            return {
                senderName: match[2], // The name from (name)
                content: match[3]     // Everything after the colon
            };
        }
        // If pattern doesn't match, return the whole message as content
        return {
            senderName: "",
            content: message
        };
    };

    // Fetch notifications
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            setLoadingNotifications(true);
            const { data, error } = await supabase
                .from("user_notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching notifications:", error);
            } else {
                setNotifications(data || []);
            }
            setLoadingNotifications(false);
        };

        void fetchNotifications();
    }, [user]);

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications_page')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload: RealtimePostgresInsertPayload<Notification>) => {
                    setNotifications(prev => [payload.new, ...prev]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    setNotifications(prev =>
                        prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
                    );
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [user]);

    // Apply filter
    useEffect(() => {
        let filtered = notifications;

        if (filter === "unread") {
            filtered = notifications.filter(n => !n.is_read);
        } else if (filter === "read") {
            filtered = notifications.filter(n => n.is_read);
        }

        setFilteredNotifications(filtered);
    }, [notifications, filter]);

    // Mark as read
    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from("user_notifications")
            .update({ is_read: true })
            .eq("id", id);

        if (error) {
            console.error("Error marking notification as read:", error);
        } else {
            // Update local state immediately
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!user) return;

        const { error } = await supabase
            .from("user_notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (error) {
            console.error("Error marking all as read:", error);
        } else {
            // Update local state immediately
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading || loadingNotifications) {
        return <PageLoader text={"Loading Notifications..."}/>
    }

    return (
        <div className="flex flex-1 p-3">
            <div className="flex flex-1 flex-col">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Bell size={32} className="text-yellow-500" />
                            <h1 className="text-3xl font-bold">Notifications</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        {/* Filter Buttons */}
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-500 mr-2" />
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    filter === "all"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                All ({notifications.length})
                            </button>
                            <button
                                onClick={() => setFilter("unread")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    filter === "unread"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                Unread ({unreadCount})
                            </button>
                            <button
                                onClick={() => setFilter("read")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    filter === "read"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                Read ({notifications.length - unreadCount})
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <CheckCheck size={16} />
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-2">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => {
                            const { senderName, content } = parseNotificationMessage(notification.message);
                            return (
                                <div
                                    key={notification.id}
                                    className={`bg-white border rounded-lg p-4 transition-all hover:shadow-md ${
                                        notification.is_read
                                            ? "border-gray-200"
                                            : "border-blue-400 bg-blue-50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-gray-800 mb-2">
                                                        {senderName && (
                                                            <span className="px-2 py-1 bg-yellow-300 text-yellow-600 rounded text-xs font-semibold inline-flex items-center leading-4 mr-2">
                                                                {senderName}
                                                            </span>
                                                        )}
                                                        <span>{content}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(notification.created_at).toLocaleString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <CheckCheck size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
                            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">
                                {filter === "all"
                                    ? "No notifications yet"
                                    : filter === "unread"
                                        ? "No unread notifications"
                                        : "No read notifications"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}