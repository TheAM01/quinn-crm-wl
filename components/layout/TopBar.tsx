"use client";

import { ChevronRight, User, Settings, Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getBreadcrumbs } from "@/utils/breadcrumbs";
import { useUserRole } from "@/hooks/useUserRole";
import { LogoutButton } from "@/components/supabase/logout-button";
import { createClient } from "@/lib/supabase/client";
import React, { useState, useRef, useEffect } from "react";
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface Notification {
    id: string;
    user_id: string;
    message: string;
    is_read: boolean;
    created_at: string;
}
const supabase = createClient();

export default function TopBar() {

    const { user, role, loading, isDeveloper } = useUserRole();
    const pathname = usePathname();
    const router = useRouter();
    const breadcrumbs = getBreadcrumbs(pathname);

    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const badgeStyles: Record<string, string> = {
        super_admin: "text-purple-400",
        admin: "text-blue-400",
        representative: "text-yellow-500",
    };
    const badgeStyle = badgeStyles[role || "representative"];

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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch notifications
    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from("user_notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (error) console.error(error);
            else setNotifications(data);
        };
        void fetchNotifications();
    }, [user]);

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('user_notifications')
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
                    console.log("THERE IS A NOTIFICATION!!!!");
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("✅ Subscription established.");
                } else if (status === 'CHANNEL_ERROR') {
                    console.error("❌ Subscription failed. Congrats, everything is on fire.");
                } else if (status === 'CLOSED') {
                    console.log("🔌 Subscription closed.");
                }
            });

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [user]);


    // Mark notifications as read when notifications dropdown opens
    useEffect(() => {
        if (showNotifications && notifications.length > 0) {
            notifications.forEach(async (n) => {
                if (!n.is_read) {
                    await supabase
                        .from("user_notifications")
                        .update({ is_read: true })
                        .eq("id", n.id);
                }
            });
            // Update local state to reflect read status
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    }, [showNotifications]);

    const menuItems = [
        {
            label: "Account Settings",
            icon: Settings,
            onClick: () => {
                router.push("/settings/account");
                setShowDropdown(false);
            },
        },
        // {
        //     label: "Notifications",
        //     icon: Bell,
        //     onClick: () => {
        //         router.push("/notifications");
        //         setShowDropdown(false);
        //     },
        // },
        // {
        //     label: "Help & Support",
        //     icon: HelpCircle,
        //     onClick: () => {
        //         router.push("/help");
        //         setShowDropdown(false);
        //     },
        // },
    ];

    // if (role === "super_admin" || role === "admin") {
    //     menuItems.push({
    //         label: "Privacy & Security",
    //         icon: Shield,
    //         onClick: () => {
    //             router.push("/settings/security");
    //             setShowDropdown(false);
    //         },
    //     });
    // }

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const recentNotifications = notifications.slice(0, 5);

    return (
        <div className="w-full bg-stone-900 text-white p-3 z-50">
            <div className="flex items-center justify-between">
                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-base">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center">
                            <a
                                href={crumb.href}
                                className={`transition-colors duration-200 ${
                                    index === breadcrumbs.length - 1
                                        ? "text-white font-medium"
                                        : "text-gray-400 hover:text-gray-200"
                                }`}
                            >
                                {crumb.label}
                            </a>
                            {index < breadcrumbs.length - 1 && (
                                <ChevronRight size={16} className="mx-2 text-gray-600" />
                            )}
                        </div>
                    ))}
                </nav>

                {/* Right side - Notifications, User Info and Profile */}
                <div className="flex items-center space-x-4">
                    {!loading && (
                        <div className="flex flex-col gap-1 items-end">
                            <div className="text-xs capitalize">{user?.user_metadata?.name}</div>
                            <div
                                className={`text-xs ${badgeStyle} px-1 py-0.5 rounded-full capitalize font-semibold`}
                            >
                                {role?.replaceAll("_", " ")}
                            </div>
                        </div>
                    )}

                    {/* Notifications Icon with Dropdown */}
                    <div className="relative" ref={notificationsRef}>
                        {(!loading && isDeveloper) && <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-stone-700 transition-colors duration-200 cursor-pointer relative"
                        >
                            <Bell size={20} className="text-gray-300"/>
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>}

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 top-12 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-50 min-w-80 max-w-96">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-stone-700">
                                    <div className="text-sm font-medium text-white">
                                        Notifications
                                    </div>
                                </div>

                                {/* Notifications List */}
                                <div className="max-h-96 overflow-y-auto">
                                    {recentNotifications.length > 0 ? (
                                        recentNotifications.map((notification) => {
                                            const { senderName, content } = parseNotificationMessage(notification.message);
                                            return (
                                                <div
                                                    key={notification.id}
                                                    className="px-4 py-3 hover:bg-stone-700 transition-colors border-b border-stone-700/50 last:border-b-0"
                                                >
                                                    <p className="text-sm text-gray-300 leading-5">
                                                        {senderName && (
                                                            <span className="font-medium px-2 py-1 bg-yellow-300 text-yellow-700 rounded text-xs font-semibold inline-flex items-center leading-2 mr-2">
                                                                {senderName}
                                                            </span>
                                                        )}
                                                        <span>{content}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                            No notifications
                                        </div>
                                    )}
                                </div>

                                {/* See All Button */}
                                {notifications.length > 0 && (
                                    <div className="p-1 border-t border-stone-700">
                                        <button
                                            onClick={() => {
                                                router.push("/notifications");
                                                setShowNotifications(false);
                                            }}
                                            className="w-full py-2 text-sm text-yellow-400 hover:text-yellow-200 font-medium transition-colors cursor-pointer"
                                        >
                                            See all notifications
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Profile Icon with Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-stone-700 transition-colors duration-200 cursor-pointer"
                        >
                            <User size={20} className="text-gray-300" />
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 top-12 bg-stone-800 border border-stone-700 rounded-lg shadow-xl py-2 z-50 min-w-56">
                                {/* User Info Header */}
                                <div className="px-4 py-3 border-b border-stone-700">
                                    <div className="text-sm font-medium text-white">
                                        {user?.user_metadata?.name || "User"}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{user?.email}</div>
                                    <div
                                        className={`text-xs ${badgeStyle} mt-1 inline-block py-0.5 bg-stone-900 rounded-full capitalize font-semibold`}
                                    >
                                        {role?.replaceAll("_", " ")}
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    {menuItems.map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={item.onClick}
                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-stone-700 flex items-center gap-3 transition-colors"
                                        >
                                            <item.icon size={16} />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Logout Button */}
                                <div className="border-t border-stone-700 pt-1">
                                    <div className="px-4 py-2">
                                        <LogoutButton />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}