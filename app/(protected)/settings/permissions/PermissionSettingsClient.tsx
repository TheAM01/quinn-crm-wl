"use client";

import React, { useState, useEffect } from "react";
import {
    Shield,
    X,
    Eye,
    Users,
    MessageSquare,
    Archive,
    HelpCircle,
    MessageSquarePlus,
    Megaphone,
    BarChart3,
    Settings,
    KeyRound,
    Hourglass,
    CheckCircle2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type UserRole = "representative" | "admin" | "super_admin";

interface Permission {
    feature: string;
    icon: React.ElementType;
    view: boolean | null;
    create: boolean | null;
    edit: boolean | null;
    delete: boolean | null;
    export: boolean | null;
    import: boolean | null;
}

interface RolePermissions {
    [key: string]: Permission;
}

export default function PermissionsPage() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [userRole, setUserRole] = useState<UserRole>("representative");
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"personal" | "overview">("personal");
    const supabase = createClient();

    // Define all permissions by role
    const rolePermissions: Record<UserRole, RolePermissions> = {
        representative: {
            dashboard: { feature: "Dashboard", icon: Eye, view: true, create: null, edit: null, delete: null, export: null, import: null },
            inbox: { feature: "Inbox", icon: MessageSquare, view: true, create: true, edit: true, delete: true, export: false, import: false },
            broadcast: { feature: "Broadcast", icon: MessageSquarePlus, view: false, create: false, edit: null, delete: null, export: null, import: null },
            waitlist: { feature: "Product Waitlist", icon: Hourglass, view: true, create: null, edit: null, delete: null, export: null, import: null },
            customers: { feature: "Customers", icon: Users, view: false, create: false, edit: false, delete: false, export: false, import: false },
            campaigns: { feature: "Campaigns", icon: Megaphone, view: false, create: false, edit: false, delete: false, export: null, import: null },
            analytics: { feature: "Analytics", icon: BarChart3, view: true, create: null, edit: null, delete: null, export: false, import: null },
            knowledgebase: { feature: "Knowledge Base", icon: Archive, view: true, create: false, edit: false, delete: false, export: false, import: false },
            faqs: { feature: "FAQs", icon: HelpCircle, view: true, create: false, edit: false, delete: false, export: false, import: false },
            team: { feature: "Team Management", icon: Users, view: false, create: false, edit: false, delete: false, export: null, import: null },
            credentials: { feature: "Credentials", icon: KeyRound, view: false, create: false, edit: false, delete: false, export: null, import: null },
            settings: { feature: "Settings", icon: Settings, view: false, create: false, edit: false, delete: false, export: null, import: null },
        },
        admin: {
            dashboard: { feature: "Dashboard", icon: Eye, view: true, create: null, edit: null, delete: null, export: null, import: null },
            inbox: { feature: "Inbox", icon: MessageSquare, view: true, create: true, edit: true, delete: true, export: true, import: true },
            broadcast: { feature: "Broadcast", icon: MessageSquarePlus, view: true, create: true, edit: null, delete: null, export: null, import: null },
            waitlist: { feature: "Product Waitlist", icon: Hourglass, view: true, create: null, edit: null, delete: null, export: null, import: null },
            customers: { feature: "Customers", icon: Users, view: true, create: true, edit: true, delete: true, export: true, import: true },
            campaigns: { feature: "Campaigns", icon: Megaphone, view: true, create: true, edit: true, delete: true, export: null, import: null },
            analytics: { feature: "Analytics", icon: BarChart3, view: true, create: null, edit: null, delete: null, export: true, import: null },
            knowledgebase: { feature: "Knowledge Base", icon: Archive, view: true, create: true, edit: true, delete: true, export: true, import: true },
            faqs: { feature: "FAQs", icon: HelpCircle, view: true, create: true, edit: true, delete: true, export: true, import: true },
            team: { feature: "Team Management", icon: Users, view: true, create: true, edit: true, delete: true, export: null, import: null },
            credentials: { feature: "Credentials", icon: KeyRound, view: false, create: false, edit: false, delete: false, export: null, import: null },
            settings: { feature: "Settings", icon: Settings, view: true, create: null, edit: false, delete: null, export: null, import: null },
        },
        super_admin: {
            dashboard: { feature: "Dashboard", icon: Eye, view: true, create: null, edit: null, delete: null, export: null, import: null },
            inbox: { feature: "Inbox", icon: MessageSquare, view: true, create: true, edit: true, delete: true, export: true, import: true },
            broadcast: { feature: "Broadcast", icon: MessageSquarePlus, view: true, create: true, edit: null, delete: null, export: null, import: null },
            waitlist: { feature: "Product Waitlist", icon: Hourglass, view: true, create: null, edit: null, delete: null, export: null, import: null },
            customers: { feature: "Customers", icon: Users, view: true, create: true, edit: true, delete: true, export: true, import: true },
            campaigns: { feature: "Campaigns", icon: Megaphone, view: true, create: true, edit: true, delete: true, export: null, import: null },
            analytics: { feature: "Analytics", icon: BarChart3, view: true, create: null, edit: null, delete: null, export: null, import: null },
            knowledgebase: { feature: "Knowledge Base", icon: Archive, view: true, create: true, edit: null, delete: true, export: true, import: true },
            faqs: { feature: "FAQs", icon: HelpCircle, view: true, create: true, edit: true, delete: true, export: true, import: true },
            team: { feature: "Team Management", icon: Users, view: true, create: true, edit: true, delete: true, export: null, import: null },
            credentials: { feature: "Credentials", icon: KeyRound, view: true, create: true, edit: true, delete: null, export: null, import: null },
            settings: { feature: "Settings", icon: Settings, view: true, create: true, edit: true, delete: null, export: null, import: null },
        },
    };

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) {
                    console.error('Error fetching user:', error);
                } else {
                    setUser(user);
                    // Get role from app_metadata or user_metadata
                    const role = user?.app_metadata?.role || user?.user_metadata?.role || "representative";
                    setUserRole(role as UserRole);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        void getUser();
        console.log(JSON.stringify(user).split("")[0])
    }, [supabase]);

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case "super_admin":
                return "bg-purple-100 text-purple-700 border-purple-300";
            case "admin":
                return "bg-blue-100 text-blue-700 border-blue-300";
            default:
                return "bg-gray-100 text-gray-700 border-gray-300";
        }
    };

    const getRoleDisplayName = (role: UserRole) => {
        switch (role) {
            case "super_admin":
                return "Super Admin";
            case "admin":
                return "Admin";
            default:
                return "Representative";
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-1 flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Permissions</h2>
                        <p className="text-sm text-gray-600">Loading permissions...</p>
                    </div>
                </div>
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    const currentPermissions = rolePermissions[userRole];
    const canViewOverview = userRole === "admin" || userRole === "super_admin";

    return (
        <div className="space-y-6 flex flex-1 flex-col p-3">
            {/* Header */}
            <div className="bg-white rounded-xl ">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Permissions</h2>
                            <p className="text-sm text-gray-600">View your access rights and capabilities</p>
                        </div>
                    </div>

                    {canViewOverview && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode("personal")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === "personal"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                My Permissions
                            </button>
                            <button
                                onClick={() => setViewMode("overview")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === "overview"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                All Roles
                            </button>
                        </div>
                    )}
                </div>

                {/* Current Role Badge */}
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Your Role:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userRole)}`}>
            {getRoleDisplayName(userRole)}
          </span>
                </div>
            </div>

            {/* Personal View */}
            {viewMode === "personal" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Permissions</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Feature</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">View</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Create</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Edit</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Delete</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Export</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Import</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(currentPermissions).map(([key, perm]) => {
                                const Icon = perm.icon;
                                return (
                                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-gray-600" />
                                                <span className="text-sm font-medium text-gray-900">{perm.feature}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {perm.view === null ? (
                                                <span className="text-gray-400 text-xs">N/A</span>
                                            ) : perm.view ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-400 mx-auto" />
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {perm.create === null ? (
                                                <span className="text-gray-400 text-xs">N/A</span>
                                            ) : perm.create ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-400 mx-auto" />
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {perm.edit === null ? (
                                                <span className="text-gray-400 text-xs">N/A</span>
                                            ) : perm.edit ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-400 mx-auto" />
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {perm.delete === null ? (
                                                <span className="text-gray-400 text-xs">N/A</span>
                                            ) : perm.delete ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-400 mx-auto" />
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {perm.export === null ? (
                                                <span className="text-gray-400 text-xs">N/A</span>
                                            ) : perm.export ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-400 mx-auto" />
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {perm.import === null ? (
                                                <span className="text-gray-400 text-xs">N/A</span>
                                            ) : perm.import ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-400 mx-auto" />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Overview - All Roles */}
            {viewMode === "overview" && canViewOverview && (
                <div className="space-y-6">
                    {(["representative", "admin", "super_admin"] as UserRole[]).map((role) => (
                        <div key={role} className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(role)}`}>
                  {getRoleDisplayName(role)}
                </span>
                                {role === userRole && (
                                    <span className="text-xs text-gray-500">(Your current role)</span>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Feature</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">View</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Create</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Edit</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Delete</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Export</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Import</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(rolePermissions[role]).map(([key, perm]) => {
                                        const Icon = perm.icon;
                                        return (
                                            <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="w-4 h-4 text-gray-600" />
                                                        <span className="text-sm font-medium text-gray-900">{perm.feature}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {perm.view === null ? (
                                                        <span className="text-gray-400 text-xs">N/A</span>
                                                    ) : perm.view ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-red-400 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {perm.create === null ? (
                                                        <span className="text-gray-400 text-xs">N/A</span>
                                                    ) : perm.create ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-red-400 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {perm.edit === null ? (
                                                        <span className="text-gray-400 text-xs">N/A</span>
                                                    ) : perm.edit ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-red-400 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {perm.delete === null ? (
                                                        <span className="text-gray-400 text-xs">N/A</span>
                                                    ) : perm.delete ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-red-400 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {perm.export === null ? (
                                                        <span className="text-gray-400 text-xs">N/A</span>
                                                    ) : perm.export ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-red-400 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {perm.import === null ? (
                                                        <span className="text-gray-400 text-xs">N/A</span>
                                                    ) : perm.import ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-red-400 mx-auto" />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {/* Legend */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Permission Levels</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">Representative</span>
                                <span>Very limited access - Can view and respond to messages</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300">Admin</span>
                                <span>Elevated access - Full CRUD on most features except system settings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">Super Admin</span>
                                <span>Unrestricted access - Full control over all system features</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}